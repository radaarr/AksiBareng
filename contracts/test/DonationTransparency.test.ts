import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import type { Signer } from "ethers"

const KEY_A = ethers.keccak256(ethers.toUtf8Bytes("campaign:aaa"))
const KEY_B = ethers.keccak256(ethers.toUtf8Bytes("campaign:bbb"))
const EXPENSE_KEY = ethers.keccak256(ethers.toUtf8Bytes("expense:111"))
const BATCH_KEY = ethers.keccak256(ethers.toUtf8Bytes("batch:111"))
const EVIDENCE = ethers.keccak256(ethers.toUtf8Bytes("manifest-a"))
const EVIDENCE_2 = ethers.keccak256(ethers.toUtf8Bytes("manifest-b"))

describe("DonationTransparency", function () {
  async function deployFixture() {
    const [deployer, organization, relayer, verifier, treasurer, outsider, donorA, donorB] =
      await ethers.getSigners()

    const factory = await ethers.getContractFactory("DonationTransparency")
    const contract = await factory.deploy()

    const MANAGER = await contract.CAMPAIGN_MANAGER_ROLE()
    const RECORDER = await contract.RECORDER_ROLE()
    const APPROVER = await contract.APPROVER_ROLE()
    const TREASURER = await contract.TREASURER_ROLE()

    await (await contract.grantRole(MANAGER, relayer.address)).wait()
    await (await contract.grantRole(RECORDER, relayer.address)).wait()
    // Organizer kampanye harus memegang RECORDER_ROLE sendiri untuk proposeExpense.
    await (await contract.grantRole(RECORDER, organization.address)).wait()
    await (await contract.grantRole(APPROVER, verifier.address)).wait()
    await (await contract.grantRole(TREASURER, treasurer.address)).wait()

    return { contract, deployer, organization, relayer, verifier, treasurer, outsider, donorA, donorB }
  }

  async function createActiveCampaign(c: {
    contract: Awaited<ReturnType<typeof deployFixture>>["contract"]
    organization: Signer
    relayer: Signer
    key?: string
  }) {
    const { contract, organization, relayer, key = KEY_A } = c
    await (await contract.connect(relayer).createCampaign(key, await organization.getAddress(), ethers.parseEther("1"))).wait()
    const id = (await contract.campaignIdByKey(key)) as bigint
    await (await contract.connect(relayer).activateCampaign(id)).wait()
    return id
  }

  describe("createCampaign", function () {
    it("menolak pemanggil tanpa role", async function () {
      const { contract, organization, outsider } = await loadFixture(deployFixture)
      await expect(
        contract.connect(outsider).createCampaign(KEY_A, await organization.getAddress(), 1n)
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
    })

    it("menolak targetWei == 0, key duplikat, dan key nol", async function () {
      const { contract, organization, relayer } = await loadFixture(deployFixture)
      const org = await organization.getAddress()
      await expect(
        contract.connect(relayer).createCampaign(KEY_A, org, 0n)
      ).to.be.revertedWithCustomError(contract, "ZeroAmount")
      await (await contract.connect(relayer).createCampaign(KEY_A, org, 1n)).wait()
      await expect(contract.connect(relayer).createCampaign(KEY_A, org, 1n)).to.be.revertedWithCustomError(
        contract,
        "DuplicateKey"
      )
      await expect(
        contract.connect(relayer).createCampaign(ethers.ZeroHash, org, 1n)
      ).to.be.revertedWithCustomError(contract, "InvalidKey")
    })

    it("kampanye baru berstatus None; aktivasi hanya manager", async function () {
      const { contract, organization, relayer, outsider } = await loadFixture(deployFixture)
      const org = await organization.getAddress()
      await (await contract.connect(relayer).createCampaign(KEY_A, org, 1n)).wait()
      expect((await contract.getCampaign(1n)).status).to.equal(0n) // None
      await expect(contract.connect(outsider).activateCampaign(1n)).to.be.revertedWithCustomError(
        contract,
        "AccessControlUnauthorizedAccount"
      )
      await (await contract.connect(relayer).activateCampaign(1n)).wait()
      expect((await contract.getCampaign(1n)).status).to.equal(1n) // Active
    })

    it("id bertambah dan campaignIdByKey konsisten", async function () {
      const { contract, organization, relayer } = await loadFixture(deployFixture)
      const org = await organization.getAddress()
      await (await contract.connect(relayer).createCampaign(KEY_A, org, 1n)).wait()
      await (await contract.connect(relayer).createCampaign(KEY_B, org, 2n)).wait()
      expect(await contract.campaignIdByKey(KEY_A)).to.equal(1n)
      expect(await contract.campaignIdByKey(KEY_B)).to.equal(2n)
      expect(await contract.nextCampaignId()).to.equal(2n)
    })
  })

  describe("donate", function () {
    it("menolak sebelum aktivasi, saat paused, dan setelah closed", async function () {
      const { contract, organization, relayer, donorA } = await loadFixture(deployFixture)
      const org = await organization.getAddress()
      await (await contract.connect(relayer).createCampaign(KEY_A, org, 10n)).wait()
      await expect(
        contract.connect(donorA).donate(1n, { value: 1n })
      ).to.be.revertedWithCustomError(contract, "CampaignNotActive")

      await (await contract.connect(relayer).activateCampaign(1n)).wait()
      await (await contract.connect(relayer).setCampaignPaused(1n, true)).wait()
      await expect(
        contract.connect(donorA).donate(1n, { value: 1n })
      ).to.be.revertedWithCustomError(contract, "CampaignNotActive")
      await (await contract.connect(relayer).setCampaignPaused(1n, false)).wait()
      await (await contract.connect(relayer).closeCampaign(1n, ethers.ZeroHash)).wait()
      await expect(
        contract.connect(donorA).donate(1n, { value: 1n })
      ).to.be.revertedWithCustomError(contract, "CampaignNotActive")
    })

    it("menolak msg.value == 0", async function () {
      const { contract, organization, relayer, donorA } = await loadFixture(deployFixture)
      await createActiveCampaign({ contract, organization, relayer })
      await expect(contract.connect(donorA).donate(1n, { value: 0n })).to.be.revertedWithCustomError(
        contract,
        "ZeroAmount"
      )
    })

    it("dua donatur mengakumulasi totalDonatedWei", async function () {
      const { contract, organization, relayer, donorA, donorB } = await loadFixture(deployFixture)
      await createActiveCampaign({ contract, organization, relayer })
      await (await contract.connect(donorA).donate(1n, { value: ethers.parseEther("0.3") })).wait()
      await (await contract.connect(donorB).donate(1n, { value: ethers.parseEther("0.7") })).wait()
      const c = await contract.getCampaign(1n)
      expect(c.totalDonatedWei).to.equal(ethers.parseEther("1"))
      expect(await contract.campaignBalance(1n)).to.equal(ethers.parseEther("1"))
    })

    it("fuzz: nominal acak terakumulasi tepat", async function () {
      const { contract, organization, relayer, donorA } = await loadFixture(deployFixture)
      await createActiveCampaign({ contract, organization, relayer })

      let expected = 0n
      for (let i = 0; i < 25; i += 1) {
        const value = BigInt(Math.floor(Math.random() * 1_000_000_000_000_000_000) + 1)
        expected += value
        await (await contract.connect(donorA).donate(1n, { value })).wait()
      }
      expect((await contract.getCampaign(1n)).totalDonatedWei).to.equal(expected)
    })
  })

  describe("expense flow", function () {
    async function activeWithExpense() {
      const fixture = await loadFixture(deployFixture)
      const { contract, organization, relayer } = fixture
      const id = await createActiveCampaign({ contract, organization, relayer })
      await (
        await contract.connect(organization).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.4"))
      ).wait()
      return { ...fixture, id }
    }

    it("proposeExpense: hanya organizer dengan RECORDER_ROLE", async function () {
      const { contract, organization, relayer, outsider } = await loadFixture(deployFixture)
      const id = await createActiveCampaign({ contract, organization, relayer })

      await expect(
        contract.connect(outsider).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.4"))
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")

      await expect(
        contract.connect(relayer).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.4"))
      ).to.be.revertedWithCustomError(contract, "NotCampaignOrganizer")

      await (
        await contract.connect(organization).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.4"))
      ).wait()
      expect((await contract.getExpense(id, EXPENSE_KEY)).status).to.equal(1n) // Proposed
    })

    it("approveExpense menolak persetujuan diri sendiri", async function () {
      const { contract, organization, verifier, id } = await activeWithExpense()

      // verifier != proposedBy → boleh approve.
      await (await contract.connect(verifier).approveExpense(id, EXPENSE_KEY)).wait()
      expect((await contract.getExpense(id, EXPENSE_KEY)).approvedBy).to.equal(await verifier.getAddress())

      // organizer mengusulkan + menyetujui sendiri → ditolak.
      const expense2 = ethers.keccak256(ethers.toUtf8Bytes("expense:self"))
      const APPROVER = await contract.APPROVER_ROLE()
      await (await contract.grantRole(APPROVER, await organization.getAddress())).wait()
      await (await contract.connect(organization).proposeExpense(id, expense2, 1n)).wait()
      await expect(
        contract.connect(organization).approveExpense(id, expense2)
      ).to.be.revertedWithCustomError(contract, "SelfApprovalNotAllowed")
    })

    it("recordExpenseProof: evidenceHash nol ditolak; dua bukti diterima", async function () {
      const { contract, relayer, id } = await activeWithExpense()
      await expect(
        contract.connect(relayer).recordExpenseProof(id, EXPENSE_KEY, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(contract, "ZeroEvidenceHash")
      await (await contract.connect(relayer).recordExpenseProof(id, EXPENSE_KEY, EVIDENCE)).wait()
      await (await contract.connect(relayer).recordExpenseProof(id, EXPENSE_KEY, EVIDENCE_2)).wait()
      expect((await contract.getExpense(id, EXPENSE_KEY)).evidenceHash).to.equal(EVIDENCE_2)
    })

    it("releaseFunds: sebelum Approved ditolak; melebihi saldo ditolak; Released sekali", async function () {
      const { contract, organization, relayer, verifier, treasurer, donorA, id } =
        await activeWithExpense()
      await (await contract.connect(donorA).donate(id, { value: ethers.parseEther("1") })).wait()

      await expect(
        contract.connect(treasurer).releaseFunds(id, EXPENSE_KEY, await treasurer.getAddress())
      ).to.be.reverted

      await (await contract.connect(verifier).approveExpense(id, EXPENSE_KEY)).wait()
      const before = await ethers.provider.getBalance(await treasurer.getAddress())
      const tx = await contract
        .connect(treasurer)
        .releaseFunds(id, EXPENSE_KEY, await treasurer.getAddress())
      const receipt = await tx.wait()
      const gasCost = receipt!.gasUsed * receipt!.gasPrice
      const after = await ethers.provider.getBalance(await treasurer.getAddress())

      expect((await contract.getExpense(id, EXPENSE_KEY)).status).to.equal(3n) // Released
      expect(await contract.campaignBalance(id)).to.equal(ethers.parseEther("0.6"))
      expect(after - before + gasCost).to.equal(ethers.parseEther("0.4"))

      await expect(
        contract.connect(treasurer).releaseFunds(id, EXPENSE_KEY, await treasurer.getAddress())
      ).to.be.reverted

      const bigKey = ethers.keccak256(ethers.toUtf8Bytes("expense:big"))
      await (await contract.connect(organization).proposeExpense(id, bigKey, ethers.parseEther("10"))).wait()
      await (await contract.connect(verifier).approveExpense(id, bigKey)).wait()
      await expect(
        contract.connect(treasurer).releaseFunds(id, bigKey, await treasurer.getAddress())
      ).to.be.revertedWithCustomError(contract, "InsufficientBalance")
      void relayer
    })

    it("recordDistribution hanya RECORDER_ROLE", async function () {
      const { contract, relayer, outsider, id } = await activeWithExpense()
      await (await contract.connect(relayer).recordDistribution(id, BATCH_KEY, EVIDENCE)).wait()
      await expect(
        contract.connect(outsider).recordDistribution(id, BATCH_KEY, EVIDENCE)
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
    })
  })

  describe("closeCampaign", function () {
    it("hanya manager; campaign tertutup menolak donasi", async function () {
      const { contract, organization, relayer, outsider, donorA } = await loadFixture(deployFixture)
      const id = await createActiveCampaign({ contract, organization, relayer })

      await expect(
        contract.connect(outsider).closeCampaign(id, EVIDENCE)
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")

      await (await contract.connect(relayer).closeCampaign(id, EVIDENCE)).wait()
      expect((await contract.getCampaign(id)).status).to.equal(3n) // Closed
      await expect(
        contract.connect(donorA).donate(id, { value: 1n })
      ).to.be.revertedWithCustomError(contract, "CampaignNotActive")
    })

    it("setCampaignPaused: pause harus dari Active, resume harus dari Paused", async function () {
      const { contract, organization, relayer } = await loadFixture(deployFixture)
      const id = await createActiveCampaign({ contract, organization, relayer })
      await expect(
        contract.connect(relayer).setCampaignPaused(id, false)
      ).to.be.revertedWithCustomError(contract, "CampaignNotPaused")
      await (await contract.connect(relayer).setCampaignPaused(id, true)).wait()
      expect((await contract.getCampaign(id)).status).to.equal(2n) // Paused
      await expect(
        contract.connect(relayer).setCampaignPaused(id, true)
      ).to.be.revertedWithCustomError(contract, "InvalidStatus")
    })
  })

  describe("pause/unpause (contract-wide)", function () {
    it("hanya admin; donate & releaseFunds terblokir, pencatatan bukti tetap jalan", async function () {
      const { contract, organization, relayer, verifier, treasurer, donorA, donorB, outsider } =
        await loadFixture(deployFixture)
      const id = await createActiveCampaign({ contract, organization, relayer })
      await (
        await contract.connect(organization).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.1"))
      ).wait()

      await expect(
        contract.connect(outsider).pause()
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")

      const deployer = (await ethers.getSigners())[0]!
      await (await contract.connect(deployer).pause()).wait()
      await expect(
        contract.connect(donorA).donate(id, { value: 1n })
      ).to.be.revertedWithCustomError(contract, "EnforcedPause")

      // Bukti dan approval tetap boleh saat paused.
      await (await contract.connect(relayer).recordExpenseProof(id, EXPENSE_KEY, EVIDENCE)).wait()
      await (await contract.connect(verifier).approveExpense(id, EXPENSE_KEY)).wait()

      await expect(
        contract.connect(treasurer).releaseFunds(id, EXPENSE_KEY, await treasurer.getAddress())
      ).to.be.revertedWithCustomError(contract, "EnforcedPause")

      await (await contract.connect(deployer).unpause()).wait()
      await (await contract.connect(donorB).donate(id, { value: 1n })).wait()
    })
  })

  describe("reentrancy", function () {
    it("kontrak penyerang gagal saat releaseFunds (guard aktif)", async function () {
      const { contract, organization, relayer, verifier, donorA } = await loadFixture(deployFixture)
      const id = await createActiveCampaign({ contract, organization, relayer })
      await (await contract.connect(donorA).donate(id, { value: ethers.parseEther("1") })).wait()
      await (
        await contract.connect(organization).proposeExpense(id, EXPENSE_KEY, ethers.parseEther("0.5"))
      ).wait()
      await (await contract.connect(verifier).approveExpense(id, EXPENSE_KEY)).wait()

      const attackerFactory = await ethers.getContractFactory("ReentrantAttacker")
      const attacker = await attackerFactory.deploy(await contract.getAddress())
      const TREASURER = await contract.TREASURER_ROLE()
      await (await contract.grantRole(TREASURER, await attacker.getAddress())).wait()
      await (await attacker.arm(id, EXPENSE_KEY)).wait()

      await expect(attacker.attack()).to.be.reverted
      expect((await contract.getExpense(id, EXPENSE_KEY)).status).to.equal(2n) // Approved, belum Released
      expect(await contract.campaignBalance(id)).to.equal(ethers.parseEther("1"))
    })
  })

  describe("akses role", function () {
    it("relayer tidak dapat memberikan DEFAULT_ADMIN_ROLE", async function () {
      const { contract, relayer, outsider } = await loadFixture(deployFixture)
      const DEFAULT_ADMIN = await contract.DEFAULT_ADMIN_ROLE()
      await expect(
        contract.connect(relayer).grantRole(DEFAULT_ADMIN, await outsider.getAddress())
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount")
    })

    it("hasRole: hanya deployer yang memegang DEFAULT_ADMIN_ROLE", async function () {
      const { contract, deployer, relayer, outsider } = await loadFixture(deployFixture)
      const adminRole = await contract.DEFAULT_ADMIN_ROLE()
      expect(await contract.hasRole(adminRole, await deployer.getAddress())).to.equal(true)
      expect(await contract.hasRole(adminRole, await relayer.getAddress())).to.equal(false)
      expect(await contract.hasRole(adminRole, await outsider.getAddress())).to.equal(false)
    })
  })
})
