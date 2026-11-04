import { ethers, network } from "hardhat"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

// docs/SMART_CONTRACTS.md §7 — deploy ke Sepolia lalu simpan deployments/sepolia.json.
// Jangan jalankan tanpa .env terisi; tidak ada private key di repo.
async function main() {
  if (network.name === "hardhat" || network.name === "localhost") {
    throw new Error("Jalankan dengan --network sepolia; lokal tidak perlu deploy.")
  }

  const [deployer] = await ethers.getSigners()
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY belum diisi di .env")

  const factory = await ethers.getContractFactory("DonationTransparency")
  const contract = await factory.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  const deployment = await ethers.provider.getTransactionReceipt(contract.deploymentTransaction()!.hash)

  mkdirSync(join(__dirname, "..", "..", "deployments"), { recursive: true })
  const file = join(__dirname, "..", "..", "deployments", "sepolia.json")
  writeFileSync(
    file,
    JSON.stringify(
      {
        network: network.name,
        chainId: 11155111,
        donationTransparency: address,
        deployedAt: new Date().toISOString(),
        deployTxHash: deployment?.hash ?? null,
        blockNumber: deployment?.blockNumber ?? null,
        deployer: deployer.address
      },
      null,
      2
    ) + "\n"
  )
  process.stdout.write(`DonationTransparency deployed: ${address}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
