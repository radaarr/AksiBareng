# Alur & State Machine — AksiBareng

Sequence diagram untuk empat flow PRD §8 dan aturan transisi status. Tujuan dokumen ini: implementasi tidak menebak urutan dan tidak mengizinkan lompatan status.

## 1. Flow A — Organizer membuat kegiatan & mengelola relawan

```mermaid
sequenceDiagram
    autonumber
    actor O as Organizer
    actor R as Relawan
    participant UI as Dashboard / Katalog
    participant API as Route Handlers
    participant DB as PostgreSQL
    participant IX as Chain-cron

    O->>UI: isi form kegiatan (judul, kuota, periode, lokasi)
    UI->>API: POST /events
    API->>DB: events{DRAFT} + audit_log
    API-->>UI: 201 event DRAFT
    O->>UI: publikasikan
    UI->>API: POST /events/{id}/publish
    API->>DB: events{PUBLISHED}
    R->>UI: buka detail kegiatan
    UI->>API: GET /events/{id}
    R->>UI: klik "Daftar"
    UI->>API: POST /events/{id}/registrations
    API->>DB: transaksi: lock event → cek periode, kuota, duplikat
    API->>DB: event_registrations{REGISTERED} + audit_log
    API-->>R: 201 (atau 409 QUOTA_FULL / ALREADY_REGISTERED)
    O->>UI: tempatkan relawan ke posisi
    UI->>API: POST /tasks/{id}/assignments
    API->>DB: validasi kuota posisi → task_assignments
    R->>UI: buka QR check-in (token 120 s)
    UI->>API: POST /registrations/{id}/checkin-token
    API-->>R: token bertanda tangan
    O->>UI: pindai QR relawan
    UI->>API: POST /attendance-sessions/{id}/scan
    API->>DB: attendance_records (nonce unik) + registrations{CHECKED_IN}
    O->>UI: tandai kontribusi selesai
    UI->>API: POST /contributions/{id}/verify
    API->>DB: contributions{VERIFIED} + blockchain_transactions{PENDING}
    API-->>O: 202
    IX->>DB: ambil tx tertunda, kirim issueContribution()
    IX->>DB: blockchain_transactions{CONFIRMED} + txHash
    R->>UI: lihat riwayat kontribusi + link explorer
```

Catatan: check-in **tidak** membuat kontribusi terverifikasi. Bila chain gagal, `contributions.status` tetap `VERIFIED` dan `onChain` menjadi `RETRY_REQUIRED`.

## 2. Flow B — Membuat & mendanai kampanye

```mermaid
sequenceDiagram
    autonumber
    actor O as Organizer terverifikasi
    actor A as Admin
    actor D as Donatur
    actor W as Wallet
    participant API as Route Handlers
    participant DB as PostgreSQL
    participant C as DonationTransparency

    O->>API: POST /campaigns (cerita, target, periode, lokasi umum)
    API->>DB: campaigns{DRAFT} + validasi organization VERIFIED
    O->>API: PUT /campaigns/{id}/budget (rencana penggunaan)
    API->>DB: campaign_budgets v1
    O->>API: POST /campaigns/{id}/submit
    API->>DB: campaigns{PENDING_REVIEW}
    A->>API: POST /admin/campaigns/{id}/review APPROVED
    API->>DB: campaigns{ACTIVE} + audit_log(reason)
    API->>C: createCampaign() (relayer)
    API->>DB: on_chain_campaign_id
    D->>API: POST /campaigns/{id}/donations/intent
    API->>DB: donations{INTENT}
    API-->>D: parameter kontrak + label simulasi
    D->>W: tanda tangani donate()
    W->>C: transaksi + value
    C-->>W: txHash + event DonationReceived
    D->>API: POST /donations/{id}/submit-tx
    API->>DB: donations{PENDING} + blockchain_transactions{PENDING}
    Note over API,C: cron chain-sync memverifikasi receipt & log
    API->>DB: donations{CONFIRMED} bila receipt sukses & konfirmasi cukup
    D->>API: GET /campaigns/{slug}/transparency
    API-->>D: total terkonfirmasi + txHash + label sumber data
```

Penolakan admin: `REJECTED` + `review_note`; kampanye tidak bisa diedit lagi kecuali dikembalikan ke `DRAFT` lewat endpoint khusus (P1). Pada MVP, organizer membuat kampanye baru.

## 3. State machine

### 3.1 Kegiatan & pendaftaran

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PUBLISHED : publish
    PUBLISHED --> ONGOING : starts_at tercapai
    PUBLISHED --> CANCELLED : cancel (alasan)
    ONGOING --> COMPLETED : organizer selesai
    ONGOING --> CANCELLED : cancel (alasan)
    COMPLETED --> [*]
    CANCELLED --> [*]
```

| Dari | Ke | Syarat |
|---|---|---|
| `DRAFT` | `PUBLISHED` | >= 1 kategori, kuota > 0, periode valid, `starts_at` di masa depan |
| `PUBLISHED` | `CANCELLED` | alasan wajib; semua peserta `REGISTERED` menerima notifikasi in-app (P1) |
| `PUBLISHED`/`ONGOING` | `COMPLETED` | hanya setelah `ends_at` |

Registrasi:
```mermaid
stateDiagram-v2
    [*] --> REGISTERED : daftar
    REGISTERED --> CANCELLED : batal (self, sebelum deadline)
    REGISTERED --> CHECKED_IN : scan QR valid
    REGISTERED --> NO_SHOW : event selesai tanpa check-in
    CHECKED_IN --> VERIFIED : organizer validasi kontribusi
    VERIFIED --> REVOKED : admin revoke
    CANCELLED --> [*]
    NO_SHOW --> [*]
    VERIFIED --> [*]
    REVOKED --> [*]
```

Aturan: `REGISTERED → VERIFIED` langsung **dilarang**; `CANCELLED → CHECKED_IN` dilarang; `VERIFIED` hanya setelah `CHECKED_IN`.

### 3.2 Kampanye

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_REVIEW : submit (anggaran wajib)
    PENDING_REVIEW --> ACTIVE : admin approve
    PENDING_REVIEW --> REJECTED : admin reject
    PENDING_REVIEW --> DRAFT : organizer tarik (P1)
    ACTIVE --> PAUSED : admin pause (alasan)
    PAUSED --> ACTIVE : admin lanjutkan
    ACTIVE --> CLOSED : organizer tutup (alasan)
    CLOSED --> COMPLETED : laporan akhir diunggah
    ACTIVE --> CANCELLED : admin hentikan
    CLOSED --> CANCELLED : admin hentikan
    REJECTED --> [*]
    COMPLETED --> [*]
    CANCELLED --> [*]
```

Aturan: donasi hanya diterima saat `ACTIVE`. `CLOSED` masih boleh membaca laporan; `COMPLETED` wajib punya `final_report_storage_key`.

### 3.3 Pengeluaran

```mermaid
stateDiagram-v2
    [*] --> PROPOSED
    PROPOSED --> APPROVED : reviewer setuju
    PROPOSED --> REJECTED : reviewer tolak (alasan)
    APPROVED --> PAID : pembayaran dicatat
    REJECTED --> [*]
    PAID --> [*]
```

Aturan: `PROPOSED → PAID` dilarang (harus melewati `APPROVED`). Menandai `PAID` tidak otomatis berarti on-chain; `blockchain_tx_id` menangani anchor hash bukti.

### 3.4 Distribusi

```mermaid
stateDiagram-v2
    [*] --> PLANNED
    PLANNED --> PREPARED : barang dialokasikan
    PREPARED --> DISPATCHED : dikirim
    DISPATCHED --> DELIVERED : bukti penerimaan diunggah
    DISPATCHED --> PARTIALLY_DELIVERED : sebagian diterima
    PARTIALLY_DELIVERED --> DELIVERED : sisa diterima
    DELIVERED --> VERIFIED : verifikator setuju
    PARTIALLY_DELIVERED --> VERIFIED : verifikator setuju (dengan catatan)
    DELIVERED --> NEEDS_REVIEW : bukti tidak memadai
    NEEDS_REVIEW --> VERIFIED : bukti diperbaiki
    NEEDS_REVIEW --> PARTIALLY_DELIVERED : koreksi jumlah
    PLANNED --> CANCELLED : alasan
    PREPARED --> CANCELLED : alasan (stok dikembalikan)
    VERIFIED --> [*]
    CANCELLED --> [*]
```

Aturan: `VERIFIED` hanya oleh verifikator/admin (DST-05); alokasi melebihi stok ditolak sebelum `PREPARED`; foto tanpa `privacy_review` final tidak tampil publik.

### 3.5 Transaksi blockchain & anchor

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> CONFIRMED : receipt sukses + konfirmasi cukup
    PENDING --> FAILED : revert / dropped / timeout final
    PENDING --> RETRY_REQUIRED : RPC atau relayer gagal (bisa diulang)
    RETRY_REQUIRED --> PENDING : retry (attempts + 1)
    FAILED --> RETRY_REQUIRED : admin putuskan ulang
    CONFIRMED --> [*]
```

Aturan: `RETRY_REQUIRED` tetap menyimpan `last_error`; `attempts` maksimal 5 lalu menjadi `FAILED` dan butuh keputusan admin. `FAILED` **tidak** menghapus data bisnis.

## 4. Titik keputusan penting

| Titik | Keputusan MVP | Konsekuensi |
|---|---|---|
| Pembatalan kegiatan | Peserta mendapat status `CANCELLED` + alasan tampil di halaman | Tidak ada refund otomatis (tidak ada dana) |
| Pendaftaran penuh | Ditolak, tanpa waitlist | Sederhana & dapat diuji |
| Check-in | Token 120 detik, sekali pakai, hanya organizer memindai | Anti replay, tanpa perangkat khusus |
| Verifikasi kontribusi | Manual oleh organizer | Human verification (PRD §5) |
| Donasi uang | Testnet native ETH | Wajib label simulasi |
| Pembayaran pengeluaran | Dicatat manual + bukti | Tidak ada integrasi bank |
| Verifikasi distribusi | Koordinator/admin | Relawan tidak dapat memverifikasi |
| Laporan akhir | Wajib sebelum `COMPLETED` | Kelengkapan laporan terukur (METRICS) |

## 5. Checklist implementasi alur

- [ ] Setiap transisi status punya fungsi tunggal di `lib/workflow/` (bukan logika tersebar di route).
- [ ] Transisi yang tidak terdaftar mengembalikan `409 INVALID_STATE_TRANSITION`.
- [ ] Setiap transisi menulis `audit_logs` dengan `before`/`after`.
- [ ] Alur demo (Flow A & B) berjalan end-to-end tanpa langkah manual di database.
- [ ] Kegagalan chain tidak memblokir langkah berikutnya di UI; status ditampilkan jujur.
