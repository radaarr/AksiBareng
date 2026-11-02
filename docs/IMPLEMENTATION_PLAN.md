# Rencana Implementasi — AksiBareng MVP

Urutan kerja berdasarkan `docs/PRD.md` §18. Dokumen ini bukan estimasi waktu; fokusnya urutan, ketergantungan, dan batas "selesai". Setiap task menyebut requirement ID yang dibuktikan.

**Jalur kritis demo:** T1.2 → T1.4 → T2.1 → T2.3 → T2.6 → T2.7 → T2.9 → T4.4 → T4.6 → T5.3. Jika waktu habis, potong dari luar jalur ini.

## Fase 1 — Fondasi

| ID | Task | Requirement | Deliverable | Bergantung pada |
|---|---|---|---|---|
| T1.1 | Setup repo: Next.js 15 + TS strict + Tailwind + ESLint + Vitest + Playwright | — | `pnpm dev` jalan, CI dasar | — |
| T1.2 | Skema Prisma sesuai `docs/DATABASE.md` + migrasi + seed idempoten | — | `prisma migrate dev` bersih, 4 akun demo | T1.1 |
| T1.3 | Auth.js credentials, Argon2id, session cookie, `requireSession()` | AUTH-01, AUTH-02 | Register/login/logout berfungsi | T1.2 |
| T1.4 | `lib/authz.ts` + guard role per route | AUTH-03 | Test negatif 401/403 lulus | T1.3 |
| T1.5 | Profil pengguna (nama tampilan, anonim) | AUTH-04 | `PATCH /users/me` | T1.3 |
| T1.6 | Organisasi + pengajuan verifikasi + review admin | AUTH-05, AUTH-06 | Role organizer naik setelah disetujui | T1.4 |
| T1.7 | Layout dashboard 3 role + navigasi + halaman publik kosong | — | Rute `docs/UI_UX.md` ada | T1.4 |
| T1.8 | Audit log helper + penulisan pada aksi mutasi | PRD §11.1 | `audit_logs` terisi | T1.2 |

**Selesai bila:** pengguna dapat mendaftar, login, mengajukan organisasi, dan admin menyetujuinya; semua halaman privat menolak akses tanpa sesi.

## Fase 2 — AksiKegiatan

| ID | Task | Requirement | Deliverable |
|---|---|---|---|
| T2.1 | CRUD kegiatan + publish/close/cancel + katalog publik | EVT-01…05, EVT-11 | Organizer membuat kegiatan, pengunjung melihatnya |
| T2.2 | Pendaftaran dengan lock kuota + pencegahan duplikat | EVT-06…08 | 50 request paralel tanpa oversubscription |
| T2.3 | Daftar peserta, riwayat relawan | EVT-09, EVT-10 | Dashboard kedua sisi |
| T2.4 | Posisi tugas + kuota + penempatan | SCH-01…04 | Penempatan melebihi kuota ditolak |
| T2.5 | Sesi check-in + token HMAC 120 s + nonce sekali pakai | ATT-01…05 | Replay ditolak `409` |
| T2.6 | Scanner QR di dashboard organizer | ATT-03 | Check-in < 3 detik di ponsel |
| T2.7 | Validasi kontribusi + transisi status | ATT-06, ATT-07 | `REGISTERED→CHECKED_IN→VERIFIED` |
| T2.8 | Filter katalog kategori/tanggal/status (P1) | EVT-12 | — |

**Selesai bila:** Flow A (`docs/FLOWS.md` §1) berjalan end-to-end tanpa menyentuh database manual, dan status kontribusi on-chain masih `PENDING` (bukan `CONFIRMED` palsu).

## Fase 3 — AksiPeduli

| ID | Task | Requirement | Deliverable |
|---|---|---|---|
| T3.1 | CRUD kampanye + anggaran berversi + submit | CAM-01…03, CAM-07 | Gating `ORGANIZATION_NOT_VERIFIED` |
| T3.2 | Review admin (approve/reject/pause) + audit | CAM-04, PRD §9.1 | Status berubah hanya oleh admin |
| T3.3 | Halaman kampanye publik + ringkasan dana | CAM-05, CAM-06, TRN-01…03 | Membedakan terkumpul/digunakan/sisa |
| T3.4 | Donasi barang + penerimaan + inventaris | GDS-01…06 | Stok tidak bisa negatif |
| T3.5 | Pengeluaran + unggah bukti + persetujuan | EXP-01…05 | Bukti privat, hash tersimpan |
| T3.6 | Batch distribusi + item + bukti + transisi status | DST-01…04, DST-06 | Alokasi > stok ditolak |
| T3.7 | Verifikasi distribusi + privacy review bukti | DST-05 | Hanya verifikator/admin |
| T3.8 | Laporan transparansi publik + label sumber data | TRN-04…06 | Setiap angka punya `source` |
| T3.9 | Laporan akhir + penutupan kampanye (P1 untuk unduh) | CAM-08, TRN-07 | — |

**Selesai bila:** Flow C dan D berjalan; dashboard membedakan dana diterima, digunakan, dan sisa; tidak ada bukti sensitif yang tampil publik sebelum privacy review.

## Fase 4 — Web3

| ID | Task | Requirement | Deliverable |
|---|---|---|---|
| T4.1 | Kontrak + test Hardhat sesuai `docs/SMART_CONTRACTS.md` §8 | PRD §10 | `pnpm chain:test` hijau |
| T4.2 | Deploy Sepolia + verifikasi + grant role terpisah | — | `deployments/sepolia.json` |
| T4.3 | Koneksi wallet opsional + challenge tanda tangan | AUTH-07 | Address terverifikasi di `wallet_links` |
| T4.4 | Intent donasi + `donate()` + polling status | DON-02…04 | Status `INTENT→PENDING→CONFIRMED/FAILED` |
| T4.5 | Indexer event + cursor + rekonsiliasi total | DON-05, TRN-06 | Total dihitung dari log terkonfirmasi |
| T4.6 | Anchor kontribusi lewat relayer + idempotency | ATT-08 | Retry tidak menggandakan catatan |
| T4.7 | Anchor hash bukti pengeluaran & distribusi | EXP-04, DST-07 | `evidenceHash` di chain + manifest di DB |
| T4.8 | Halaman verifikasi catatan + link explorer | TRN-06 | Publik dapat memeriksa |
| T4.9 | Penanganan gagal/retry + panel admin | PRD §13.3 | `RETRY_REQUIRED` dapat di-retry |

**Selesai bila:** demo memperlihatkan satu donasi terkonfirmasi dan satu kontribusi terbit di Sepolia dengan tx hash asli yang dapat dibuka di explorer, dan kegagalan chain tidak merusak data.

## Fase 5 — Validasi & demo

| ID | Task | Requirement | Deliverable |
|---|---|---|---|
| T5.1 | Test end-to-end Flow A & B (Playwright) | PRD §19 | Dua skrip hijau |
| T5.2 | Test negatif: kuota, duplikat, QR replay, RBAC, transisi status | `docs/TESTING.md` | Matriks uji terpenuhi |
| T5.3 | Data demo + reset script + akun presenter | `docs/DEMO_SCRIPT.md` | Demo dapat diulang dari nol |
| T5.4 | Uji sebelum/sesudah (baseline manual vs aplikasi) | PRD §15.3 | Angka di `docs/METRICS.md` |
| T5.5 | Latihan demo 3× + fallback (video/rekaman tx) | PRD §16 | Demo lancar ≤ 7 menit |
| T5.6 | Audit akhir: tidak ada data pribadi on-chain, tidak ada klaim fiat | PRD §19 | Checklist DoD terisi |

## Urutan pemotongan bila waktu kurang

1. P1: filter katalog (T2.8), notifikasi, badge, ekspor laporan, dua pihak approval.
2. `releaseFunds()` sebagai alur demo (tetap ada di kontrak, tidak dipakai) — ADR-004.
3. `campaign updates` (CAM-07) → cukup satu update statis.
4. Indexer realtime → polling cron 1 menit sudah cukup.
5. Yang **tidak boleh** dipotong: kuota, anti-duplikat, QR anti-replay, otorisasi server, pemisahan data on/off-chain, label simulasi, penanganan tx gagal.

## Definition of Done (ringkas dari PRD §19)

- [ ] AUTH-01…07 terbukti dengan test.
- [ ] EVT-06…11 terbukti, termasuk 50 request paralel tanpa oversubscription.
- [ ] QR sekali pakai; replay ditolak dan tercatat.
- [ ] Kontribusi `VERIFIED` terbit on-chain dan dapat diverifikasi publik.
- [ ] Kampanye hanya aktif setelah review admin; organizer belum terverifikasi ditolak.
- [ ] Donasi testnet terkonfirmasi menambah total; gagal tidak menambah.
- [ ] Donasi barang menambah stok; distribusi tidak melebihi stok.
- [ ] Bukti pengeluaran/distribusi punya hash + `privacy_review`.
- [ ] Dashboard memisahkan dana diterima, digunakan, sisa, dan sumber datanya.
- [ ] Tidak ada data pribadi di chain/storage publik.
- [ ] Semua label simulasi tampil di UI dan materi demo.
- [ ] Responsif di 360 px dan 1280 px; kontras ≥ 4.5:1.

## Peran kerja

Pembagian pemilik per task, wilayah file, gate antar fase, dan ritme kerja ada di [`docs/TEAM_PLAN.md`](TEAM_PLAN.md). Dokumen ini hanya mengatur **urutan**; `TEAM_PLAN.md` mengatur **siapa**.
