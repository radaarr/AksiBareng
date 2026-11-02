# AksiBareng

**Every Contribution Matters.** Platform manajemen kegiatan sosial, relawan, donasi, dan distribusi bantuan — dengan lapisan audit Web3 seperlunya.

Dua modul:

- **AksiKegiatan** — katalog kegiatan, pendaftaran relawan, kuota, pembagian tugas, QR check-in, validasi kontribusi, riwayat partisipasi.
- **AksiPeduli** — kampanye donasi, donasi uang (testnet) dan barang, inventaris, pengeluaran + bukti, batch distribusi, laporan transparansi publik.

> **Status:** MVP hackathon (Case 2 — Stronger Communities and Everyday Services). Semua donasi uang pada MVP adalah **aset testnet di Sepolia** dan diberi label simulasi. Tidak ada uang sungguhan, tidak ada klaim pembayaran fiat yang berhasil.

## Stack

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Frontend + Backend | Next.js 15 (App Router) + TypeScript | Server Components untuk baca, Route Handlers untuk API |
| Styling | Tailwind CSS | Tema tunggal, copy Bahasa Indonesia |
| Database | PostgreSQL | Prisma ORM sebagai sumber skema |
| Auth | Auth.js (next-auth v5), Credentials + Argon2id | Role & otorisasi **selalu** dicek di server |
| Smart contract | Solidity + Hardhat | `DonationTransparency`, `ContributionRegistry` |
| Jaringan | Sepolia (chainId `11155111`) | Native ETH testnet untuk demo donasi |
| Web3 client | wagmi + viem + MetaMask/WalletConnect | Wallet opsional untuk pengguna |
| Object storage | S3-compatible / storage privat | Bukti pengeluaran & distribusi, akses terkontrol |

Detail keputusan dan trade-off: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Struktur repository (target)

```
app/
  (public)/            landing, explore events, explore campaigns, transparency
  (auth)/              login, register
  dashboard/
    volunteer/         overview, my-events, contributions, donations, wallet
    organizer/         events, tasks, attendance, campaigns, inventory, expenses, distributions
    admin/             verification, campaign review, audit logs
  api/v1/              REST route handlers
components/            UI reusable
lib/
  db.ts                Prisma client singleton
  auth/                session, password hashing, guards
  authz.ts             matriks role → policy
  chain/               kontrak ABIs, klien viem, indexer
  storage/             upload privat + presigned URL
  validation/          skema Zod per endpoint
prisma/
  schema.prisma        sumber kebenaran skema
  migrations/
  seed.ts              data demo fiktif
contracts/
  contracts/           *.sol
  test/                unit test Hardhat
  scripts/             deploy + verifikasi Sepolia
docs/                  seluruh spesifikasi (lihat peta dokumen)
```

## Prasyarat

- Node.js 20+ dan pnpm
- Docker (untuk PostgreSQL lokal) — atau connection string PostgreSQL yang sudah ada
- Wallet browser dengan **Sepolia ETH dari faucet** untuk demo donasi

## Setup lokal

```bash
pnpm install
cp .env.example .env          # isi nilai seperti tabel di bawah
docker compose up -d db       # PostgreSQL lokal
pnpm prisma migrate dev       # buat skema
pnpm prisma db seed           # data demo fiktif
pnpm dev                      # http://localhost:3000
```

## Environment variables

| Variabel | Wajib | Fungsi |
|---|---|---|
| `DATABASE_URL` | ya | Koneksi PostgreSQL |
| `AUTH_SECRET` | ya | Signing session Auth.js |
| `APP_URL` | ya | Base URL untuk callback & link QR |
| `QR_TOKEN_SECRET` | ya | HMAC token check-in (jangan sama dengan `AUTH_SECRET`) |
| `EVIDENCE_PEPPER` | ya | Salt hash bukti sebelum di-anchor ke chain |
| `SEPOLIA_RPC_URL` | ya | RPC Sepolia (Alchemy/Infura/public RPC) |
| `CHAIN_ID` | ya | `11155111` |
| `NEXT_PUBLIC_DONATION_CONTRACT` | ya | Alamat `DonationTransparency` |
| `NEXT_PUBLIC_REGISTRY_CONTRACT` | ya | Alamat `ContributionRegistry` |
| `INDEXER_RELAYER_PRIVATE_KEY` | ya | Kunci **khusus testnet** untuk `issueContribution`/`record*`. Jangan pernah kunci mainnet |
| `STORAGE_ENDPOINT` / `STORAGE_BUCKET` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | ya | Object storage privat |

Aturan: `.env` tidak pernah di-commit. Kunci relayer hanya berisi dana testnet dan dibatasi role on-chain (lihat `docs/SMART_CONTRACTS.md`).

## Perintah

```bash
pnpm dev              # server pengembangan
pnpm build            # build produksi
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # unit test (Vitest)
pnpm test:integration # integrasi API + Prisma (butuh DATABASE_URL_TEST)
pnpm test:e2e         # alur demo end-to-end (Playwright)
pnpm test:a11y        # axe + Lighthouse pada halaman utama
pnpm chain:test       # unit test smart contract (Hardhat)
pnpm chain:deploy     # deploy ke Sepolia
```

## Akun demo (hasil seed)

| Peran | Email | Kata sandi | Catatan |
|---|---|---|---|
| Admin | `admin@aksibareng.test` | `Demo#2026` | Verifikator platform |
| Organizer (terverifikasi) | `komunitas@aksibareng.test` | `Demo#2026` | Pengelola kegiatan & kampanye |
| Organizer (belum terverifikasi) | `baru@aksibareng.test` | `Demo#2026` | Untuk memperlihatkan gating verifikasi |
| Volunteer/Donor | `relawan@aksibareng.test` | `Demo#2026` | Riwayat kontribusi & donasi |

Data demo fiktif: `Beach Cleanup Day`, `100 Meals for Cilacap`, wallet testnet. Detail: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Peta dokumen

| Dokumen | Isi |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, requirement ID (`AUTH-01`, `EVT-06`, …), ruang lingkup |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Diagram komponen, alur Web3, failure mode, ADR |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Skema, relasi, enum status, constraint, audit log |
| [`docs/API.md`](docs/API.md) | Endpoint, katalog error, pagination, idempotency |
| [`docs/RBAC.md`](docs/RBAC.md) | Matriks role × aksi × endpoint |
| [`docs/FLOWS.md`](docs/FLOWS.md) | Sequence diagram 4 flow + state machine |
| [`docs/SMART_CONTRACTS.md`](docs/SMART_CONTRACTS.md) | Fungsi, event, akses, strategi hash, deploy & test |
| [`docs/PRIVACY_SECURITY.md`](docs/PRIVACY_SECURITY.md) | Klasifikasi data, kontrol keamanan, aturan privasi |
| [`docs/UI_UX.md`](docs/UI_UX.md) | Peta route, inventaris halaman, state, copy, aksesibilitas |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Fase → task, traceability ke requirement ID, DoD |
| [`docs/TEAM_PLAN.md`](docs/TEAM_PLAN.md) | Pembagian tugas 3 orang, kepemilikan file, papan tugas, gate |
| [`docs/TESTING.md`](docs/TESTING.md) | Matriks uji per requirement, kasus kritis |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Skrip demo 5–7 menit + fallback |
| [`docs/METRICS.md`](docs/METRICS.md) | Protokol uji sebelum/sesudah dan lembar pengukuran |
| [`AGENTS.md`](AGENTS.md) | Konvensi kerja untuk kontributor & AI agent |

## Prinsip yang tidak boleh dilanggar

1. Data pribadi (nama penerima, kontak, alamat, identitas, kondisi kesehatan) **tidak pernah** masuk blockchain atau storage publik.
2. Blockchain tidak boleh dipakai sebagai bukti tunggal bahwa bantuan sampai. Verifikasi manusia tetap ada.
3. Jangan menampilkan status `CONFIRMED` sebelum transaksi benar-benar terkonfirmasi di jaringan.
4. Wallet opsional: melihat katalog, mendaftar kegiatan, dan melihat laporan transparansi tidak memerlukan wallet.
5. Semua angka donasi testnet dan data demo diberi label **simulasi/testnet**.
