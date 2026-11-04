# Rencana Kerja — Peran B (AksiKegiatan + UI kit)

Dokumen kerja pribadi untuk pemilik wilayah **B** pada `docs/TEAM_PLAN.md` §1. Isinya: kondisi repo saat ini, prasyarat dari A, urutan slice vertikal (API + halaman dalam satu PR), dan bukti "selesai" per requirement.

Sumber kebenaran tetap `docs/PRD.md` (perilaku), `docs/DATABASE.md` (bentuk data), `docs/API.md` (bentuk kontrak HTTP), `docs/RBAC.md` (akses), `docs/FLOWS.md` (transisi status), `docs/UI_UX.md` (tampilan), `docs/TESTING.md` (bukti).

---

## 1. Wilayah milik B (jangan keluar tanpa PR kecil)

| Wilayah | Isi |
|---|---|
| `components/ui/**` | UI kit bersama; C memakai, tidak menduplikasi |
| `app/api/v1/events*`, `/tasks*`, `/attendance*`, `/contributions*` | API AksiKegiatan |
| `app/dashboard/organizer/events/**` | 6 halaman dashboard organizer |
| `app/dashboard/**` (layout & navigasi, T1.7) | Shell 3 role, termasuk halaman `/dashboard/me/events` dan `/dashboard/me/contributions` |

Di luar itu (Prisma, `lib/db.ts`, `lib/auth/`, `lib/authz.ts`, `lib/workflow/`, `lib/validation/`, `lib/storage/`, `lib/chain/`, `contracts/`) milik A — perubahan lewat PR kecil yang direview A.

---

## 2. Kondisi repo saat ini (hasil audit, bukan asumsi)

| Yang sudah ada | Bukti |
|---|---|
| Scaffold Next.js 15 + TS strict + Tailwind + Vitest + Playwright | `package.json`, `tests/scaffold.test.ts`, `e2e/smoke.spec.ts` |
| Skema Prisma lengkap untuk AksiKegiatan (events, event_tasks, event_registrations, task_assignments, attendance_sessions, attendance_records, contributions) + migrasi constraint | `prisma/schema.prisma`, `prisma/migrations/*_constraints/` |
| Seed demo: `Beach Cleanup Day` (20 kuota, 12 terdaftar, 3 posisi), 4 akun demo + 11 relawan | `prisma/seed.ts` |
| Auth credentials, `requireActor()`/`requireSession()` | `lib/auth/config.ts`, `lib/auth/session.ts` |
| `lib/authz.ts` (`can()`/`assertCan()`) + pemetaan error akses | `lib/authz.ts`, `lib/api/access.ts`, `tests/auth/authz.test.ts` |
| UI kit bersama | `components/ui/**`, `tests/ui/status.test.ts` |
| Amplop error RFC 7807, CSRF check, rate limit | `lib/api/problem.ts`, `lib/api/csrf.ts`, `lib/api/rate-limit.ts` |
| Form login/register | `app/(auth)/login`, `app/(auth)/register` |

| Yang **belum** ada dan menghambat B | Dampak |
|---|---|
| `lib/workflow/` (mesin transisi, `docs/FLOWS.md` §5) | Belum ada; A menulis mesinnya, B menambah baris transisi event & registration lewat PR kecil |
| Helper `audit_logs` (T1.8) | A menaruh penulisan audit di dalam `assertTransition`; audit untuk pembuatan entitas (mis. `POST /events`) belum dijanjikan |
| `app/dashboard/page.tsx` masih placeholder ("T1.7 akan menggantikan") | T1.7 belum jalan |
| Tidak ada library QR (`qrcode`/scanner) di `package.json` | T2.6 tidak bisa dikerjakan |
| Seed hanya punya 1 kegiatan `PUBLISHED` | K-07 butuh kegiatan `DRAFT` untuk membuktikan draft tidak tampil; demo butuh sesi check-in |

`QR_TOKEN_SECRET` sudah tersedia di `.env.example` — cukup isi di `.env` lokal, tidak perlu tambah variabel baru.

---

## 3. Hasil kesepakatan dengan A

Sebagian sudah masuk `main` (`1ed416e`: `lib/authz.ts`, `lib/api/access.ts`, katalog error lengkap, `toFieldIssues()`).

| Topik | Keputusan A |
|---|---|
| `can()` | Murni peran + kepemilikan, **tanpa query DB**. Kuota, deadline pembatalan, dan status `CHECKED_IN` wajib dicek di route/domain |
| Daftar action | `event:*`, `registration:*`, `task:*`, `attendance:*`, `contribution:*` — cukup. `PUBLISHED → ONGOING` dan `REGISTERED → NO_SHOW` tidak dipicu endpoint, jadi tidak perlu action baru, termasuk `event:complete` |
| `lib/workflow/` | Mesin (`assertTransition`, tulis `audit_logs` before/after, `409 INVALID_STATE_TRANSITION`) ditulis A. Tabel transisi hanya data; baris **event & registration** jadi tanggung jawab B lewat PR kecil |
| Guard domain | Syarat `>= 1 kategori`, `kuota > 0`, `ends_at > starts_at` **tidak** masuk tabel transisi — ditulis di modul domain milik B |
| Route | `GET /users/me/registrations`, `POST /registrations/{id}/checkin-token`, `DELETE /task-assignments/{id}` resmi milik B. `GET /users/me/registrations` **wajib** memfilter `userId: actor.id` dari sesi, bukan dari query |
| Zod | File per domain milik B, wajib memakai `toFieldIssues()` dari `common.ts` agar error selalu `422` + `errors[]` |
| Prioritas | SCH-06 (hapus penempatan) P1 — dikerjakan **setelah** kuota & anti duplikat beres, jangan sampai menahan T2.2 |

Catatan pemakaian: `registration:create` hanya mengizinkan `VOLUNTEER` (organizer/admin tidak mendaftar dengan akunnya), dan `assertCan()` melempar `AccessDeniedError` yang diterjemahkan lewat `accessProblem(error, instance)` di `lib/api/access.ts`.

Sisa ketergantungan: PR `lib/workflow/` dari A, plus pertanyaan apakah audit penulisan entitas baru juga disediakan di luar `assertTransition`. Sampai itu masuk, pekerjaan yang bisa jalan: S1 shell dashboard, skema Zod, dan modul guard domain.

---

## 4. Slice kerja (API + halaman dalam satu PR, bukan API dulu lalu menunggu)

Beban mengikuti `docs/TEAM_PLAN.md` §3: S ≈ ½ hari, M ≈ 1 hari, L ≈ 2 hari.

### S0 — UI kit (T1.9, M) — ✅ selesai di `components/ui/`

`components/ui/`:

| Komponen | Kewajiban dari `docs/UI_UX.md` |
|---|---|
| `Button` | target ≥ 44×44 px, fokus ring 2 px, varian primary/secondary/danger, state `disabled` + `aria-busy` |
| `Card` | wadah data; judul heading berurutan, bukan `<div>` bergaya judul |
| `StatusBadge` | **seluruh** nilai di `docs/UI_UX.md` §3 (32 baris, termasuk `PENDING`/`CONFIRMED`/`RETRY_REQUIRED` tx dan `ORGANIZATION_NOT_VERIFIED`); ikon + teks, bukan warna saja; label Indonesia, tidak pernah enum mentah |
| `Table` | di < 640 px berubah jadi kartu berlabel, tanpa scroll horizontal di 360 px |
| `EmptyState` | penjelasan + satu aksi utama; copy mengikuti contoh §4 ("Belum ada kegiatan. Buat kegiatan pertama.") |
| `FormField` | `label` eksplisit, `aria-describedby` untuk error, error `role="alert"` di dekat field |
| `Skeleton`, `ErrorState` (pesan manusia + "Coba lagi" + kode error kecil), `Alert` (info/peringatan/sukses) | wajib karena state loading/error/pending harus ada di setiap halaman data (§4) |

Status: 13 file di `components/ui/` + `tests/ui/status.test.ts` (36 test). Sisa: halaman contoh/showcase belum dibuat — menyusul di S1 saat shell dashboard tersedia.

### S1 — Shell dashboard 3 role (T1.7, M) — bisa dikerjakan sekarang

- `app/dashboard/layout.tsx`: sidebar organizer/admin, navigasi bawah untuk volunteer (< 640 px), item menu difilter per `actor.role`.
- Ganti `app/dashboard/page.tsx` placeholder: redirect ke `/dashboard/organizer`, `/dashboard/admin`, atau `/dashboard/me` sesuai role.
- Kerangka halaman kosong untuk route B: `/dashboard/me/events`, `/dashboard/me/contributions`, dan 6 route organizer di §1.
- Tanpa sesi → `requireSession()` sudah mengalihkan ke `/login`; role salah → 403 dengan penjelasan peran yang dibutuhkan (bukan halaman kosong).
- Tidak ada tautan mati ke halaman milik C; pakai item menu yang menunggu rute C sebagai "segera hadir" atau sembunyikan.

### S2 — Kegiatan: CRUD + publish/close/cancel + 3 halaman (T2.1a, L)

API (`docs/API.md` §4): `GET /events` (publik, hanya `PUBLISHED`/`ONGOING`), `GET /events/{id}`, `POST /events`, `PATCH /events/{id}`, `POST /events/{id}/publish`, `POST /events/{id}/close-registration`, `POST /events/{id}/cancel`.

Aturan yang wajib, bukan opsional:

- `PATCH` ditolak `409 INVALID_STATE_TRANSITION` bila `starts_at` sudah lewat (EVT-02, K-08).
- `publish` syarat `docs/FLOWS.md` §3.1: kategori ada, kuota > 0, periode valid, `starts_at` di masa depan.
- `cancel` wajib alasan; tanpa alasan → `422` (K-13). Alasan tampil di halaman detail peserta.
- `close-registration` menyetel `registration_closes_at = now()`.
- `GET /events` publik memakai selector eksplisit: tanpa `createdBy`, tanpa data organisasi non-publik, tanpa jumlah peserta detail.
- Semua mutasi menulis `audit_logs` dengan `before`/`after` + alasan bila ada.

Halaman: `/dashboard/organizer/events` (tabel + StatusBadge + EmptyState), `/events/new` (form + validasi klien yang mencerminkan Zod server), `/events/[id]` (detail, kuota terpakai/sisa, daftar peserta, aksi publish/close/cancel dengan dialog alasan).

Tes: K-07, K-08, K-13 (unit transisi + integrasi route).

### S3 — Pendaftaran + kuota atomik + daftar peserta (T2.2 M, T2.3 S)

API: `POST /events/{id}/registrations` 🔑, `DELETE /events/{id}/registrations/me`, `GET /events/{id}/registrations`, `GET /users/me/registrations`.

Penegakan kuota (`docs/DATABASE.md` §4) — implementasi konkret:

```ts
await prisma.$transaction(async (tx) => {
  const [event] = await tx.$queryRaw<EventRow[]>`
    SELECT id, quota, status, "registrationOpensAt", "registrationClosesAt"
    FROM events WHERE id = ${eventId} FOR UPDATE`
  // 1) cek status/periode → 409 REGISTRATION_CLOSED / EVENT_NOT_OPEN
  // 2) hitung REGISTERED + CHECKED_IN + VERIFIED → 409 QUOTA_FULL
  // 3) create + audit_log dalam transaksi yang sama → 409 ALREADY_REGISTERED (unique eventId,userId)
})
```

- `Idempotency-Key` wajib untuk endpoint 🔑 (`docs/API.md` §1); konflik payload berbeda → `409 IDEMPOTENCY_CONFLICT`.
- Batalkan pendaftaran hanya sebelum `cancellation_deadline` → `409 CANCELLATION_DEADLINE_PASSED`.
- `GET /events/{id}/registrations` hanya pemilik event; mengembalikan nama tampilan peserta, **bukan** email/telepon (`docs/RBAC.md` §6).
- Halaman: detail kegiatan untuk relawan (tombol "Daftar sebagai relawan", copy kuota penuh dari §5), `/dashboard/me/events` (status + tugas + tombol batal), tabel peserta di `/dashboard/organizer/events/[id]`.

Tes: K-09, K-10 (**50 request paralel → tepat 20 sukses**, gate 2), K-11, K-12. K-10 adalah bukti gate, jangan ditunda ke T5.2a.

### S4 — Posisi tugas + penempatan (T2.4, M)

API: `POST /events/{id}/tasks`, `PATCH /tasks/{id}`, `POST /tasks/{id}/assignments`, `DELETE /task-assignments/{id}`.

- Penempatan ditolak `409 QUOTA_FULL` bila jumlah assignment posisi ≥ `event_tasks.quota` (K-14).
- Satu relawan satu penempatan aktif (`UNIQUE(registration_id)`); ubah penempatan menimpa + audit `before`/`after` (SCH-06).
- Relawan melihat posisi & jadwal di `/dashboard/me/events` (SCH-04, K-15).
- Halaman `/dashboard/organizer/events/[id]/tasks`: daftar posisi + sisa kuota per posisi, pilih peserta dari daftar pendaftar, tampilkan siapa belum ditempatkan.

### S5 — Check-in QR (T2.5 M, T2.6 M)

Token sesuai `docs/DATABASE.md` §4:

```text
token = base64url(payload) + "." + HMAC-SHA256(payload, QR_TOKEN_SECRET)
payload = { registrationId, sessionId, nonce, exp }   // exp = now + 120 s
```

API: `POST /events/{id}/attendance-sessions`, `POST /attendance-sessions/{id}/close`, `POST /registrations/{id}/checkin-token`, `POST /attendance-sessions/{id}/scan`.

| Kasus | Respons |
|---|---|
| Token valid | `200`, `attendance_records{method: QR}`, registrasi → `CHECKED_IN`, audit |
| Kedaluwarsa | `410 TOKEN_EXPIRED` |
| Nonce sudah dipakai (`UNIQUE(token_nonce)`) | `409 TOKEN_ALREADY_USED` (K-17) |
| Sesi milik event lain | `403 FORBIDDEN`, tidak ada record (K-18b) |
| Sesi sudah `CLOSED` | `409 INVALID_STATE_TRANSITION` |
| Kode manual (token rusak/kamera gagal) | `method: MANUAL`, hanya organizer pemilik, tetap tercatat |

- Satu sesi `OPEN` per event (partial unique index sudah ada di migrasi) → `409` bila membuka sesi kedua.
- Lokasi helper token belum diputuskan: skema masuk `lib/validation/attendance.ts` (milik B), tetapi penandatanganan HMAC bukan validasi. Usulkan ke A: `lib/workflow/qr-token.ts` sebagai fungsi murni, atau file sendiri di luar wilayah A. Fungsi harus murni agar bisa diuji unit (K-16…K-18).
- QR generation: tambah dependensi (`qrcode` untuk render, `@zxing/browser` atau `BarcodeDetector` + fallback untuk scan). Minta A menyetujui `package.json` sebelum mulai.
- Halaman `/dashboard/organizer/events/[id]/attendance`: tampilkan QR sesi (bukan token per relawan), tombol buka/tutup sesi, scanner besar + input kode manual + umpan balik teks **dan** getar saat sukses (`docs/UI_UX.md` §6). Nyaman di 360 px, check-in < 3 detik.

### S6 — Verifikasi kontribusi (T2.7 S) + serah terima ke A (ATT-08)

API: `POST /contributions/{id}/verify` 🔑 (dan `POST /contributions/{id}/revoke` 🔑 untuk admin — milik A, B menyediakan halaman status saja).

- Verifikasi hanya dari `CHECKED_IN`; dari `REGISTERED` → `409 INVALID_STATE_TRANSITION` (K-19).
- Dalam satu transaksi: `contributions{VERIFIED}` + `event_registrations{VERIFIED}` + `blockchain_transactions{kind: ISSUE_CONTRIBUTION, status: PENDING, idempotencyKey: "ISSUE_CONTRIBUTION:<contributionId>"}` + audit.
- Respons `202 { data: { status: "VERIFIED", onChain: "PENDING" } }`. **B tidak mengirim transaksi chain** — itu T4.6 milik A. Kegagalan chain tidak boleh mengubah status kontribusi (K-21).
- Halaman `/dashboard/organizer/events/[id]/verify`: daftar `CHECKED_IN` yang belum diverifikasi, aksi per baris, status on-chain dengan label "Menunggu konfirmasi"/"Terkonfirmasi"/"Perlu diulang" + tautan explorer bila ada tx hash.
- Relawan: `/dashboard/me/contributions` menampilkan status + tx hash (6+4 karakter, tombol salin) + apakah tercatat di chain.

Tes: K-19, K-20, K-21, K-22.

### S7 — Setelah Gate 2

1. T3.4 (donasi barang + inventaris, M) lalu T3.6 (batch distribusi, M) — hanya setelah gate 2 lolos (`docs/TEAM_PLAN.md` §3 catatan).
2. T5.1 E2E Flow A (Playwright: buat → publish → daftar → token → scan → verify) dan T5.2a test negatif (kuota, duplikat, QR replay, RBAC).
3. Perbarui `docs/TESTING.md` bila ada perilaku yang belum punya baris K-xx.

---

## 5. Bukti "selesai" untuk wilayah B (gate 2)

Diambil langsung dari `docs/IMPLEMENTATION_PLAN.md` §Fase 2, `docs/PRD.md` §19, `docs/TESTING.md` §3:

- [ ] K-07 draft tidak tampil di katalog; kegiatan publish tampil.
- [ ] K-08 ubah kegiatan setelah `starts_at` → `409`.
- [ ] K-09 daftar dua kali → `409 ALREADY_REGISTERED`, count tetap 1.
- [ ] K-10 kuota 20 + 50 request paralel → tepat 20 sukses, `count == 20`.
- [ ] K-11 daftar setelah periode tutup → `409 REGISTRATION_CLOSED`.
- [ ] K-12 relawan hanya melihat miliknya; organizer hanya peserta event miliknya.
- [ ] K-13 cancel tanpa alasan → `422`; dengan alasan → `CANCELLED` + alasan tampil.
- [ ] K-14 penempatan melebihi kuota posisi → `409`, audit tercatat.
- [ ] K-15 perubahan penempatan terlihat relawan.
- [ ] K-16…K-18b token valid, replay, kedaluwarsa, sesi event lain.
- [ ] K-19…K-23 verify dari `CHECKED_IN`, tx PENDING, gagal chain tidak merusak data, idempotensi retry, revoke oleh admin.
- [ ] Semua route organizer menolak tanpa sesi (401) dan menolak role salah (403) **di server**.
- [ ] Tidak ada enum mentah tampil; semua status memakai label `docs/UI_UX.md` §3.
- [ ] 360 px tanpa scroll horizontal; tabel jadi kartu; target sentuh ≥ 44 px; fokus keyboard terlihat.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` hijau di PR B.

---

## 6. Yang bukan tugas B (jangan dikerjakan)

| Hal | Pemilik |
|---|---|
| Skema/migrasi Prisma, seed tambahan | A |
| `lib/db.ts`, `lib/auth/`, `lib/authz.ts`, `lib/workflow/`, `lib/storage/`, `lib/chain/` | A |
| Halaman publik `/events`, `/events/[slug]` beserta filter katalog (T2.1b, T2.8) | C |
| Wallet connect, relayer, indexer, anchor kontribusi (T4.3–T4.9) | A (UI wallet oleh C) |
| Kampanye, donasi, transparansi, admin review | C |
| Deploy, merge ke `main` | A |

Catatan: halaman publik `/events/[slug]` milik C **membaca** data yang B sediakan. Karena itu bentuk respons `GET /events/{id}` harus final sebelum C mulai (koordinasi di S2), bukan setelah semua slice B selesai.

---

## 7. Urutan eksekusi yang disarankan

```text
Hari 1 pagi   S0 UI kit  ─┐
              S1 shell    ┘ (tidak menunggu A)
              Ajukan 5 prasyarat §3 ke A (tulis di chat, tunggu jawaban singkat)

Hari 1 sore   Jawaban A masuk → S2 API kegiatan + halaman organizer

Hari 2        S3 pendaftaran + kuota (bukti K-10) → S4 tugas
Hari 3        S5 QR check-in → S6 verifikasi kontribusi → Gate 2
Hari 3+       T3.4/T3.6, lalu T5.1/T5.2a
```

Titik tunggu tinggal `lib/workflow/` dari A (`lib/authz.ts` sudah ada). S0/S1 sengaja diletakkan lebih dulu supaya B tidak menganggur saat menunggu.
