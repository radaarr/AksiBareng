# Rencana Kerja Bagian C — AksiPeduli Depan + Publik

Rencana eksekusi untuk peran **C** (`docs/TEAM_PLAN.md` §1). Dokumen ini menjawab tiga hal: apa yang dikerjakan, **urutan branch**, dan **urutan PR**. Sumber kebenaran tetap `docs/PRD.md` (requirement ID), `docs/API.md` (bentuk HTTP), dan `docs/UI_UX.md` (route & copy).

## 1. Ruang lingkup

| Wilayah file | Isi |
|---|---|
| `app/(public)/**` | Landing, katalog & detail kampanye, transparansi, verifikasi, cara kerja |
| `app/dashboard/organizer/campaigns/**` | Daftar, buat, detail, pengeluaran, distribusi |
| `app/dashboard/admin/campaigns*`, `app/dashboard/admin/organizations` | Antrean review & verifikasi |
| `app/api/v1/campaigns*`, `/donations*`, `/goods-donations*`, `/inventory*`, `/expenses*`, `/distributions*` | Route handler + Zod |

Task: T1.6-ui, T2.1b, T2.8, T3.1, T3.2, T3.3, T3.5, T3.7, T3.8, T3.9, T4.3 (UI), T4.4a, T4.8, T5.2b, T5.3, T5.4 (pencatat), T5.5 (presenter).

**Di luar wewenang C** (jangan diedit; ajukan PR kecil ke pemiliknya):

- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` → A
- `lib/db.ts`, `lib/auth/`, `lib/authz.ts`, `lib/workflow/`, `lib/storage/`, `lib/chain/`, `lib/validation/` → A
- `components/ui/**` → B (C memakai, tidak menduplikasi)

## 2. Kondisi awal & blocker

| Hal | Status per 2 Nov 2026 |
|---|---|
| Repo | Masih hanya dokumen; belum ada `package.json`, `tsconfig`, `app/`, skema Prisma |
| Branch aktif | `feat/aksipeduli-public` (lokal, belum di-push) |
| `pnpm` | Belum terpasang; `corepack enable` gagal `EPERM`. Workaround: `npx pnpm@10` |
| Blocker data | T1.1 (scaffold) dan T1.2 (skema) milik A; T1.3/T1.4 (auth + authz) milik A |

Konsekuensi: pekerjaan C dipecah menjadi **jalur UI mandiri** (fixture) dan **jalur data** (menunggu A). Jangan menunggu kosong — jalur UI dikerjakan lebih dulu.

## 3. Urutan branch & PR

Satu branch per **wilayah kerja**, bukan per task. Cukup **5 branch**; tiap branch boleh menghasilkan 1–2 PR kecil (< 400 baris) agar review tetap ringan.

| # | Branch | Cakupan | PR di dalamnya | Bergantung pada |
|---|---|---|---|---|
| B1 | `feat/aksipeduli-public` *(sudah dibuat)* | C0–C3: scaffold, shell publik, katalog + detail kampanye, transparansi + verifikasi | PR1 scaffold & shell (C0, C1); PR2 katalog & transparansi (C2, C3) | — |
| B2 | `feat/campaign-management` | C4–C6: form kampanye, API kampanye, review admin & verifikasi organisasi | PR1 form + API (C4, C5); PR2 antrean review (C6) | T1.2, T1.3, T1.4, T1.8 |
| B3 | `feat/campaign-funds` | C7–C9: pengeluaran + bukti, verifikasi distribusi, penutupan & laporan akhir | PR1 pengeluaran (C7); PR2 verifikasi + tutup (C8, C9) | B2, T3.6 (B) |
| B4 | `feat/donations-testnet` | C10–C11: intent donasi + polling, wallet opsional | PR1 donasi (C10); PR2 wallet (C11) | T4.2, T4.4b (A) |
| B5 | `feat/demo-and-tests` | C12–C13: test negatif, seed demo + reset | PR1 test negatif (C12); PR2 demo data (C13) | B3 |

Aturan branch:

- Branch hidup maksimal **1 hari**. Setelah PR-nya merge, hapus branch; wilayah berikutnya pakai branch baru.
- Bila satu branch menghasilkan dua PR, PR kedua harus lanjutan sempit — bukan fitur baru.
- Jangan menumpuk branch di atas branch lain. Dependensi belum ada di `main` → tunggu atau kerjakan bagian yang tidak butuh.
- Satu orang cukup punya **satu branch aktif**; branch lama yang menunggu review jangan ditambah isinya.

Rincian tiap potongan kerja di bawah (C0–C13) tetap dipakai sebagai isi PR, bukan sebagai nama branch.

Catatan: C0 **tumpang tindih** dengan T1.1 milik A. Sebelum merge, A harus menyetujui isi `package.json`/config (atau mengambil alih file tersebut) agar tidak ada dua sumber konfigurasi.

## 4. Detail per potongan kerja (C0–C13)

### C0 — Scaffold

- File: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `.gitignore` (bila perlu).
- Skrip wajib: `dev`, `build`, `lint`, `typecheck`, `test` — sesuai `AGENTS.md`.
- Jangan menambahkan Prisma/Auth di PR ini; itu milik A.

### C1 — Public shell

- File: `app/(public)/layout.tsx`, `app/(public)/page.tsx`, `app/(public)/how-it-works/page.tsx`.
- Navigasi hanya menuju route yang sudah ada (hindari 404).
- Footer memuat label: "Semua donasi uang adalah aset testnet Sepolia — bukan uang sungguhan."

### C2 — Katalog & detail kampanye

- File: `app/(public)/campaigns/page.tsx`, `app/(public)/campaigns/[slug]/page.tsx`, komponen lokal di `app/(public)/_components/`.
- Fixture sementara di `lib/fixtures/campaigns.ts`, diberi komentar bahwa sumber akan diganti `GET /api/v1/campaigns`.
- Tiga angka dana wajib terpisah dan berlabel: "Dari blockchain", "Dari catatan organizer".

### C3 — Transparansi & verifikasi

- File: `app/(public)/campaigns/[slug]/transparency/page.tsx`, `app/(public)/verify/page.tsx`.
- Setiap baris aktivitas menampilkan `source`; hash dipotong (mis. `0xabc…123`) + tautan explorer `sepolia.etherscan.io`.
- Tidak menampilkan nama/alamat penerima; hanya agregat.

### C4 — Form kampanye

- File: `app/dashboard/organizer/campaigns/new/page.tsx`, `.../campaigns/page.tsx`, komponen form.
- Anggaran berversi: perubahan tidak menimpa versi lama (tampilkan riwayat) — CAM-03, PRD §9.1.
- Pengguna belum terverifikasi melihat alasan + tautan pengajuan, bukan form kosong.

### C5 — API kampanye

- File: `app/api/v1/campaigns/route.ts`, `app/api/v1/campaigns/[id]/route.ts`, `.../submit/route.ts`, `.../budget/route.ts`.
- Amplop respons `{ data }`, error RFC 7807, status sesuai `docs/API.md` §8.
- Otorisasi lewat `lib/authz.ts` (baca saja), bukan pengecekan di UI.
- Perbarui `docs/API.md` bila ada field/status yang belum tercatat.

### C6 — Review admin

- File: `app/dashboard/admin/campaigns/page.tsx`, `app/dashboard/admin/organizations/page.tsx`, API `/api/v1/admin/campaigns*`.
- Tombol keputusan punya konfirmasi + `note` wajib saat menolak.
- `PAUSED` tidak menghapus data; status lama tetap terlihat di riwayat.

### C7 — Pengeluaran

- File: `app/dashboard/organizer/campaigns/[id]/expenses/**`, API `/api/v1/expenses*`.
- Bedakan jelas: **diajukan**, **disetujui**, **sudah dibayar (dicatat)**.
- Unggah bukti: tipe & ukuran dibatasi; URL bertanda tangan; tidak ada bucket publik.

### C8 — Verifikasi distribusi

- File: `app/dashboard/organizer/campaigns/[id]/distributions/**` (bagian verifikasi & privacy review), API `/api/v1/distributions/{id}/verify`.
- Respons `202` + `anchor.status = PENDING` ditampilkan sebagai "Menunggu konfirmasi", bukan "Terverifikasi".
- Privacy review wajib sebelum bukti boleh tampil di halaman publik.

### C9 — Penutupan kampanye

- File: halaman tutup + laporan akhir, API `/api/v1/campaigns/{id}/close`.
- Laporan akhir memuat rekap: diterima, digunakan, sisa, distribusi terverifikasi, tautan bukti.

### C10–C11 — Donasi & wallet

- File: `app/(public)/campaigns/[slug]/donate/**`, `app/dashboard/me/wallet/**`.
- Alur status: `INTENT → PENDING → CONFIRMED/FAILED`; polling tanpa memblokir halaman.
- Kegagalan wallet/RPC menampilkan "Transaksi gagal di jaringan. Catatan Anda tetap tersimpan."

### C12–C13 — Validasi & demo

- C12: test negatif di `tests/` (Vitest), tambah baris di `docs/TESTING.md`.
- C13: seed demo fiktif, `reset` idempoten; tidak ada data pribadi nyata.

## 5. Urutan eksekusi sesuai kalender lomba

### 5.1 Kalender acara

| Tanggal | Tahap | Yang diserahkan |
|---|---|---|
| 20 Okt–5 Nov 2026 | Free registration | Tim terdaftar + instruksi resmi |
| 10 Nov 2026 | Preliminary submission | Abstrak + bukti twibbon |
| 18 Nov 2026 | Semifinal announcement | — |
| 30 Nov 2026 | Semifinal submission | Proposal + satu video tim |
| 7 Des 2026 | Top 10 announcement | Konfirmasi keikutsertaan Final Day |
| 7–16 Des 2026 | Product improvement | Prototype + rencana penyelesaian |
| 16 Des 2026 | Final Day | Produk + deck + presentasi |

### 5.2 Pemetaan jendela waktu → branch

| Jendela | Fokus C | Branch | Deliverable yang dinilai |
|---|---|---|---|
| 2–5 Nov | Scaffold + shell publik | B1 PR1 | `pnpm dev` jalan, route publik tersedia |
| 5–10 Nov | Katalog + detail kampanye (fixture) | B1 PR2 | Bahan gambar untuk abstrak |
| 10–18 Nov | Transparansi + verifikasi (fixture); siapkan bagian proposal | B1 PR2 lanjut | Tiga angka dana terpisah + label sumber |
| 18–25 Nov | Form kampanye, API kampanye, review admin, donasi tipis | B2 PR1–PR2, B4 PR1 | Alur review → donasi → transparansi bisa direkam |
| 25–28 Nov | **Freeze**, rekam video | — | Video 6,5 menit dari aplikasi nyata |
| 29–30 Nov | Submit proposal + video | — | Berkas terkirim |
| 7–16 Des | Pengeluaran, verifikasi distribusi, tutup kampanye, test negatif, demo data, deck | B3, B5 | Prototype final + rencana penyelesaian |

### 5.3 Batas keras

| Batas | Konsekuensi bila lewat |
|---|---|
| **15 Nov** — putuskan fallback chain (`TEAM_PLAN.md` §8 butir 3) | Video berisiko merekam alur yang tidak stabil |
| **25 Nov** — semua yang tampil di video sudah merge ke `main` | Tidak ada waktu perbaikan sebelum rekaman |
| **29 Nov** — submit (buffer 1 hari) | Kehilangan kesempatan semifinal |

### 5.4 Prioritas potong bila tertinggal

1. CAM-07 (campaign updates) → cukup satu update statis.
2. TRN-07 (unduh laporan akhir) → tampilkan di layar saja.
3. T2.8 (filter katalog).
4. T3.9 (laporan akhir lengkap) → rekap dana sederhana.

Jangan dipotong: review admin (CAM-04), label sumber setiap angka (TRN), dan status transaksi jujur `PENDING/CONFIRMED/FAILED` (DON-03, DON-04).

Fitur P1 **tidak** dikerjakan sebelum 7 Des. Bila A belum menyelesaikan T1.2/T1.3/T1.4 pada 10 Nov: lanjutkan B1/B2 dengan fixture dan eskalasi ke A — **jangan** membuat skema Prisma sendiri.

## 6. Gate yang harus dilewati

| Gate | Syarat untuk C |
|---|---|
| Gate 1 | Semua route privat menolak tanpa sesi; C bisa memakai `requireSession()` |
| Gate 3 | Flow C & D tipis jalan; setiap angka transparansi punya `source` |
| Gate 4 | Minimal 1 donasi `CONFIRMED` dan 1 anchor bukti di Sepolia tampil di UI |

## 7. Aturan per PR

- Judul menyebut requirement ID: `feat(campaigns): review admin + audit [CAM-04]`.
- Sebelum minta review: `pnpm typecheck && pnpm lint && pnpm test` (pakai `npx pnpm@10` selama `pnpm` belum terpasang).
- Perubahan endpoint → perbarui `docs/API.md`; perubahan perilaku pengguna → tambah baris `docs/TESTING.md`; perubahan data → **hanya A** yang boleh mengubah `docs/DATABASE.md` + skema.
- Jangan menduplikasi `components/ui/**`; kalau komponen belum ada, ajukan ke B.
- Label wajib pada setiap nominal uang: **"SIMULASI — aset testnet Sepolia, bukan uang sungguhan"**.

## 8. Checklist sebelum menyatakan selesai

- [ ] State loading, kosong, error, dan pending chain ada di setiap halaman data (`UI_UX.md` §4)
- [ ] Kontras ≥ 4.5:1, target sentuh ≥ 44 px, formulir punya `label` eksplisit
- [ ] Dana terkumpul / digunakan / sisa terpisah dan berlabel sumber
- [ ] Tidak ada status `CONFIRMED` tanpa receipt sukses; kegagalan chain → `RETRY_REQUIRED`, data DB tetap
- [ ] Tidak ada bukti sensitif tampil publik sebelum privacy review
- [ ] Tidak ada identitas/alamat penerima bantuan di UI maupun chain
