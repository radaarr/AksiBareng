# Pembagian Tugas Tim — AksiBareng

Rencana kerja untuk **3 orang**. Mengacu pada `docs/IMPLEMENTATION_PLAN.md` (task ID) dan `docs/PRD.md` (requirement ID). Isi kolom nama dengan anggota tim sebelum mulai.

Prinsip: **bagi per alur vertikal, bukan per lapisan.** Satu orang memegang platform & Web3; dua orang memegang modul produk sehingga tidak ada yang menganggur menunggu API.

## 1. Peran

| Kode | Peran | Fokus | Nama |
|---|---|---|---|
| **A** | Platform & Web3 | Skema, auth, otorisasi, audit, storage, kontrak, deploy, indexer | |
| **B** | AksiKegiatan + UI kit | Kegiatan, kuota, tugas, QR, kontribusi + komponen UI bersama | |
| **C** | AksiPeduli depan + publik | Kampanye, review, donasi, transparansi, halaman publik | |

A adalah **integration captain**: hanya dia yang merge ke `main` dan hanya dia yang membuat migrasi database.

## 2. Wilayah file (kepemilikan eksklusif)

| Wilayah | Pemilik | Catatan |
|---|---|---|
| `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts` | A | B/C minta perubahan lewat chat |
| `lib/db.ts`, `lib/auth/`, `lib/authz.ts`, `lib/workflow/`, `lib/storage/`, `lib/chain/`, `lib/validation/{common,auth}.ts` | A | `lib/workflow/` (mesin) hanya A; tabel transisinya boleh ditambah B/C lewat PR kecil |
| `lib/validation/{event,registration,task,attendance,contribution}.ts` | B | Wajib memakai `toFieldIssues()` dari `common.ts` |
| `lib/validation/{campaign,donation,goods,expense,distribution}.ts` | C | Wajib memakai `toFieldIssues()` dari `common.ts` |
| `contracts/**`, `deployments/**` | A | |
| `app/api/v1/auth*`, `/users*`, `/organizations*`, `/internal*`, `/admin/organizations*`, `/admin/audit*`, `/admin/transactions*` | A | |
| `components/ui/**` | B | C memakai, **tidak** menduplikasi |
| `app/api/v1/events*`, `/tasks*`, `/task-assignments*`, `/registrations*`, `/attendance*`, `/contributions*` | B | Termasuk `GET /users/me/registrations` (proyeksi domain pendaftaran) |
| `app/dashboard/organizer/events/**` | B | |
| `app/api/v1/campaigns*`, `/donations*`, `/goods-donations*`, `/inventory*`, `/expenses*`, `/distributions*` | C | Kecuali yang disepakati di §3.5 |
| `app/(public)/**`, `app/dashboard/admin/campaigns*` | C | |
| `app/dashboard/organizer/campaigns/**` | C | |
| `docs/**` | semua | Ikut PR masing-masing; A menjaga konsistensi akhir |

Aturan: perubahan di luar wilayah sendiri **wajib** lewat PR kecil yang direview pemiliknya — bukan commit langsung.

Catatan: `app/api/v1/users/me/route.ts` dan `app/api/v1/users/me/registrations/route.ts` adalah dua file terpisah — yang pertama milik A, yang kedua milik B.

## 3. Papan tugas

Beban: **S** ≈ setengah hari, **M** ≈ satu hari, **L** ≈ dua hari (untuk satu orang).

### Fase 1 — Fondasi

| Task | Requirement | Pekerjaan | Pemilik | Beban | Deliverable |
|---|---|---|---|---|---|
| T1.1 | — | Setup repo, TS strict, Tailwind, ESLint, Vitest, Playwright, CI | A | M | `pnpm dev` jalan, CI hijau |
| T1.2 | — | Skema Prisma + migrasi + seed idempoten + 4 akun demo | A | L | `migrate reset && seed` bersih |
| T1.3 | AUTH-01, 02 | Auth.js credentials, Argon2id, cookie sesi | A | M | Login/logout berfungsi |
| T1.4 | AUTH-03 | `lib/authz.ts` + `requireSession()` + guard per route | A | M | Test 401/403 lulus |
| T1.5 | AUTH-04 | Profil: nama tampilan, mode anonim | A | S | `PATCH /users/me` |
| T1.6 | AUTH-05, 06 | Organisasi + pengajuan verifikasi + review admin (API) | A | M | Role naik hanya via admin |
| T1.6-ui | AUTH-06 | Layar admin verifikasi organisasi | C | S | Antrean + approve/reject |
| T1.7 | — | Layout dashboard 3 role, navigasi, halaman publik kosong | B | M | Route `docs/UI_UX.md` §2 ada |
| T1.8 | PRD §11.1 | Helper audit log + dipakai di semua mutasi | A | S | `audit_logs` terisi |
| T1.9 | — | UI kit: Button, Card, StatusBadge (label §3 UI_UX), Table, EmptyState, FormField | B | M | Dipakai B & C, kontras & target 44 px |

**Gate 1:** semua bisa login; halaman privat menolak tanpa sesi; B & C tidak lagi memblokir.

### Fase 2 — AksiKegiatan

| Task | Requirement | Pekerjaan | Pemilik | Beban |
|---|---|---|---|---|
| T2.1a | EVT-01…03, 11 | API kegiatan: CRUD, publish, close, cancel + transisi status | B | L |
| T2.1b | EVT-04, 05 | Halaman publik katalog + detail kegiatan | C | M |
| T2.2 | EVT-06…08 | Pendaftaran + lock kuota + anti duplikat | B | M |
| T2.3 | EVT-09, 10 | Riwayat relawan & daftar peserta | B | S |
| T2.4 | SCH-01…04 | Posisi tugas + kuota + penempatan (SCH-06 hapus penempatan = P1, setelah kuota) | B | M |
| T2.5 | ATT-01, 02, 04 | Sesi check-in + token HMAC 120 s + nonce | B | M |
| T2.6 | ATT-03, 05 | Scanner QR di dashboard organizer + fallback kode manual | B | M |
| T2.7 | ATT-06, 07 | Validasi kontribusi + transisi status | B | S |
| T2.8 | EVT-12 | Filter katalog (P1, hanya jika gate 3 sudah lewat) | C | S |

**Gate 2:** Flow A jalan end-to-end, 50 request paralel tidak melampaui kuota (K-10).

### Fase 3 — AksiPeduli

| Task | Requirement | Pekerjaan | Pemilik | Beban |
|---|---|---|---|---|
| T3.1 | CAM-01…03, 07 | API + form kampanye, anggaran berversi, submit | C | L |
| T3.2 | CAM-04, §9.1 | Review admin: approve/reject/pause + audit | C | M |
| T3.3 | CAM-05, 06, TRN-01…03 | Halaman kampanye publik + ringkasan dana | C | M |
| T3.4 | GDS-01…06 | Donasi barang + penerimaan + inventaris | B | M |
| T3.5 | EXP-01…05 | Pengeluaran + unggah bukti + persetujuan | C | M |
| T3.6 | DST-01…04, 06 | Batch distribusi + item + bukti + transisi | B | M |
| T3.7 | DST-05 | Verifikasi distribusi + privacy review bukti | C | S |
| T3.8 | TRN-04…06 | Laporan transparansi publik + label sumber data | C | M |
| T3.9 | CAM-08, TRN-07 | Laporan akhir + penutupan kampanye (P1 untuk unduh) | C | S |

**Gate 3:** Flow C dan D tipis jalan; angka transparansi punya `source`.

Catatan: T3.4 dan T3.6 dikerjakan B **setelah** Gate 2, karena itu wilayah yang paling bisa dipotong tanpa merusak demo inti.

### Fase 4 — Web3

| Task | Requirement | Pekerjaan | Pemilik | Beban |
|---|---|---|---|---|
| T4.1 | PRD §10 | Dua kontrak + unit/fuzz test | A | L |
| T4.2 | — | Deploy Sepolia + verifikasi + grant role **terpisah dari admin** | A | M |
| T4.3 | AUTH-07 | Challenge tanda tangan wallet + halaman wallet | A (API) + C (UI) | M |
| T4.4a | DON-02…04 | Intent donasi + kirim `donate()` + polling status (UI) | C | M |
| T4.4b | DON-02…04 | Lapisan chain: ABI, klien viem, verifikasi tx hash | A | M |
| T4.5 | DON-05, TRN-06 | Indexer event + cursor + rekonsiliasi total | A | M |
| T4.6 | ATT-08 | Anchor kontribusi via relayer + idempotency | A | M |
| T4.7 | EXP-04, DST-07 | Anchor hash bukti pengeluaran & distribusi | A | M |
| T4.8 | TRN-06 | Halaman verifikasi catatan + link explorer | C | S |
| T4.9 | PRD §13.3 | Penanganan gagal/retry + panel admin transaksi | A | M |

**Gate 4:** minimal 1 donasi `CONFIRMED` dan 1 kontribusi terbit di Sepolia dengan tx hash asli; 1 kegagalan disimulasikan dan ditangani.

### Fase 5 — Validasi & demo

| Task | Requirement | Pekerjaan | Pemilik | Beban |
|---|---|---|---|---|
| T5.1 | — | E2E Flow A & B (Playwright) | B | M |
| T5.2a | PRD §19 | Test negatif API: kuota, duplikat, QR replay, RBAC | B | M |
| T5.2b | PRD §19 | Test negatif transisi status, stok, pengeluaran, PII publik | C | M |
| T5.3 | — | Seed data demo + reset script + akun presenter | C | S |
| T5.4 | PRD §15.3 | Uji sebelum/sesudah + isi tabel `METRICS.md` | A (fasilitator) + C (pencatat) | M |
| T5.5 | PRD §16 | Latihan demo 3× + rekaman cadangan | B (operator), C (presenter) | M |
| T5.6 | PRD §19 | Audit akhir: PII on-chain, klaim fiat, label simulasi | A (lead) + semua | S |

## 4. Beban per orang (perkiraan)

| Fase | A | B | C |
|---|---|---|---|
| 1 | L + M + M + M + S + M + S | M (layout) + M (UI kit) | S (admin verifikasi) |
| 2 | review + mulai kontrak | L + M + S + M + M + M + S | M (katalog publik) |
| 3 | mulai indexer | M + M (setelah Gate 2) | L + M + M + M + S + M + S |
| 4 | L + M + M + M + M + M + M | bantu test | M + S + S |
| 5 | M (metrik) + S (audit) | M + M + M | M + M + S |

C paling padat di Fase 3. Mitigasi: A mengambil T3.5 (pengeluaran) bila Fase 4 sudah stabil, atau B mulai T3.6 lebih awal.

## 5. Urutan eksekusi & titik tunggu

```text
Hari 1 pagi   A: T1.1 → T1.2 (schema) ──► B & C mulai kerja setelah schema ada
              B: T1.7 + T1.9 (tidak butuh schema)
              C: skeleton halaman publik (data seed)
Hari 1 sore   A: T1.3 → T1.4 → deploy kontrak (T4.1 sempit, T4.2)
              B: T2.1a    C: T3.1
Hari 2        Gate 2 (Flow A) ──► A mulai T4.5/T4.6, B pindah T3.4
              C: T3.3 + T4.4a
Hari 3        Gate 3 + Gate 4 ──► freeze, T5.x
```

Yang **tidak boleh** terjadi: B atau C membuat `prisma/schema.prisma` sendiri, atau membuat klien Prisma baru di `lib/`.

## 6. Non-kode

| Item | Pemilik | Kapan |
|---|---|---|
| Slide / pitch | C | Disusun paralel Fase 3, angka hanya dari `METRICS.md` |
| Operator demo (tab, transaksi cadangan) | B | Latihan mulai Gate 4 |
| Rekaman fallback | B | Satu hari sebelum presentasi |
| Pengukuran sebelum/sesudah | A + C | 2 jam sebelum freeze |
| Penjaga konsistensi dokumen | A | Setiap merge |

## 7. Ritme kerja

- **Sinkron 10 menit, 2× sehari** (pagi: rencana, sore: demo).
- **Sore = demo walk.** Jalankan alur yang sudah selesai di `main`, bukan di laptop masing-masing.
- **PR < 400 baris**, review oleh pemilik wilayah; A merge ke `main`.
- **`main` harus selalu bisa `migrate reset && seed`.**
- **DB lokal per orang** (Docker); hanya laptop presenter memakai DB demo.
- **Kunci/kunci rahasia** lewat password manager, tidak pernah di chat; relayer hanya dipegang A dan presenter.
- **Dokumen ikut PR** (`AGENTS.md` §Alur kerja).

## 8. Aturan potong & fallback (disepakati di awal)

1. Urutan potong: P1 (filter, notifikasi, badge, ekspor) → `releaseFunds` sebagai alur demo → campaign updates → indexer realtime.
2. **Tidak boleh dipotong:** kuota atomik, anti-duplikat, QR anti-replay, otorisasi server, label simulasi, penanganan tx gagal, pemisahan PII on/off-chain.
3. **Fallback chain (putuskan sebelum Fase 4):** bila donasi on-chain belum stabil, gabungkan registry ke satu kontrak dan demo chain hanya lewat `ContributionRegistry` (PRD §10.2).
4. Bila sisa waktu < 4 jam sebelum presentasi: **tidak ada fitur baru**, hanya perbaikan yang menghalangi demo.

## 9. Checklist harian

- [ ] Semua PR hari ini sudah di-merge A, `main` hijau (`typecheck`, `lint`, `test`).
- [ ] Demo walk sore berhasil sampai tahap terakhir yang diklaim.
- [ ] Tidak ada migrasi liar; `prisma/migrations` hanya bertambah dari A.
- [ ] `docs/` yang terdampak sudah diperbarui di PR yang sama.
- [ ] Blocker besok sudah ditulis (siapa, apa, butuh siapa).
