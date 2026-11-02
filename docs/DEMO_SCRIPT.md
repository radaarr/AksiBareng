# Skrip Demo — AksiBareng

Durasi target **6 menit 30 detik** (maksimum 7 menit), dua skenario end-to-end sesuai `docs/PRD.md` §16. Satu presenter, satu operator (menyiapkan tab & menjalankan transaksi cadangan).

## 1. Sebelum tampil (T−30 menit)

- [ ] `pnpm prisma migrate reset && pnpm prisma db seed` — data demo bersih dan idempoten.
- [ ] Login 4 akun di 4 profil browser berbeda: admin, organizer terverifikasi, organizer belum terverifikasi, relawan.
- [ ] Wallet presenter: jaringan **Sepolia**, saldo ≥ 0.05 ETH testnet; saldo relayer ≥ 0.02 ETH testnet.
- [ ] Kontrak ter-deploy & terverifikasi; alamat di env dan README cocok dengan `deployments/sepolia.json`.
- [ ] Satu donasi pemanasan sudah `CONFIRMED` (agar grafik tidak kosong saat dibuka).
- [ ] Tab yang sudah dibuka: landing, katalog kegiatan, detail `Beach Cleanup Day`, dashboard organizer, kampanye `100 Meals for Cilacap`, halaman transparansi, Etherscan Sepolia.
- [ ] Rekaman cadangan (video 3 menit + screenshot tx hash) tersedia offline.
- [ ] Zoom browser 110%, mode terang, notifikasi desktop dimatikan.
- [ ] Label "SIMULASI — testnet" terlihat di layar donasi.

## 2. Timeline

| Waktu | Layar | Yang dilakukan | Kalimat kunci |
|---|---|---|---|
| 0:00–0:35 | Landing | Tunjukkan dua modul & tiga langkah | "AksiBareng menyatukan pengelolaan relawan dan transparansi donasi. Semua data demo, donasi memakai aset testnet." |
| 0:35–1:10 | Katalog kegiatan | Buka `Beach Cleanup Day`, tunjukkan kuota 12/20 | "Kuota dihitung server, bukan dari tampilan — ini yang mencegah overbooking." |
| 1:10–1:45 | Dashboard organizer | Buat kegiatan baru → publish | "Satu form, langsung tayang. Dulu ini spreadsheet plus grup chat." |
| 1:45–2:15 | Dashboard relawan | Daftar kegiatan → tampilkan QR check-in | "Relawan cukup satu klik. Wallet tidak diperlukan untuk ikut kegiatan." |
| 2:15–2:45 | Scanner organizer | Pindai QR → sukses; **pindai ulang** → tolak | "Kode berlaku 120 detik dan hanya sekali. Ini penolakan replay." |
| 2:45–3:15 | Verifikasi kontribusi | Tandai kontribusi selesai → tampilkan status on-chain | "Check-in bukan klaim kontribusi. Organizer yang memvalidasi." |
| 3:15–3:35 | Riwayat relawan | Buka riwayat → klik tx hash → Etherscan | "Catatan kontribusi terbit on-chain, dapat diperiksa siapa pun." |
| 3:35–4:05 | Kampanye | Organizer belum terverifikasi mencoba buat kampanye → ditolak; admin setujui organisasi | "Hanya organisasi terverifikasi yang boleh menggalang dana." |
| 4:05–4:35 | Review kampanye | Admin review `100 Meals for Cilacap` → aktif | "Setiap kampanye punya rencana penggunaan dana sebelum tayang." |
| 4:35–5:15 | Halaman kampanye | Donasi 0.01 ETH testnet → status `Menunggu konfirmasi` → `Terkonfirmasi`; total naik | "Total hanya bertambah setelah transaksi terkonfirmasi jaringan." |
| 5:15–5:50 | Dashboard transparansi | Tunjukkan terkumpul / digunakan / sisa, kategori pengeluaran, batch distribusi | "Tiga angka berbeda: diterima, digunakan, sisa. Sumber tiap angka diberi label." |
| 5:50–6:15 | Bukti & verifikasi | Buka bukti pengeluaran, klik hash, tunjukkan `recordDistribution` | "Hash membuktikan file tidak berubah — bukan bahwa barang pasti sampai." |
| 6:15–6:30 | Ringkasan | Slide 1 halaman: 3 poin Case 2 | "Alur kerja nyata, data pribadi tetap off-chain, dan peningkatan proses yang kami ukur." |

## 3. Naskah pendek per bagian (bila perlu)

- **Masalah:** "Penyelenggara kegiatan sosial mengelola pendaftaran, tugas, donasi, dan bukti di tempat berbeda. Rekap manual, dan donatur sulit memeriksa penggunaan dana."
- **Solusi:** "AksiKegiatan untuk relawan, AksiPeduli untuk donasi dan distribusi. Blockchain hanya untuk catatan yang perlu diverifikasi."
- **Privasi:** "Nama penerima, alamat, dan dokumen tidak pernah masuk blockchain. Yang on-chain hanya hash dan ID acak."
- **Batasan:** "Kami tidak mengklaim blockchain membuktikan bantuan sampai. Verifikasi manusia tetap ada."

## 4. Data demo yang dipakai

| Item | Nilai |
|---|---|
| Kegiatan | `Beach Cleanup Day`, 20 kuota, 12 terdaftar, 3 posisi (Kebersihan, Logistik, Dokumentasi) |
| Relawan | `relawan@aksibareng.test` — Rani |
| Kampanye | `100 Meals for Cilacap`, target 0,5 ETH testnet, anggaran 3 kategori |
| Donasi | 0,01 ETH testnet dari wallet demo |
| Distribusi | Batch 1: 300 paket disiapkan, 200 diterima → `PARTIALLY_DELIVERED` → diverifikasi |
| Pengeluaran | Bahan makanan 0,02 ETH testnet + nota (hash tercatat) |
| Jaringan | Sepolia `11155111`, explorer `https://sepolia.etherscan.io` |

Semua nama, email, dan organisasi fiktif. Jangan memakai foto orang sungguhan.

## 5. Fallback

| Gangguan | Tindakan |
|---|---|
| RPC Sepolia tidak merespons | Tunjukkan status `Menunggu konfirmasi` + penjelasan retry; lanjut ke segmen lain; buka screenshot tx yang sudah ada |
| Faucet habis / saldo kurang | Sudah ada transaksi pemanasan; gunakan rekaman video untuk segmen donasi |
| Transaksi tertunda > 90 detik | Jangan menunggu di panggung; pindah segmen, kembali di akhir; jelaskan bahwa ini perilaku nyata jaringan |
| `chain-sync` belum jalan | Pemicu manual endpoint internal (aman, idempoten), tunjukkan log |
| Login gagal / sesi hilang | Profil browser cadangan sudah login; jangan mengetik ulang di panggung |
| Proyektor mati / koneksi internet mati | Video cadangan 3 menit |
| Pertanyaan "ini uang nyata?" | Tegaskan: aset testnet, tanpa nilai ekonomi, label tampil di UI |

## 6. Q&A yang harus disiapkan

| Pertanyaan | Jawaban singkat |
|---|---|
| Bagaimana mencegah organizer palsu? | Verifikasi organisasi oleh admin + review kampanye sebelum tayang + kanal laporan; tetap bukan jaminan absolut |
| Apakah donasi bisa pakai Rupiah? | Belum. MVP testnet; integrasi payment provider ada di roadmap dan belum diklaim berfungsi |
| Bagaimana jika transaksi gagal? | Status `RETRY_REQUIRED`, data bisnis tetap, retry idempoten, panel admin untuk memantau |
| Apa yang benar-benar dijamin blockchain? | Catatan tidak mudah diubah dan hash bukti terikat waktu; bukan kebenaran peristiwa |
| Data penerima disimpan di mana? | Off-chain, akses terbatas, tampil agregat; tidak pernah on-chain |
| Bagaimana kuota dicegah bocor? | Lock baris event dalam transaksi + hitung ulang; diuji 50 request paralel |
| Apa peningkatan terukur? | Waktu rekap pendaftaran/tugas/presensi turun X% vs manual pada skenario 20 relawan (angka di `docs/METRICS.md`, sebut hanya bila sudah diukur) |
| Apa yang belum selesai? | Pembayaran fiat, notifikasi, badge, persetujuan dua pihak, audit kontrak pihak ketiga |

## 7. Larangan klaim saat demo

- Jangan menyebut "dana aman di smart contract" — dana demo tidak dikustodi sebagai alur utama (ADR-004).
- Jangan menyebut "bantuan sudah tersalurkan ke penerima" untuk data simulasi.
- Jangan menampilkan angka dampak yang belum diukur.
- Jangan menyebut "terdesentralisasi" untuk bagian yang jelas terpusat (database, verifikasi admin).
- Jangan menampilkan wallet pribadi atau data peserta sungguhan.
