# API Contract — AksiBareng

API internal untuk UI AksiBareng. Semua endpoint berada di bawah `/api/v1` dan hanya dipakai aplikasi ini (bukan API publik pihak ketiga). Requirement: `docs/PRD.md` §7.

## 1. Konvensi

| Aspek | Aturan |
|---|---|
| Base path | `/api/v1` |
| Format | JSON; field `camelCase` (`displayName`, `amountWei`) |
| Waktu | ISO-8601 UTC (`2026-11-02T09:30:00Z`) |
| Nominal token | string desimal wei (`"15000000000000000"`) — **bukan** number, agar presisi tidak hilang |
| Nominal fiat | string desimal + `currency` (`"150000.00", "currency": "IDR"`) |
| ID | UUID string |
| Auth | Cookie sesi Auth.js (`__Secure-authjs.session-token`), httpOnly + SameSite=Lax |
| Otorisasi | Dicek di server per endpoint (lihat `docs/RBAC.md`), bukan dari body/query |
| Pagination | Cursor-based: `?limit=20&cursor=<opaque>`; respons `{ data, pagination: { nextCursor, hasMore } }` |
| Filter | Query param eksplisit: `status`, `category`, `from`, `to`, `q` |
| Sorting | `?sort=-createdAt` (prefix `-` = menurun) |
| Idempotency | Header `Idempotency-Key` wajib untuk endpoint bertanda 🔑 |
| CSRF | Mutasi wajib `Origin`/`Sec-Fetch-Site` valid; token CSRF untuk form eksternal |
| Rate limit | Per IP + per user; header `Retry-After` saat 429 |
| Versi | `/v1`; perubahan breaking → `/v2`, aditif tidak menaikkan versi |

### 1.1 Amplop respons

Sukses:
```json
{ "data": { "id": "…" } }
```
Koleksi:
```json
{ "data": [ … ], "pagination": { "nextCursor": "eyJpZCI6…", "hasMore": true } }
```
Error: RFC 7807, `Content-Type: application/problem+json` (lihat §8).

### 1.2 Rate limit

| Endpoint | Batas |
|---|---|
| `POST /auth/login` | 10 / 15 menit / IP+email |
| `POST /auth/register` | 5 / jam / IP |
| `POST /events/{id}/registrations` | 30 / jam / user |
| `POST /abuse-reports` | 5 / hari / user |
| `POST /attendance-sessions/{id}/scan` | 60 / menit / organizer |
| `POST /donations/intent` | 20 / jam / user |

Penerapan MVP: pembatas disimpan di memori proses (`lib/api/rate-limit.ts`). Itu cukup untuk satu instance dev/demo; bila platform dijalankan lebih dari satu instance, penyimpanannya wajib diganti dengan penyimpanan bersama sebelum batas ini bisa dipercaya. Login dibatasi di dalam `authorize()` Auth.js (`lib/auth/config.ts`), registrasi di route handler-nya.

## 2. Autentikasi & profil

| Method | Path | Akses | Requirement |
|---|---|---|---|
| POST | `/auth/register` | publik | AUTH-01 |
| POST | `/auth/login` | publik | AUTH-02 |
| POST | `/auth/logout` | login | AUTH-02 |
| GET | `/users/me` | login | — |
| PATCH | `/users/me` | login | AUTH-04 |
| POST | `/users/me/wallet/challenge` | login | AUTH-07 |
| POST | `/users/me/wallet` | login | AUTH-07 |
| DELETE | `/users/me/wallet/{id}` | login | AUTH-07 |

`GET /users/me` → `200 { "data": { "id": "…", "email": "…", "displayName": "…", "role": "VOLUNTEER", "isPublicName": true, "status": "ACTIVE" } }`.

`PATCH /users/me` body: `{ "displayName"?: "2–60 karakter", "isPublicName"?: true|false }` — hanya field profil non-sensitif; field lain (`role`, `status`, `email`) → `422 VALIDATION_ERROR`. Minimal satu field wajib diisi.

`POST /auth/register`
```json
{ "email": "relawan@aksibareng.test", "password": "min 10 karakter", "displayName": "Rani" }
```
→ `201 { "data": { "id": "…", "role": "VOLUNTEER" } }`. Email duplikat → `409 EMAIL_TAKEN`. Kata sandi lemah → `422 VALIDATION_ERROR` dengan `errors[]`.

`POST /users/me/wallet/challenge`
```json
{ "address": "0xabc…", "chainId": 11155111 }
```
→ `200 { "data": { "message": "AksiBareng wants you to link this wallet.\nNonce: 8f2c…\nIssued At: …" } }` lalu `POST /users/me/wallet { address, signature }`. Server memverifikasi `ecrecover` / `verifyMessage`, menolak bila nonce kedaluwarsa (>10 menit) atau sudah dipakai. **Tidak pernah** meminta private key.

## 3. Organisasi & verifikasi

| Method | Path | Akses | Requirement |
|---|---|---|---|
| POST | `/organizations` | login | AUTH-05 |
| GET | `/organizations/{id}` | publik (data publik saja) | — |
| PATCH | `/organizations/{id}` | owner / admin | AUTH-04 |
| POST | `/organizations/{id}/verification` | owner | AUTH-05 |
| GET | `/admin/organizations` | admin | AUTH-06 |
| POST | `/admin/organizations/{id}/review` | admin | AUTH-06 |

Review body: `{ "decision": "APPROVED" | "REJECTED", "note": "…" }`. Menerima verifikasi menaikkan `users.role` pemilik menjadi `ORGANIZER` dalam transaksi yang sama + audit log.

## 4. Kegiatan (AksiKegiatan)

| Method | Path | Akses | Requirement |
|---|---|---|---|
| GET | `/events` | publik (hanya `PUBLISHED`/`ONGOING`) | EVT-04, EVT-12 |
| GET | `/events/{id}` | publik | EVT-05 |
| POST | `/events` | organizer | EVT-01 |
| PATCH | `/events/{id}` | organizer pemilik | EVT-02 |
| POST | `/events/{id}/publish` | organizer pemilik | EVT-03 |
| POST | `/events/{id}/close-registration` | organizer pemilik | EVT-03 |
| POST | `/events/{id}/cancel` | organizer pemilik | EVT-11 |
| POST | `/events/{id}/registrations` 🔑 | volunteer | EVT-06 |
| DELETE | `/events/{id}/registrations/me` | volunteer | EVT-09 |
| GET | `/events/{id}/registrations` | organizer pemilik | EVT-10 |
| GET | `/users/me/registrations` | login | EVT-09 |
| POST | `/events/{id}/tasks` | organizer pemilik | SCH-01, SCH-02 |
| PATCH | `/tasks/{id}` | organizer pemilik | SCH-01 |
| POST | `/tasks/{id}/assignments` | organizer pemilik | SCH-03 |
| DELETE | `/task-assignments/{id}` | organizer pemilik | SCH-06 |
| POST | `/events/{id}/attendance-sessions` | organizer pemilik | ATT-01 |
| POST | `/attendance-sessions/{id}/close` | organizer pemilik | ATT-01 |
| POST | `/registrations/{id}/checkin-token` | volunteer pemilik | ATT-02 |
| POST | `/attendance-sessions/{id}/scan` | organizer pemilik | ATT-03, ATT-04 |
| POST | `/contributions/{id}/verify` 🔑 | organizer pemilik | ATT-06, ATT-08 |
| POST | `/contributions/{id}/revoke` 🔑 | admin | ATT-08 / PRD §9.3 |

`POST /events/{id}/registrations` — satu-satunya jalur pendaftaran.
```json
{ "note": "Bisa datang pagi" }
```
Kemungkinan hasil:

| Situasi | Respons |
|---|---|
| Berhasil | `201 { "data": { "id": "…", "status": "REGISTERED" } }` |
| Sudah terdaftar | `409 ALREADY_REGISTERED` |
| Kuota penuh | `409 QUOTA_FULL` |
| Periode tutup | `409 REGISTRATION_CLOSED` |
| Event dibatalkan | `409 EVENT_NOT_OPEN` |

`POST /registrations/{id}/checkin-token` → `201`:
```json
{ "data": { "token": "eyJyZWdJZCI6…<sig>", "expiresAt": "2026-11-02T02:05:00Z", "qrPayload": "aksibareng://checkin?t=…" } }
```
Token berumur 120 detik, sekali pakai per sesi. `POST /attendance-sessions/{id}/scan` body `{ "token": "…" }` → `200 { "data": { "registrationId": "…", "checkedInAt": "…" } }`; token kedaluwarsa `410 TOKEN_EXPIRED`, sudah dipakai `409 TOKEN_ALREADY_USED`, sesi bukan milik event `403 FORBIDDEN`.

`POST /contributions/{id}/verify` menyimpan validasi DB lalu membuat `blockchain_transactions{kind: ISSUE_CONTRIBUTION, status: PENDING}`; respons `202 { "data": { "status": "VERIFIED", "onChain": "PENDING" } }`. Kegagalan chain tidak mengubah `status` kontribusi.

## 5. Kampanye

| Method | Path | Akses | Requirement |
|---|---|---|---|
| GET | `/campaigns` | publik (hanya `ACTIVE`/`CLOSED`/`COMPLETED`) | CAM-05 |
| GET | `/campaigns/{slug}` | publik | CAM-05, CAM-06 |
| POST | `/campaigns` | organizer terverifikasi | CAM-01, CAM-02 |
| PATCH | `/campaigns/{id}` | organizer pemilik, status `DRAFT` | CAM-02 |
| PUT | `/campaigns/{id}/budget` | organizer pemilik | CAM-03 |
| POST | `/campaigns/{id}/submit` | organizer pemilik | CAM-04 |
| POST | `/campaigns/{id}/updates` | organizer pemilik | CAM-07 |
| POST | `/campaigns/{id}/close` | organizer pemilik | CAM-08 |
| GET | `/admin/campaigns` | admin | CAM-04 |
| POST | `/admin/campaigns/{id}/review` | admin | CAM-04 |
| POST | `/admin/campaigns/{id}/pause` | admin | PRD §9.1 |
| POST | `/campaigns/{id}/abuse-reports` | login | CAM-09 (P1) |

Organizer belum terverifikasi → `403 ORGANIZATION_NOT_VERIFIED`. Review admin `{ "decision": "APPROVED"|"REJECTED", "note": "…" }`; `APPROVED` memindahkan status ke `ACTIVE` dan (opsional) memicu `createCampaign()` on-chain.

## 6. Donasi uang, barang, inventaris

| Method | Path | Akses | Requirement |
|---|---|---|---|
| POST | `/campaigns/{id}/donations/intent` 🔑 | login + wallet terhubung | DON-02 |
| POST | `/donations/{id}/submit-tx` | pemilik donasi | DON-03, DON-04 |
| GET | `/users/me/donations` | login | DON-06 |
| GET | `/campaigns/{id}/donations/summary` | publik (agregat) | DON-07 |
| POST | `/campaigns/{id}/goods-donations` 🔑 | login | GDS-01, GDS-02 |
| GET | `/campaigns/{id}/goods-donations` | organizer pemilik | GDS-03 |
| POST | `/goods-donations/{id}/review` | organizer pemilik | GDS-03 |
| POST | `/goods-donations/{id}/receive` | organizer pemilik | GDS-04 |
| GET | `/campaigns/{id}/inventory` | organizer pemilik | GDS-05, GDS-06 |

`POST /campaigns/{id}/donations/intent`
```json
{ "amountWei": "10000000000000000", "isAnonymous": false, "displayName": "Rani" }
```
→ `201`:
```json
{ "data": {
    "donationId": "…",
    "chainId": 11155111,
    "contractAddress": "0x…",
    "onChainCampaignId": 7,
    "amountWei": "10000000000000000",
    "label": "SIMULASI — aset testnet Sepolia, bukan uang sungguhan"
} }
```

`GET /campaigns/{id}/donations/summary` mengembalikan agregat tanpa identitas donatur selain nama tampilan yang diizinkan:
```json
{ "data": { "totalConfirmedWei": "250000000000000000", "donorCount": 12, "lastConfirmedAt": "…" } }
```

`POST /goods-donations/{id}/receive` body `{ "receivedQuantity": 18, "condition": "USED_GOOD", "note": "2 rusak" }` → menambah `inventory_items` dalam transaksi yang sama (GDS-04).

## 7. Pengeluaran, distribusi, transparansi

| Method | Path | Akses | Requirement |
|---|---|---|---|
| POST | `/campaigns/{id}/expenses` | organizer pemilik | EXP-01, EXP-02 |
| POST | `/expenses/{id}/evidence` | organizer pemilik | EXP-04 |
| POST | `/expenses/{id}/review` | organizer lain / admin | EXP-03 |
| POST | `/expenses/{id}/mark-paid` | organizer pemilik | EXP-03, EXP-05 |
| GET | `/campaigns/{id}/expenses` | organizer pemilik | EXP-05 |
| POST | `/campaigns/{id}/distributions` | organizer pemilik | DST-01, DST-02 |
| POST | `/distributions/{id}/items` | organizer pemilik | DST-03 |
| POST | `/distributions/{id}/transition` | organizer / petugas | DST status |
| PATCH | `/distributions/{id}/evidence/{evidenceId}/privacy` | organizer / admin | DST privacy |
| POST | `/distributions/{id}/verify` 🔑 | verifikator / admin | DST-05, DST-07 |
| GET | `/public/campaigns/{slug}/transparency` | publik | TRN-01…06 |
| GET | `/public/campaigns/{slug}/report` | publik | TRN-07 (P1) |
| GET | `/public/verify` | publik | TRN-06 |
| GET | `/admin/blockchain-transactions` | admin | PRD §13.3 |
| POST | `/admin/blockchain-transactions/{id}/retry` | admin | PRD §13.3 |
| GET | `/admin/audit-logs` | admin | PRD §12.4 |

`POST /expenses/{id}/review` body `{ "decision": "APPROVED"|"REJECTED", "note": "…" }`. Bila total melebihi dana terkonfirmasi → `409 EXPENSE_EXCEEDS_FUNDS` dengan detail selisih.

`POST /distributions/{id}/verify` hanya menerima status `DELIVERED` atau `PARTIALLY_DELIVERED`; respons `202` karena anchor hash berjalan asinkron:
```json
{ "data": { "status": "VERIFIED", "anchor": { "kind": "RECORD_DISTRIBUTION", "status": "PENDING" } } }
```

`GET /public/campaigns/{slug}/transparency`:
```json
{ "data": {
  "campaign": { "title": "100 Meals for Cilacap", "status": "ACTIVE" },
  "funds": {
    "raisedWei": "250000000000000000",
    "usedWei": "90000000000000000",
    "remainingWei": "160000000000000000",
    "source": "BLOCKCHAIN_CONFIRMED"
  },
  "expenseCategories": [{ "category": "Bahan makanan", "amountWei": "…" }],
  "distribution": { "batches": 3, "verified": 2, "itemsPrepared": 300, "itemsDelivered": 200 },
  "activity": [{ "type": "ExpenseProofRecorded", "txHash": "0x…", "explorerUrl": "https://sepolia.etherscan.io/tx/0x…", "source": "BLOCKCHAIN" }],
  "labels": { "simulation": true, "note": "Data demo, aset testnet" }
} }
```
Setiap item `activity` wajib menyertakan `source` (`BLOCKCHAIN`, `DATABASE`, `ORGANIZER_STATEMENT`) sesuai PRD §7.10.

## 8. Katalog error

Semua error memakai bentuk yang sama:

```json
{
  "type": "https://aksibareng.app/errors/quota-full",
  "title": "Kuota kegiatan penuh",
  "status": 409,
  "detail": "Kuota kegiatan ini sudah terisi 20 dari 20 relawan.",
  "instance": "/api/v1/events/9f2c/registrations",
  "code": "QUOTA_FULL",
  "errors": [{ "field": "amountWei", "message": "Nominal minimal 0.001 ETH testnet." }]
}
```

| Code | HTTP | Kapan |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Skema Zod gagal |
| `UNAUTHENTICATED` | 401 | Tidak ada/kedaluwarsa sesi |
| `FORBIDDEN` | 403 | Role/ownership tidak memenuhi |
| `ORGANIZATION_NOT_VERIFIED` | 403 | Kampanye publik sebelum verifikasi |
| `NOT_FOUND` | 404 | Resource tidak ada atau tidak boleh dilihat |
| `ALREADY_REGISTERED` | 409 | Pendaftaran ganda (EVT-07) |
| `EMAIL_TAKEN` | 409 | Email sudah dipakai akun lain (`POST /auth/register`) |
| `QUOTA_FULL` | 409 | Kuota kegiatan/posisi penuh (EVT-08, SCH) |
| `REGISTRATION_CLOSED` | 409 | Di luar periode pendaftaran |
| `EVENT_NOT_OPEN` | 409 | Event `CANCELLED`/`COMPLETED` |
| `CANCELLATION_DEADLINE_PASSED` | 409 | Batal setelah batas waktu |
| `TOKEN_ALREADY_USED` | 409 | Replay QR check-in |
| `INVALID_STATE_TRANSITION` | 409 | Mis. verifikasi distribusi dari `PLANNED` |
| `INSUFFICIENT_STOCK` | 409 | Alokasi melebihi stok |
| `EXPENSE_EXCEEDS_FUNDS` | 409 | Total pengeluaran > dana terkonfirmasi |
| `IDEMPOTENCY_CONFLICT` | 409 | `Idempotency-Key` sama, payload berbeda |
| `TOKEN_EXPIRED` | 410 | Token check-in kedaluwarsa |
| `PAYLOAD_TOO_LARGE` | 413 | Upload > batas (`max_upload_bytes`) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | File bukan JPEG/PNG/PDF |
| `RATE_LIMITED` | 429 | Melebihi batas; lihat `Retry-After` |
| `CHAIN_UNAVAILABLE` | 503 | RPC tidak tersedia saat aksi chain diminta |
| `INTERNAL_ERROR` | 500 | Bug; `instance` dipakai untuk korelasi log |

## 9. Upload file

`POST /expenses/{id}/evidence` dan `POST /distributions/{id}/evidence` menerima `multipart/form-data`.

| Aturan | Nilai |
|---|---|
| Tipe diizinkan | `image/jpeg`, `image/png`, `application/pdf` |
| Ukuran maksimum | 8 MB per file, 5 file per entitas |
| Validasi | Cek magic bytes, bukan hanya `Content-Type` |
| Nama file | Diganti UUID; nama asli disimpan sebagai metadata |
| Hash | `sha256` dihitung server; `chain_hash = keccak256(file ‖ documentSalt)` |
| Akses | URL presigned ≤ 5 menit, hanya organizer pemilik / admin |
| Publikasi | Hanya setelah `privacy_review = APPROVED` |

Respons `201 { "data": { "id": "…", "sha256": "…", "anchorStatus": "NOT_ANCHORED" } }`.

## 10. Endpoint internal (cron & reli)

| Method | Path | Proteksi |
|---|---|---|
| POST | `/internal/chain-sync` | Header `x-cron-secret` = `CRON_SECRET`; menolak tanpa itu |
| GET | `/internal/health` | Publik, hanya `{ status, db, chain, lastIndexedBlock }` tanpa detail sensitif |

`chain-sync` melakukan: baca `indexer_cursors` → `eth_getLogs` rentang blok → verifikasi receipt → upsert `blockchain_transactions`/`donations` → kirim transaksi tertunda dengan `idempotency_key` → update cursor. Harus idempoten: dijalankan dua kali tidak boleh menggandakan data.

## 11. Kompatibilitas

- Field baru hanya ditambahkan (aditif); klien tidak boleh pecah karena field tak dikenal.
- Field yang dihapus melewati masa deprekasi minimal satu iterasi dengan penanda di dokumen ini.
- Endpoint yang tidak lagi dipakai ditandai `DEPRECATED` di tabel sebelum dihapus.
