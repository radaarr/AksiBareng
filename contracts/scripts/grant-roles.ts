import { ethers } from "hardhat"

// docs/SMART_CONTRACTS.md §7 — grant role SETELAH deploy, dari akun admin (bukan relayer).
// Contoh: pnpm hardhat run scripts/grant-roles.ts --network sepolia
// Isi alamat lewat env: MANAGER_ADDRESS, RECORDER_ADDRESS, APPROVER_ADDRESS, TREASURER_ADDRESS,
// CAMPAIGN_KEY_HEX (bytes32 hex untuk smoke test), ORGANIZER_ADDRESS.
async function main() {
  const [admin] = await ethers.getSigners()
  if (!admin) throw new Error("DEPLOYER_PRIVATE_KEY belum diisi di .env")

  const address = process.env.DONATION_CONTRACT
  if (!address) throw new Error("DONATION_CONTRACT belum diisi di .env")

  const contract = await ethers.getContractAt("DonationTransparency", address, admin)

  const jobs: Array<[string, string | undefined, () => Promise<string>]> = [
    ["CAMPAIGN_MANAGER_ROLE", process.env.MANAGER_ADDRESS, () => contract.CAMPAIGN_MANAGER_ROLE()],
    ["RECORDER_ROLE", process.env.RECORDER_ADDRESS, () => contract.RECORDER_ROLE()],
    ["APPROVER_ROLE", process.env.APPROVER_ADDRESS, () => contract.APPROVER_ROLE()],
    ["TREASURER_ROLE", process.env.TREASURER_ADDRESS, () => contract.TREASURER_ROLE()]
  ]

  for (const [roleName, target, roleGetter] of jobs) {
    if (!target) {
      process.stdout.write(`lewati ${roleName}: alamat kosong\n`)
      continue
    }
    const role = await roleGetter()
    await (await contract.grantRole(role, target)).wait()
    process.stdout.write(`granted ${roleName} -> ${target}\n`)
  }

  process.stdout.write("Selesai. Relayer memegang RECORDER_ROLE saja — jangan grant DEFAULT_ADMIN_ROLE ke server.\n")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

// Referensi env yang dibutuhkan:
// DONATION_CONTRACT="0x…"
// MANAGER_ADDRESS="0x…"   (relayer admin: createCampaign/activateCampaign/closeCampaign)
// RECORDER_ADDRESS="0x…"  (relayer operasional)
// APPROVER_ADDRESS="0x…"  (verifikator; boleh multisig, P1)
// TREASURER_ADDRESS="0x…" (bendahara testnet)
