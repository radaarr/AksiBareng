# Role & Otorisasi — AksiBareng

Dokumen ini adalah kontrak akses. Implementasi ada di `lib/authz.ts` dengan signature `can(actor, action, resource)`. Setiap route handler wajib memanggilnya; menyembunyikan tombol di UI bukan kontrol (PRD §14.1).

## 1. Peran

| Peran | Sumber | Catatan |
|---|---|---|
| `VISITOR` | tidak login | Hanya baca data publik |
| `VOLUNTEER` | default saat registrasi | Juga berperan sebagai donatur (PRD §4.2) |
| `ORGANIZER` | setelah organisasi `VERIFIED` | Tidak otomatis punya organisasi; harus `owner_id` |
| `ADMIN` | dibuat lewat seed/CLI, tidak ada endpoint publik | Verifikator platform |

Aturan identitas:

- `actor.id` dan `actor.role` dibaca dari database tiap request (bukan dari klien).
- `VISITOR` tidak punya sesi; endpoint privat mengembalikan `401 UNAUTHENTICATED`.
- Satu akun satu role utama. Relawan yang ingin menyelenggarakan kegiatan harus mengajukan organisasi; role naik hanya setelah admin menyetujui.
- Penerima bantuan **bukan** peran dan tidak punya akun (PRD §4.5).

## 2. Prinsip

1. **Deny by default** — aksi yang tidak terdaftar di tabel §3 ditolak.
2. **Ownership di atas role** — `ORGANIZER` hanya menyentuh resource milik organisasinya.
3. **Pemisahan tugas** — pengaju pengeluaran tidak boleh menyetujui pengeluarannya sendiri bila `require_dual_approval` aktif (P1).
4. **Tidak ada eskalasi mandiri** — tidak ada endpoint yang mengubah `users.role`, `organizations.verification_status`, atau `campaigns.status` ke `ACTIVE` tanpa admin.
5. **Data sensitif selalu terfilter di server** — endpoint publik memakai selector eksplisit, bukan `SELECT *`.

## 3. Matriks aksi

### 3.1 Publik (tanpa login)

| Aksi | Visitor | Detail |
|---|---|---|
| Lihat katalog & detail kegiatan `PUBLISHED`/`ONGOING` | ✅ | Tidak termasuk daftar peserta |
| Lihat katalog & detail kampanye `ACTIVE`/`CLOSED`/`COMPLETED` | ✅ | Tanpa identitas donatur individual |
| Lihat laporan transparansi & transaction hash | ✅ | Data agregat |
| Verifikasi catatan kontribusi via ID publik | ✅ | Hanya status + timestamp, tanpa identitas |
| Lihat halaman "cara kerja" & status platform | ✅ | |
| Melihat kegiatan `DRAFT`/`PENDING_REVIEW` | ❌ | `404` |

### 3.2 Volunteer / Donatur

| Aksi | Volunteer | Batasan |
|---|---|---|
| Daftar kegiatan | ✅ | Sesuai kuota & periode (EVT-06) |
| Batalkan pendaftaran sendiri | ✅ | Sebelum `cancellation_deadline` |
| Lihat tugas & jadwal sendiri | ✅ | Hanya miliknya (SCH-04) |
| Buat token check-in sendiri | ✅ | Hanya untuk registrasi `REGISTERED` |
| Lihat status kontribusi sendiri | ✅ | `REGISTERED`→`CHECKED_IN`→`VERIFIED` |
| Buat pengajuan donasi uang/barang | ✅ | Butuh wallet terhubung untuk donasi uang |
| Lihat riwayat donasi sendiri | ✅ | |
| Melihat data donatur lain | ❌ | Hanya agregat + nama tampilan yang diizinkan |
| Menghubungkan wallet | ✅ | Verifikasi tanda tangan pesan |
| Mengubah profil sendiri | ✅ | Field non-sensitif; email berubah = verifikasi ulang |
| Menyetujui pengeluaran / verifikasi distribusi | ❌ | |
| Melihat bukti pengeluaran privat | ❌ | |
| Menerbitkan kontribusi | ❌ | Relawan tidak boleh menerbitkan kontribusi sendiri (PRD §10.3) |

### 3.3 Organizer (pemilik organisasi)

| Aksi | Organizer | Batasan tambahan |
|---|---|---|
| Buat/ubah kegiatan miliknya | ✅ | `PATCH` hanya sebelum `starts_at` (EVT-02) |
| Publikasikan / tutup pendaftaran / batalkan kegiatan | ✅ | Wajib alasan untuk pembatalan |
| Lihat daftar peserta kegiatan miliknya | ✅ | Data kontak peserta tidak diekspor publik |
| Buat/ubah posisi tugas, tempatkan relawan | ✅ | Tidak melebihi kuota posisi |
| Buka sesi check-in, pindai QR | ✅ | Hanya sesi untuk event miliknya |
| Validasi kontribusi | ✅ | Setelah `CHECKED_IN` (ATT-06) |
| Buat kampanye | ✅ | Wajib organisasi `VERIFIED` |
| Ubah kampanye | ✅ | Hanya saat `DRAFT`; setelah `ACTIVE` hanya lewat `updates` |
| Terima/tolak donasi barang, kelola inventaris | ✅ | Miliknya |
| Buat pengajuan pengeluaran + unggah bukti | ✅ | Miliknya |
| Setujui pengeluaran | ⚠️ | Hanya jika bukan pengaju, atau `require_dual_approval` nonaktif |
| Buat batch distribusi, unggah bukti | ✅ | Miliknya |
| Verifikasi distribusi | ❌ | Harus verifikator/admin (DST-05) |
| Lihat audit log platform | ❌ | Hanya audit entitas miliknya (P1) |
| Melihat/mengubah organisasi lain | ❌ | `403 FORBIDDEN` |

### 3.4 Admin

| Aksi | Admin | Catatan |
|---|---|---|
| Tinjau verifikasi organisasi | ✅ | Menyetujui → role owner jadi `ORGANIZER` |
| Tinjau/pause/hentikan kampanye | ✅ | Wajib alasan, tercatat di audit log |
| Verifikasi distribusi bantuan | ✅ | Boleh juga `revokeContribution` |
| Lihat & retry transaksi chain gagal | ✅ | |
| Lihat audit log & pengguna | ✅ | |
| Ubah kategori & `platform_settings` | ✅ | |
| Melihat dokumen bukti sensitif | ✅ | Untuk investigasi; log akses wajib |
| Mengubah nominal donasi / menghapus histori | ❌ | Tidak pernah ada (PRD §10.3) |
| Menjadi organizer atas nama organisasi | ❌ | Tidak boleh membuat kegiatan/donasi pribadi |

### 3.5 Nama action di `lib/authz.ts`

Implementasi memakai `can(actor, action, resource)`. Nama action di bawah adalah kontraknya; menambah akses baru wajib menambah entri di tabel `RULES`, dan TypeScript menolak action tanpa aturan (deny by default).

| Action | Resource minimal | Boleh |
|---|---|---|
| `event:create` | — | `ORGANIZER` yang punya organisasi |
| `event:read` | `{ organizationId, status }` | semua bila `PUBLISHED`/`ONGOING`; selain itu pemilik + admin |
| `event:list_own` | — | `ORGANIZER` |
| `event:update` | `{ organizationId, status }` | pemilik |
| `event:publish` | `{ organizationId, status }` | pemilik |
| `event:close_registration` | `{ organizationId, status }` | pemilik |
| `event:cancel` | `{ organizationId, status }` | pemilik |
| `registration:create` | `{ organizationId, status }` | `VOLUNTEER`, kegiatan `PUBLISHED`/`ONGOING` |
| `registration:read_own` | `{ userId }` | `userId == actor.id` |
| `registration:cancel_own` | `{ userId }` | `userId == actor.id` |
| `registration:list` | `{ organizationId, status }` | pemilik kegiatan |
| `task:create` | `{ organizationId, status }` | pemilik kegiatan |
| `task:update` | `{ organizationId, status }` | pemilik kegiatan |
| `task:assign` | `{ organizationId, status }` | pemilik kegiatan |
| `task:unassign` | `{ organizationId, status }` | pemilik kegiatan |
| `task:read` | `{ eventOrganizationId, assignedUserId }` | pemilik kegiatan atau relawan yang ditempatkan |
| `attendance:create_session` | `{ organizationId, status }` | pemilik kegiatan |
| `attendance:close_session` | `{ organizationId, status }` | pemilik kegiatan |
| `attendance:issue_token` | `{ userId }` | `userId == actor.id` |
| `attendance:scan` | `{ organizationId, status }` | pemilik kegiatan |
| `contribution:read_own` | `{ userId }` | `userId == actor.id` |
| `contribution:list` | `{ organizationId, status }` | pemilik kegiatan |
| `contribution:verify` | `{ organizationId, status }` | pemilik kegiatan |
| `contribution:revoke` | — | `ADMIN` |
| `organization:create` | — | siapa pun yang login kecuali `ADMIN` |
| `organization:update` | `{ ownerId }` | pemilik organisasi atau `ADMIN` |
| `organization:submit_verification` | `{ ownerId }` | pemilik organisasi (non-`ADMIN`) |
| `organization:list_admin` | — | `ADMIN` |
| `organization:review` | — | `ADMIN` |

Pemakaian di route handler:

```ts
const actor = await requireActor() // 401 bila tanpa sesi
const event = await prisma.event.findUnique({
  where: { id },
  select: { organizationId: true, status: true } // selector minimal, bukan SELECT *
})
if (!event) return problem({ status: 404, code: 'NOT_FOUND', detail: 'Data tidak ditemukan.', instance })
assertCan(actor, 'event:update', event) // 403 atau 404 otomatis
```

Aturan pemakaian:

1. `can()`/`assertCan()` **tidak** menyentuh database dan **tidak** memeriksa precondition bisnis (kuota, periode, stok, legalitas transisi). Urutannya: `requireActor()` → ambil resource dengan selector minimal → `assertCan()` → precondition domain.
2. Resource yang dibutuhkan hanya projection: `{ organizationId, status }` untuk kegiatan, `{ userId }` untuk registrasi/kontribusi.
3. `assertCan()` melempar `AccessDeniedError`; route handler memetakannya lewat `accessProblem()` di `lib/api/access.ts`.
4. Resource privat ditolak `404`; `403` dipakai untuk action yang murni soal peran dan untuk kegiatan yang statusnya sudah publik.

## 4. Matriks resource × aksi (ringkas)

| Resource | Create | Read | Update | Delete/Revoke |
|---|---|---|---|---|
| `user` | publik (self) | self, admin | self (non-sensitif), admin (status) | — |
| `wallet_link` | self | self, admin | — | self, admin |
| `organization` | login | publik (field publik), owner, admin | owner, admin | — |
| `organization_verification` | owner | owner, admin | admin (review) | — |
| `event` | organizer | publik bila `PUBLISHED`, owner, admin | owner (sebelum mulai), admin | owner (cancel + alasan) |
| `registration` | volunteer | self, owner, admin | self (cancel) | — |
| `task` / `assignment` | organizer | owner, peserta terkait | organizer | organizer |
| `attendance_session` | organizer | organizer | organizer | organizer (close) |
| `attendance_record` | organizer (scan) | self, organizer | — | admin (koreksi + audit) |
| `contribution` | organizer (verify) | self, owner, admin | — | admin (revoke) |
| `campaign` | organizer terverifikasi | publik bila `ACTIVE`+ | owner (terbatas), admin (review/pause) | admin |
| `campaign_budget` | owner | publik (rencana), owner | owner (versi baru, sebelum `ACTIVE`) | — |
| `donation` | login | self, agregat publik, admin | sistem (status) | — |
| `goods_donation` | login | self, owner | owner (review/receive) | self (batal sebelum diterima) |
| `inventory_item` | sistem | owner, admin | owner | — |
| `expense` | owner | owner, reviewer, admin | owner (status terbatas) | owner (batalkan sebelum `PAID`) |
| `expense_evidence` | owner | owner, admin | — | owner (sebelum review) |
| `distribution_batch` | owner | publik (agregat), owner | owner | owner (cancel) |
| `distribution_evidence` | owner/petugas | owner, admin | reviewer (privacy) | owner (sebelum verifikasi) |
| `audit_log` | sistem | admin | — | — |
| `blockchain_transaction` | sistem | admin, pemilik terkait (status saja) | sistem, admin (retry) | — |
| `abuse_report` | login | pelapor, admin | admin | — |

## 5. Aturan kepemilikan (ownership)

```text
organizations.owner_id == actor.id            → pemilik organisasi
events.organization_id == actor.organizationId → pemilik kegiatan
campaigns.organization_id == actor.organizationId → pemilik kampanye
```

- `actor.organizationId` diambil dari organisasi yang `owner_id = actor.id`, bukan dari input klien.
- Bila akun memiliki lebih dari satu organisasi (tidak diizinkan pada MVP), endpoint harus menolak dengan `409` konfigurasi tidak didukung.
- Akses lintas organisasi → `403 FORBIDDEN`, bukan `404`, hanya bila keberadaan resource memang publik; untuk resource privat gunakan `404` agar tidak membocorkan keberadaan data.

## 6. Visibilitas data per audiens

| Data | Visitor | Volunteer | Organizer | Admin |
|---|---|---|---|---|
| Nama kegiatan, deskripsi, lokasi umum | ✅ | ✅ | ✅ | ✅ |
| Nama tampilan peserta | ❌ | hanya diri sendiri | ✅ (peserta event miliknya) | ✅ |
| Email/telepon peserta | ❌ | diri sendiri | ❌ (hanya bila peserta menghubungi via platform) | ✅ dengan log akses |
| Alamat wallet donatur | ❌ (kecuali yang tercatat di chain, tidak ditampilkan di UI) | diri sendiri | ❌ | ✅ |
| Nominal donasi individual | ❌ | diri sendiri | ✅ (untuk rekap) | ✅ |
| Data penerima bantuan | ❌ | ❌ | ✅ minimal, tanpa publikasi | ✅ |
| Foto bukti distribusi | hanya setelah `privacy_review = APPROVED` | ❌ | ✅ | ✅ |
| Nota/invoice | ❌ | ❌ | ✅ | ✅ |

## 7. Checklist penegakan

- [ ] Setiap route handler privat memanggil `requireActor()` (401) lalu `assertCan(...)` (403/404); halaman server memakai `requireSession()`.
- [ ] Setiap query Prisma memfilter `organizationId`/`userId` dari sesi, bukan dari body.
- [ ] Aksi admin menulis `audit_logs` dengan `actor`, `action`, `reason`.
- [ ] Endpoint yang mengubah status memvalidasi transisi (lihat `docs/FLOWS.md` §3), bukan hanya role.
- [ ] Respons `403`/`404` tidak memuat nama resource yang tidak boleh diakses.
- [ ] Test negatif tersedia untuk tiap baris `❌` di §3 (lihat `docs/TESTING.md`).
