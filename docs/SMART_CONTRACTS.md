# Smart Contract — AksiBareng

Dua kontrak di Sepolia (`chainId 11155111`), ditulis Solidity `^0.8.24`, tanpa proxy (immutable pada MVP). Requirement: `docs/PRD.md` §10, keputusan dana: ADR-004 di `docs/ARCHITECTURE.md`.

- `DonationTransparency.sol` — kampanye, donasi testnet, pengajuan/persetujuan pengeluaran, anchor hash bukti.
- `ContributionRegistry.sol` — penerbitan kontribusi relawan yang telah divalidasi.

## 1. Prinsip desain

1. **Minimal data on-chain.** Hanya `bytes32` kunci hasil hash, alamat, nominal, dan timestamp. Tidak ada nama, email, deskripsi cerita, atau lokasi.
2. **Kunci berbasis hash.** `campaignKey = keccak256("campaign:" + uuid)`, `eventKey = keccak256("event:" + uuid)`, `expenseKey`/`batchKey` analog. UUID v7 punya entropi cukup sehingga kunci tidak dapat ditebak.
3. **Wallet opsional.** `ContributionRegistry.issueContribution` menerima `address(0)` untuk relawan tanpa wallet — kontribusi tetap tercatat, tanpa memaksa pengguna membuat wallet.
4. **Kegagalan chain tidak menghapus data.** Semua pemanggilan berasal dari relayer dengan `idempotencyKey` yang dipetakan di database.
5. **Tidak ada fungsi yang mengubah histori.** Koreksi dilakukan dengan menerbitkan catatan baru atau menandai `revoked`; tidak ada `delete`/`update` nilai lama.

## 2. `DonationTransparency.sol`

### 2.1 State

```solidity
enum CampaignStatus { None, Active, Paused, Closed }
enum ExpenseStatus  { None, Proposed, Approved, Released, Rejected }

struct Campaign {
    bytes32 key;            // keccak256("campaign:" + uuid)
    address organizer;      // wallet organizer (bukan identitas personal)
    uint256 targetWei;
    uint256 totalDonatedWei;
    uint256 totalReleasedWei;
    uint32  createdAt;
    CampaignStatus status;
}

struct ExpenseRecord {
    bytes32 key;            // keccak256("expense:" + uuid)
    uint256 amountWei;
    bytes32 evidenceHash;   // keccak256(manifest ‖ salt)
    address proposedBy;
    address approvedBy;
    uint32  proposedAt;
    ExpenseStatus status;
}
```

### 2.2 Fungsi

| Fungsi | Akses | Perilaku |
|---|---|---|
| `createCampaign(bytes32 key, address organizer, uint256 targetWei) returns (uint256 id)` | `CAMPAIGN_MANAGER_ROLE` | `key` unik; `targetWei > 0`; emit `CampaignCreated` |
| `activateCampaign(uint256 id)` | `CAMPAIGN_MANAGER_ROLE` | Hanya setelah review admin di database |
| `setCampaignPaused(uint256 id, bool paused)` | `CAMPAIGN_MANAGER_ROLE` | Untuk penindakan (PRD §9.1) |
| `donate(uint256 id) payable nonReentrant` | publik | Revert bila bukan `Active`, `msg.value == 0`; tambah `totalDonatedWei`; emit `DonationReceived` |
| `proposeExpense(uint256 id, bytes32 expenseKey, uint256 amountWei) ` | `RECORDER_ROLE` + organizer kampanye | Simpan `Proposed` |
| `approveExpense(uint256 id, bytes32 expenseKey)` | `APPROVER_ROLE` | `approvedBy != proposedBy`; emit `ExpenseApproved` |
| `recordExpenseProof(uint256 id, bytes32 expenseKey, bytes32 evidenceHash)` | `RECORDER_ROLE` | `evidenceHash != 0`; boleh sebelum/sesudah pembayaran; emit `ExpenseProofRecorded` |
| `recordDistribution(uint256 id, bytes32 batchKey, bytes32 evidenceHash)` | `RECORDER_ROLE` | `evidenceHash != 0`; emit `DistributionRecorded` |
| `releaseFunds(uint256 id, bytes32 expenseKey, address payable to)` | `TREASURER_ROLE` | Hanya `Approved`; jumlah ≤ saldo kampanye; tandai `Released`; emit `FundsReleased` |
| `closeCampaign(uint256 id, bytes32 reportHash)` | `CAMPAIGN_MANAGER_ROLE` | Status `Closed`; emit `CampaignClosed` |
| `getCampaign(uint256 id) view` | publik | Balikan struct |
| `getExpense(uint256 id, bytes32 expenseKey) view` | publik | Balikan struct |
| `campaignBalance(uint256 id) view` | publik | `address(this).balance` per kampanye dihitung dari ledger internal |

Catatan `releaseFunds`: hanya mengendalikan ETH testnet yang benar-benar berada di kontrak. Tidak dapat menyentuh Rupiah di rekening bank (PRD §10.2), dan pada demo utama fungsi ini **tidak** dipakai (ADR-004).

### 2.3 Event

```solidity
event CampaignCreated(uint256 indexed id, bytes32 indexed key, address indexed organizer, uint256 targetWei);
event CampaignStatusChanged(uint256 indexed id, CampaignStatus status);
event DonationReceived(uint256 indexed id, address indexed donor, uint256 amountWei, uint256 totalWei);
event ExpenseProposed(uint256 indexed id, bytes32 indexed expenseKey, uint256 amountWei);
event ExpenseApproved(uint256 indexed id, bytes32 indexed expenseKey, address indexed approver);
event ExpenseProofRecorded(uint256 indexed id, bytes32 indexed expenseKey, bytes32 evidenceHash);
event DistributionRecorded(uint256 indexed id, bytes32 indexed batchKey, bytes32 evidenceHash);
event FundsReleased(uint256 indexed id, bytes32 indexed expenseKey, address indexed to, uint256 amountWei);
event CampaignClosed(uint256 indexed id, bytes32 reportHash);
```

Tidak ada event yang memuat string bebas, nama, atau URL.

### 2.4 Revert reasons

`ZeroAddress`, `ZeroAmount`, `InvalidKey`, `DuplicateKey`, `UnknownCampaign`, `CampaignNotActive`, `CampaignNotPaused`, `InvalidStatus`, `NotCampaignOrganizer`, `SelfApprovalNotAllowed`, `InsufficientBalance`, `ZeroEvidenceHash`, `Paused`.

## 3. `ContributionRegistry.sol`

### 3.1 State

```solidity
enum ContributionState { None, Issued, Revoked }

struct Contribution {
    bytes32 contributionKey; // keccak256("contribution:" + eventUuid + ":" + userUuid)
    bytes32 eventKey;        // keccak256("event:" + uuid)
    address organizer;       // penerbit
    address volunteer;       // boleh address(0) bila relawan tanpa wallet
    uint32  issuedAt;
    ContributionState state;
}
```

### 3.2 Fungsi

| Fungsi | Akses | Perilaku |
|---|---|---|
| `authorizeOrganizer(address organizer)` | `DEFAULT_ADMIN_ROLE` | Emit `OrganizerAuthorized` |
| `revokeOrganizer(address organizer)` | `DEFAULT_ADMIN_ROLE` | Emit `OrganizerRevoked`; tidak menghapus kontribusi lama |
| `issueContribution(bytes32 contributionKey, bytes32 eventKey, address volunteer)` | `ISSUER_ROLE` + organizer terotorisasi | Tolak kunci duplikat (ANTI penerbitan ganda untuk event+relawan yang sama) |
| `revokeContribution(bytes32 contributionKey, bytes32 reasonHash)` | `ISSUER_ROLE`/admin | Hanya dari `Issued`; emit `ContributionRevoked` |
| `verifyContribution(bytes32 contributionKey) view returns (ContributionState, address, uint32)` | publik | Untuk halaman verifikasi |
| `isAuthorizedOrganizer(address) view` | publik | |

`contributionKey` dibentuk server dari `eventId + userId` sehingga penerbitan ganda untuk kombinasi sama tidak mungkin terjadi, bahkan bila relayer mencoba dua kali.

### 3.3 Event

```solidity
event OrganizerAuthorized(address indexed organizer);
event OrganizerRevoked(address indexed organizer);
event ContributionIssued(bytes32 indexed contributionKey, bytes32 indexed eventKey, address indexed organizer, address volunteer, uint32 issuedAt);
event ContributionRevoked(bytes32 indexed contributionKey, bytes32 reasonHash);
```

`eventKey` adalah hash, bukan UUID mentah, agar tidak ada pemetaan langsung ke data internal tanpa izin server.

## 4. Hak akses on-chain

| Role | Diberikan ke | Kemampuan |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | multisig/akun admin platform | Kelola role, `authorizeOrganizer` |
| `CAMPAIGN_MANAGER_ROLE` | relayer admin | `createCampaign`, `activateCampaign`, `setCampaignPaused`, `closeCampaign` |
| `RECORDER_ROLE` | relayer operasional | `proposeExpense`, `recordExpenseProof`, `recordDistribution` |
| `APPROVER_ROLE` | akun verifikator (boleh multisig 2-dari-3, P1) | `approveExpense` |
| `TREASURER_ROLE` | akun bendahara testnet | `releaseFunds` |
| `ISSUER_ROLE` | relayer operasional | `issueContribution`, `revokeContribution` |

Aturan:

- Relayer memegang `RECORDER_ROLE` + `ISSUER_ROLE` saja — **bukan** `DEFAULT_ADMIN_ROLE` maupun `TREASURER_ROLE`.
- `DEFAULT_ADMIN_ROLE` disimpan di wallet yang tidak dipakai server (mis. MetaMask presenter) agar kompromi server tidak dapat mengambil alih kontrak.
- Tidak ada fungsi publik yang mengubah nominal donasi, menghapus histori, atau menarik dana ke alamat arbitrer.
- `Pausable` pada `DonationTransparency`: `pause()` memblokir `donate` dan `releaseFunds`, tidak memblokir `record*` (pencatatan bukti tetap boleh).

## 5. Strategi hash bukti

Manifest dibuat server, disimpan di database, dan dapat direkonstruksi publik:

```json
{"batchKey":"…","campaignKey":"…","itemCount":300,"recordedAt":"2026-11-02T03:11:00Z","sha256":"…","type":"distribution","version":1}
```

Aturan:

1. JSON dengan kunci terurut, tanpa spasi, UTF-8, newline tunggal di akhir.
2. `salt` = 32 byte acak per dokumen, disimpan di database (`document_salt`).
3. `evidenceHash = keccak256(abi.encodePacked(manifestBytes, salt))`.
4. Endpoint `GET /public/verify?hash=…&manifest=…` menghitung ulang hash dan membandingkan dengan yang ada di chain.
5. Salt mencegah serangan tebak-isi terhadap file yang mungkin sudah beredar; salt **tidak** dipublikasikan, hanya digunakan server untuk verifikasi.

Hash membuktikan integritas file, **bukan** kebenaran isi (PRD §10.5). UI wajib menyatakan ini.

## 6. Yang tidak boleh on-chain

Nama lengkap, email, telepon, alamat rumah, koordinat, NIK, kondisi kesehatan, nama penerima bantuan, cerita kampanye, deskripsi pengeluaran bebas teks, URL dokumen, base64 file, IP address. Semua itu ada di PostgreSQL/object storage.

## 7. Deployment

```bash
cd contracts
cp .env.example .env      # SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY (testnet only)
pnpm hardhat compile
pnpm hardhat test
pnpm hardhat run scripts/deploy.ts --network sepolia
pnpm hardhat verify --network sepolia <address> <constructor args>
```

Setelah deploy:

1. Catat kedua alamat ke `README.md` (bagian kontrak), `NEXT_PUBLIC_*` env, dan `platform_settings`.
2. Grant role lewat `scripts/grant-roles.ts` dari akun admin (bukan relayer).
3. Uji satu donasi kecil dan satu `issueContribution` sebelum demo.
4. Simpan `deployments/sepolia.json` (alamat, block, tx hash, timestamp) — bukan private key.

## 8. Test yang wajib ada

Test dijalankan dengan `pnpm chain:test` (`contracts/`, Hardhat); CI menjalankan job `chain`.

`contracts/test/DonationTransparency.t.sol` / `.ts`:

- [x] `createCampaign` menolak pemanggil tanpa role; menolak `targetWei == 0`; menolak `key` duplikat.
- [x] `donate` menolak saat `Paused`/`Closed`; menolak `msg.value == 0`; menambah `totalDonatedWei` dengan benar untuk dua donatur.
- [x] `proposeExpense` hanya untuk organizer kampanye tersebut.
- [x] `approveExpense` menolak `approvedBy == proposedBy`.
- [x] `releaseFunds` menolak sebelum `Approved`; menolak melebihi saldo; menandai `Released` dan mencegah double release.
- [x] `recordExpenseProof` menolak `evidenceHash == 0`; menerima dua bukti untuk pengeluaran sama (riwayat).
- [x] `recordDistribution` hanya `RECORDER_ROLE`.
- [x] `closeCampaign` hanya manager; donasi setelah `Closed` revert.
- [x] `pause/unpause` hanya admin; efeknya hanya pada `donate`/`releaseFunds`.
- [x] Reentrancy: kontrak penyerang gagal saat `releaseFunds` (guard aktif).
- [x] Fuzz: `donate` dengan nominal acak tidak pernah membuat `totalDonatedWei` meluap (Solidity 0.8 + batas realistis).
- [x] Role admin tidak dapat diberikan oleh relayer.

`contracts/test/ContributionRegistry.t.sol`:

- [ ] `issueContribution` menolak organizer tanpa `ISSUER_ROLE` atau belum `authorizeOrganizer`.
- [ ] Penerbitan ganda dengan `contributionKey` sama revert `DuplicateKey`.
- [ ] `issueContribution` dengan `volunteer == address(0)` berhasil (relawan tanpa wallet).
- [ ] `revokeContribution` hanya dari `Issued`; revoke ganda revert; kontribusi lain tidak terpengaruh.
- [ ] `verifyContribution` mengembalikan state dan timestamp yang benar.
- [ ] `revokeOrganizer` memblokir penerbitan baru, tidak mengubah kontribusi lama.
- [ ] Event yang dipancarkan tidak memuat string bebas (review manual; dijaga oleh tipe `bytes32`).

## 9. Batasan yang harus disampaikan saat demo

- Blockchain menjamin catatan tidak mudah diubah, **bukan** bahwa bantuan benar-benar diterima.
- Hash hanya membuktikan integritas file.
- Alamat wallet bukan identitas anonim sempurna.
- Donasi demo adalah aset testnet tanpa nilai ekonomi.
- Kontrak belum diaudit pihak ketiga; jangan dipakai dengan dana nyata.
