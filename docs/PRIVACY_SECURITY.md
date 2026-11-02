# Privasi & Keamanan — AksiBareng

Kontrol yang wajib ada sebelum demo. Rujukan requirement: `docs/PRD.md` §14, §9, §10.4.

## 1. Klasifikasi data

| Kelas | Contoh | Penyimpanan | Akses | Boleh on-chain? |
|---|---|---|---|---|
| **Publik** | Judul kegiatan, deskripsi kampanye, kota, jadwal, target, total donasi agregat, status distribusi | PostgreSQL | Tanpa login | Hanya hash/ID/nominal |
| **Internal** | Daftar peserta, rekap pengeluaran, stok inventaris, audit log | PostgreSQL | Login + role | Tidak |
| **Sensitif** | Email, telepon, hash kata sandi, alamat wallet, dokumen verifikasi, nota/invoice | PostgreSQL + object storage privat | Pemilik + admin (dengan log) | Tidak |
| **Sangat sensitif** | Identitas/alamat/kondisi penerima bantuan, foto wajah, dokumen identitas | PostgreSQL terbatas + bucket privat, `privacy_review` | Organizer terkait + admin | **Tidak pernah** |

Aturan: kelas **Sangat sensitif** tidak boleh muncul di endpoint publik, log, pesan error, materi presentasi, atau data seed yang di-commit.

## 2. Minimisasi data (apa yang dikumpulkan & alasannya)

| Form | Field | Alasan | Boleh tidak diisi |
|---|---|---|---|
| Registrasi | email, kata sandi, nama tampilan | Akun & identitas tampilan | nama boleh nama panggilan |
| Profil | nama tampilan, area, minat | Personalisasi katalog | ya |
| Pendaftaran kegiatan | catatan kebutuhan khusus | Keselamatan relawan | ya, dan tidak wajib rinci |
| Donasi uang | nama tampilan / anonim, nominal | Pengakuan & rekap | ya (anonim) |
| Donasi barang | jenis, jumlah, kondisi, metode serah | Logistik | catatan opsional |
| Penerima bantuan | kode batch, jumlah, area umum | Distribusi | **tidak ada** field identitas di MVP |
| Bukti pengeluaran/distribusi | file, keterangan | Akuntabilitas | ya |

Yang **tidak** dikumpulkan sama sekali di MVP: NIK, tanggal lahir penerima, koordinat rumah, nomor rekening, foto KTP penerima, riwayat kesehatan.

## 3. Larangan on-chain (mengikat, non-negotiable)

Dilarang menulis ke kontrak atau storage publik:

- Nama lengkap, email, telepon, NIK, tanggal lahir.
- Alamat rumah, koordinat, peta lokasi penerima.
- Kondisi kesehatan/ekonomi rinci, foto wajah penerima.
- Dokumen asli (nota, invoice, KTP) atau base64-nya.
- Cerita kampanye bebas teks (bisa memuat nama/alamat).
- IP address, user agent, session id.

Yang diizinkan: `bytes32` hash, ID acak, alamat wallet pelaku transaksi, nominal, timestamp, status ringkas.

## 4. Threat model

| # | Ancaman | Vektor | Kontrol | Diuji oleh |
|---|---|---|---|---|
| T1 | Pengambilalihan akun | Brute force / credential stuffing | Argon2id (memory 64 MB, iterasi 3), rate limit 10/15 menit, pesan error seragam | `TESTING.md` K-01 |
| T2 | Eskalasi hak akses | Memanggil endpoint admin / mengubah role lewat body | Role dibaca dari DB, `authz.ts` deny-by-default, tidak ada endpoint ubah role | K-02 |
| T3 | IDOR / akses lintas organisasi | Menebak UUID resource organisasi lain | Filter `organizationId` dari sesi + `404` untuk resource privat | K-03 |
| T4 | Replay QR check-in | Screenshot QR dibagikan | Token HMAC 120 s, `nonce` unik di DB, satu sesi satu pemakaian | K-04 |
| T5 | XSS pada cerita kampanye | HTML/JS di deskripsi | Sanitasi server (allowlist markdown), escape di render, CSP `script-src 'self'` | K-05 |
| T6 | SQL injection | Input mentah ke query | Prisma parameterized; tidak ada `$queryRawUnsafe` | K-06 |
| T7 | CSRF | Form pihak ketiga | Cookie `SameSite=Lax` + cek `Origin`/`Sec-Fetch-Site` pada mutasi | K-07 |
| T8 | Unggahan berbahaya | File `.exe`/SVG/PDF berisi JS, EXIF berisi koordinat | Cek magic bytes, tolak SVG, strip EXIF, batas 8 MB & 5 file, bucket privat, `Content-Disposition: attachment` | K-08 |
| T9 | Kebocoran PII lewat API publik | `SELECT *` di endpoint publik | Selector eksplisit + test snapshot respons publik | K-09 |
| T10 | Phishing wallet | Meminta seed phrase / tanda tangan buta | Hanya `personal_sign` pesan berisi domain + nonce + tujuan; pesan ditampilkan sebelum tanda tangan; tidak pernah meminta seed | K-10 |
| T11 | Kompromi relayer | Env bocor → dana/role disalahgunakan | Role terpisah (`RECORDER`/`ISSUER`), tanpa `DEFAULT_ADMIN`, hanya testnet, rotasi kunci, alert saldo menipis | K-11 |
| T12 | Bug kontrak | Reentrancy, akses salah, duplikasi | `nonReentrant`, `AccessControl`, cek duplikat `bytes32`, unit + fuzz test | K-12 |
| T13 | Manipulasi angka donasi | Klien mengirim total sendiri | Total dihitung dari event chain terkonfirmasi, bukan input klien | K-13 |
| T14 | Enumerasi donatur | Iterasi endpoint donasi | Endpoint publik hanya agregat; donasi individual hanya untuk pemilik | K-14 |
| T15 | Kebocoran lewat log | PII di console/log | Logger terstruktur tanpa PII, `ip_hash` bukan IP, redaksi field sensitif | K-15 |
| T16 | Supply chain | Paket berbahaya | Lockfile, `pnpm audit` di CI, minim dependensi | K-16 |
| T17 | Penyalahgunaan kampanye | Organizer palsu | Verifikasi organisasi + review admin + kanal laporan | K-17 |
| T18 | Klaim palsu (fiat/simulasi) | Copy UI menyesatkan | Label simulasi wajib, tidak ada status "pembayaran berhasil" untuk fiat | K-18 |

## 5. Spesifikasi token check-in

```
payload  = base64url({ rid, sid, nonce, exp })
token    = payload + "." + base64url(HMAC-SHA256(payload, QR_TOKEN_SECRET))
```

| Aturan | Nilai |
|---|---|
| Masa berlaku | 120 detik |
| Sekali pakai | `UNIQUE(token_nonce)` di `attendance_records` |
| Terikat sesi | `sid` harus sesi `OPEN` milik event yang sama |
| Terikat pendaftaran | `rid` harus `REGISTERED` (bukan `CANCELLED`) |
| Rotasi | Token baru per tampilan QR; token lama tetap kedaluwarsa |
| Penyimpanan | Tidak disimpan; hanya `nonce` setelah dipakai |
| Kegagalan | `410 TOKEN_EXPIRED`, `409 TOKEN_ALREADY_USED`, `403` untuk sesi bukan miliknya |

`QR_TOKEN_SECRET` berbeda dari `AUTH_SECRET` dan dirotasi bila diduga bocor (token otomatis tidak valid).

## 6. Penanganan file

| Tahap | Kontrol |
|---|---|
| Terima | Batas 8 MB, maks 5 file/entitas, `multipart` divalidasi server |
| Identifikasi | Magic bytes: JPEG `FF D8 FF`, PNG `89 50 4E 47`, PDF `%PDF`; `Content-Type` klien diabaikan |
| Bersihkan | Strip EXIF/GPS, re-encode gambar, PDF tidak dieksekusi |
| Simpan | Nama UUID, bucket privat, tanpa public ACL |
| Akses | Presigned URL ≤ 5 menit; hanya organizer pemilik, admin, atau verifikator |
| Publikasi | Hanya `privacy_review = APPROVED`; `REDACTED` untuk foto yang menampilkan orang/alamat |
| Hapus | File yatim (tanpa referensi DB) dibersihkan job mingguan |

## 7. Privasi penerima bantuan

- Tidak ada akun penerima; data disimpan seminimal mungkin (kode batch, jumlah, area umum).
- Dokumentasi publik memakai agregat: "300 paket makanan disalurkan di 3 kelurahan", bukan nama/alamat/foto wajah.
- Foto yang memuat wajah/plat/alamat wajib `REDACTED` sebelum dipublikasikan; default `PENDING` = tidak terlihat publik.
- Konfirmasi penerimaan (P1) memakai kode sekali pakai tanpa akun, tanpa nomor telepon.

## 8. Hak subjek data (sederhana, sesuai kapasitas MVP)

| Hak | Implementasi |
|---|---|
| Akses | Dashboard menampilkan data sendiri: profil, pendaftaran, donasi, kontribusi |
| Koreksi | `PATCH /users/me`; koreksi data lain lewat admin dengan audit log |
| Penghapusan | Permintaan hapus → akun `DELETED`, PII di-anonimkan; catatan donasi/kontribusi tetap sebagai catatan agregat tanpa identitas |
| Keberatan publikasi | `is_public_name = false` → nama tampil "Donatur anonim" |

Catatan jujur di UI: transaksi wallet di blockchain publik tetap dapat dilihat siapa pun, dan anonimisasi di aplikasi tidak menghapus jejak on-chain.

## 9. Retensi

| Data | Retensi MVP | Setelahnya |
|---|---|---|
| Akun aktif | selama akun aktif | — |
| Akun dihapus | 30 hari (masa tenggang) | PII dihapus, ID dipertahankan untuk integritas laporan |
| Bukti pengeluaran/distribusi | 12 bulan | Arsip privat atau hapus dengan catatan |
| Dokumen verifikasi organisasi | 12 bulan setelah verifikasi | Hapus dokumen, simpan status |
| Log aplikasi | 30 hari | Agregasi tanpa PII |
| Audit log | 24 bulan | Ringkasan tahunan |

## 10. Respons insiden (minimum)

1. Nonaktifkan akun/kampanye terdampak (admin) — aksi tercatat di audit log.
2. `pause()` kontrak bila menyangkut dana testnet.
3. Rotasi `INDEXER_RELAYER_PRIVATE_KEY` dan `QR_TOKEN_SECRET` bila relevan.
4. Catat kronologi, dampak, dan tindakan; simpan di `docs/` bila insiden demo.
5. Beri tahu pengguna terdampak bila ada data sensitif yang terekspos.

## 11. Checklist audit sebelum demo

- [ ] `grep -r "0x[a-fA-F0-9]\{40\}"` tidak menemukan alamat hardcoded di luar `deployments/`.
- [ ] `.env` tidak ada di repo; `.env.example` hanya placeholder.
- [ ] Tidak ada `SELECT *` di endpoint publik.
- [ ] Respons publik diperiksa: tidak memuat `email`, `phone`, `passwordHash`, `address` donatur, atau data penerima.
- [ ] Semua endpoint privat diuji tanpa sesi → `401`, dengan role salah → `403`.
- [ ] Token QR diuji: kedaluwarsa, dipakai dua kali, sesi milik event lain.
- [ ] Upload diuji dengan file salah tipe, file > 8 MB, dan file dengan EXIF.
- [ ] Total donasi hanya bertambah setelah `CONFIRMED`.
- [ ] Label "SIMULASI — testnet" tampil di halaman donasi, struk, dan dashboard transparansi.
- [ ] Log tidak memuat email/token/alamat wallet lengkap.
- [ ] `pnpm audit` tidak memuat kerentanan high/critical yang belum dimitigasi.

## 12. Di luar cakupan MVP (jangan diklaim)

- Audit keamanan pihak ketiga atau sertifikasi kepatuhan.
- Enkripsi at-rest kustom (mengandalkan penyedia database/storage).
- Kepatuhan UU PDP penuh, perizinan penggalangan dana, atau kewajiban pajak.
- Perlindungan terhadap analisis chain tingkat lanjut.
- Multi-signature produksi dan manajemen kunci perangkat keras.
