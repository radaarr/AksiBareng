# Rencana Pengujian — AksiBareng

Bukti bahwa perilaku yang dijanjikan PRD benar-benar terjadi. Requirement ID merujuk `docs/PRD.md`; kolom "kode" dipakai di nama test.

## 1. Lapisan pengujian

| Lapisan | Tool | Cakupan | Perintah |
|---|---|---|---|
| Unit | Vitest | Fungsi murni: kuota, transisi status, hash, format wei, token HMAC | `pnpm test` |
| Integrasi | Vitest + PostgreSQL sementara | Route handler + Prisma + transaksi/lock | `pnpm test:integration` |
| Kontrak | Hardhat (Mocha/Chai + fuzz) | `DonationTransparency`, `ContributionRegistry` | `pnpm chain:test` |
| End-to-end | Playwright | Dua flow demo, desktop + 390 px | `pnpm test:e2e` |
| Non-fungsional | Lighthouse + axe | Performa halaman katalog, aksesibilitas | `pnpm test:a11y` |

Aturan: test integrasi memakai database terpisah (`DATABASE_URL_TEST`) dan migrasi yang sama; tidak boleh memakai data demo presenter.

## 2. Matriks uji per requirement

### 2.1 Auth & profil

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-01 | AUTH-01, AUTH-02 | Daftar email baru, login, logout | 201/200; cookie httpOnly; setelah logout endpoint privat 401 |
| K-01b | AUTH-01 | 11 percobaan login gagal dalam 15 menit | Percobaan ke-11 → `429 RATE_LIMITED` |
| K-02 | AUTH-03 | Volunteer memanggil endpoint admin/organizer | `403 FORBIDDEN`; tidak ada perubahan data |
| K-02b | AUTH-03 | Body berisi `"role": "ADMIN"` saat register | Role diabaikan, tetap `VOLUNTEER` |
| K-02c | AUTH-03, PRD §14.1 | Organizer B mengubah/membatalkan kegiatan organisasi A | `404` untuk draf, `403` untuk kegiatan publik; data tidak berubah |
| K-02d | AUTH-03 | Relawan memanggil verify kontribusi; organizer memanggil revoke kontribusi | `403`; matriks diuji unit di `tests/auth/authz.test.ts` |
| K-03 | AUTH-04, AUTH-06 | Organizer A mengakses kampanye organisasi B | `404` (resource privat), bukan `200` |
| K-04 | AUTH-05, AUTH-06 | Pengajuan verifikasi → admin approve | `organizations.verification_status=VERIFIED`, role owner `ORGANIZER`, audit log ada |
| K-05 | AUTH-07 | Tautkan wallet dengan tanda tangan valid | `wallet_links.status=VERIFIED` |
| K-05b | AUTH-07 | Tanda tangan dari akun lain / nonce kedaluwarsa | `422`; tidak ada link baru |
| K-05c | AUTH-07 | Wallet yang sudah dipakai akun lain | `409` |
| K-06 | PRD §14.1 | Respons login gagal | Pesan seragam, tidak membocorkan apakah email terdaftar |

### 2.2 Kegiatan & pendaftaran

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-07 | EVT-01, EVT-04 | Organizer membuat kegiatan, publish, pengunjung membuka katalog | Kegiatan tampil; draft tidak tampil |
| K-08 | EVT-02 | Ubah kegiatan setelah `starts_at` | `409 INVALID_STATE_TRANSITION` |
| K-09 | EVT-06, EVT-07 | Daftar dua kali | Pertama 201, kedua `409 ALREADY_REGISTERED`, count tetap 1 |
| K-10 | EVT-08 | Kuota 20, 50 request paralel | Sukses tepat 20, sisanya `409 QUOTA_FULL`; `count == 20` |
| K-11 | EVT-08 | Daftar setelah `registration_closes_at` | `409 REGISTRATION_CLOSED` |
| K-12 | EVT-09, EVT-10 | Riwayat relawan & daftar peserta | Relawan melihat miliknya; organizer melihat peserta event miliknya saja |
| K-13 | EVT-11 | Batalkan kegiatan tanpa alasan | `422`; dengan alasan → status `CANCELLED`, alasan tampil |
| K-14 | SCH-02, SCH-03 | Tempatkan relawan melebihi kuota posisi | `409 QUOTA_FULL`; audit log mencatat pelaku |
| K-15 | SCH-04 | Relawan melihat tugas setelah penempatan diubah | Data terbaru muncul |

### 2.3 Check-in & kontribusi

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-16 | ATT-02, ATT-03 | Scan token valid | `attendance_records` dibuat, status `CHECKED_IN` |
| K-17 | ATT-04 | Token yang sama dipindai dua kali | Kedua → `409 TOKEN_ALREADY_USED` |
| K-18 | ATT-04 | Token setelah 120 detik | `410 TOKEN_EXPIRED` |
| K-18b | ATT-04 | Token sesi milik event lain | `403`; tidak ada record |
| K-19 | ATT-06 | Verify kontribusi dari `REGISTERED` tanpa check-in | `409 INVALID_STATE_TRANSITION` |
| K-20 | ATT-06, ATT-08 | Verify dari `CHECKED_IN` | Status `VERIFIED`; `blockchain_transactions` PENDING; respons 202 |
| K-21 | PRD §13.3 | Simulasi relayer gagal (RPC mati) | Kontribusi tetap `VERIFIED`, tx `RETRY_REQUIRED`, data tidak hilang |
| K-22 | PRD §13.3 | Retry dua kali untuk kontribusi sama | Hanya satu catatan on-chain (`idempotency_key` efektif) |
| K-23 | PRD §9.3 | Admin revoke kontribusi | Status `REVOKED`, alasan tercatat, tidak ada penghapusan baris |

### 2.4 Kampanye & donasi

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-24 | CAM-01 | Organizer belum terverifikasi membuat kampanye | `403 ORGANIZATION_NOT_VERIFIED` |
| K-25 | CAM-03, CAM-04 | Submit tanpa anggaran | `422`; dengan anggaran → `PENDING_REVIEW` |
| K-26 | CAM-04 | Admin approve | `ACTIVE`; muncul di katalog publik |
| K-27 | CAM-04 | Admin reject | `REJECTED` + catatan; tidak tampil publik |
| K-28 | CAM-07 | Ubah target setelah `ACTIVE` | `409`; perubahan rencana hanya via versi anggaran baru, versi lama tersimpan |
| K-61 | CAM-05, CAM-06, TRN-01, TRN-02 | Buka `/campaigns` lalu detail `/campaigns/dapur-umum-cilacap`; buka slug yang tidak ada | Hanya kampanye `ACTIVE`/`CLOSED`/`COMPLETED` tampil; tiga angka dana terpisah dengan badge sumber (`Dari blockchain`/`Dari catatan organizer`); label simulasi tampil; slug tidak dikenal → 404 |
| K-62 | CAM-01, CAM-02, CAM-03, CAM-04 | Form kampanye organizer: login, simpan versi anggaran, kirim; buka sebagai organizer belum terverifikasi | Draf + anggaran versi 1 tersimpan di database; revisi menjadi versi baru, versi lama tetap ada dengan `superseded_at`; kirim → `PENDING_REVIEW`; gate menampilkan alasan + tautan pengajuan, form tidak tampil; label simulasi tampil |
| K-63 | CAM-01, CAM-03, CAM-04 | `POST /campaigns` tanpa sesi / organisasi belum terverifikasi; `PUT /budget` dua kali; `POST /submit` tanpa anggaran lalu dengan anggaran | `401 UNAUTHENTICATED` / `403 ORGANIZATION_NOT_VERIFIED`; versi lama `superseded_at`, versi baru aktif; `422 VALIDATION_ERROR` lalu `200` dengan status `PENDING_REVIEW` |
| K-29 | DON-02, DON-03 | Intent donasi lalu transaksi sukses di Sepolia | `PENDING` → `CONFIRMED`, total naik sekali |
| K-30 | DON-03, DON-05 | Transaksi revert / dibatalkan | `FAILED`; total **tidak** naik |
| K-31 | DON-04 | Kirim `txHash` milik donasi lain | `409`; tidak ada donasi baru tercatat |
| K-32 | DON-06, DON-07 | Riwayat donatur & ringkasan publik | Milik sendiri lengkap; publik hanya agregat tanpa alamat wallet |
| K-33 | PRD §7.6 | Teks/status donasi | Semua nominal memuat label simulasi/testnet |
| K-34 | GDS-03, GDS-04 | Terima 18 dari 20 barang diajukan | Stok bertambah 18 (bukan 20); audit log ada |
| K-35 | GDS-06 | Donasi barang belum diterima | Tidak dihitung sebagai stok |

### 2.5 Pengeluaran & distribusi

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-36 | EXP-02, EXP-03 | Ajukan → setujui → tandai dibayar | `PROPOSED → APPROVED → PAID`, audit log tiap transisi |
| K-37 | EXP-03 | `PROPOSED → PAID` langsung | `409 INVALID_STATE_TRANSITION` |
| K-38 | EXP-05 | Pengeluaran melebihi dana terkonfirmasi | `409 EXPENSE_EXCEEDS_FUNDS` dengan selisih |
| K-39 | EXP-04 | Unggah bukti | `sha256` dihitung server, `chain_hash` tersimpan, URL publik tidak dapat diakses tanpa sesi |
| K-40 | DST-03 | Alokasi melebihi stok | `409 INSUFFICIENT_STOCK`; stok tidak berubah |
| K-41 | DST-05 | Relawan memanggil verify distribusi | `403`; admin/verifikator berhasil |
| K-42 | DST-06 | Kirim 200 dari 300 yang disiapkan | `quantity_received=200`, batch `PARTIALLY_DELIVERED` |
| K-43 | DST-07 | Verifikasi batch | `blockchain_transactions{RECORD_DISTRIBUTION}` dibuat, hash = manifest tersimpan |
| K-44 | PRD §7.9 | Foto bukti dengan `privacy_review=PENDING` | Tidak tampil di endpoint publik |

### 2.6 Transparansi & privasi

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-45 | TRN-02 | Halaman transparansi | Terkumpul − digunakan = sisa; tiap angka punya `source` |
| K-46 | TRN-06 | Link explorer | URL benar untuk `chainId 11155111` |
| K-47 | PRD §14.2 | Snapshot respons publik (events, campaigns, transparency, verify) | Tidak ada `email`, `phone`, `passwordHash`, `address` donatur, nama penerima |
| K-48 | PRD §10.4 | Review payload on-chain (unit test kontrak) | Hanya `bytes32`/`address`/`uint`; tidak ada `string` bebas |
| K-49 | PRD §19 | Pencarian kode | Tidak ada data pribadi di seed publik/commit |
| K-60 | PRD §12, UI_UX §2 | Landing dan halaman cara kerja | `/` dan `/how-it-works` terbuka; label SIMULASI tampil; navigasi tidak menuju route yang belum ada |

### 2.7 Unggahan & keamanan umum

| Kode | Requirement | Kasus | Ekspektasi |
|---|---|---|---|
| K-50 | PRD §14.1 | Upload `.svg`, `.exe`, atau file 20 MB | `415` / `413`; tidak tersimpan |
| K-51 | PRD §14.1 | Upload JPEG dengan EXIF GPS | Tersimpan tanpa metadata lokasi |
| K-52 | PRD §14.1 | Mutasi tanpa header `Origin` valid | `403` |
| K-53 | PRD §14.1 | Cerita kampanye berisi `<script>` | Tersimpan tersanitasi, tidak dieksekusi |
| K-54 | PRD §14.1 | Query `q` berisi `' OR 1=1 --` | Hasil kosong/aman, tidak ada error SQL bocor |

### 2.8 Non-fungsional

| Kode | Aspek | Target |
|---|---|---|
| K-55 | Performa katalog | p75 LCP < 1.5 s (Lighthouse mobile, throttle 4G) |
| K-56 | Respons API baca | p95 < 400 ms pada 20 request/detik |
| K-57 | Aksesibilitas | axe: 0 pelanggaran serius pada 8 halaman utama |
| K-58 | Responsif | Tidak ada scroll horizontal pada 360 px |
| K-59 | Chain down | Semua dashboard terbuka < 2 s dengan RPC dimatikan |

## 3. Skenario kritis (wajib diperlihatkan saat demo)

1. **Kuota atomik (K-10)** — buktikan tidak ada oversubscription dengan 50 request paralel; tampilkan `count == quota`.
2. **QR anti-replay (K-17)** — pindai dua kali, tampilkan pesan penolakan.
3. **Kegagalan chain tidak merusak data (K-21, K-22)** — matikan RPC atau pakai transaksi revert, tunjukkan status `RETRY_REQUIRED` + retry berhasil tanpa duplikasi.
4. **Gating organisasi (K-24)** — organizer belum terverifikasi ditolak menerbitkan kampanye.
5. **Donasi gagal tidak menambah total (K-30)**.
6. **Tidak ada PII publik (K-47)** — tunjukkan snapshot respons.

## 4. Data uji

- Seed fiktif: 2 organisasi, 3 kegiatan (draft/published/ongoing), 3 kampanye (draft/active/closed), 20 relawan sintetis `relawan01..20@aksibareng.test`.
- Wallet: alamat testnet baru untuk demo; jangan pakai wallet pribadi.
- Database uji terpisah dari database demo.

## 5. CI

```yaml
# ringkas
- pnpm typecheck
- pnpm lint
- pnpm test
- pnpm test:integration     # service postgres
- pnpm chain:test
- pnpm test:e2e             # hanya pada PR ke main
```

Gagal pada typecheck/lint/test = tidak boleh merge. Coverage minimum untuk `lib/workflow/` dan `lib/authz.ts`: 80%.

## 6. Batas pengujian (jujur)

- Tidak ada pengujian beban produksi; target hanya membuktikan perilaku benar pada MVP.
- Tidak ada audit keamanan pihak ketiga.
- Testnet dapat berubah status (faucet, RPC); test kontrak dijalankan lokal + satu smoke test Sepolia.
- Uji aksesibilitas otomatis tidak menggantikan uji dengan pembaca layar sungguhan.
