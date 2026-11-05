/**
 * Idempotent seed script untuk data demo AksiPeduli.
 * - Bisa dijalankan berulang kali (upsert) tanpa error.
 * - Semua data fiktif; tidak ada PII nyata (hanya @aksibareng.test, nama fiktif).
 * - Data realistis untuk presenter: kampanye, donasi, organisasi, barang, expense.
 * - Gunakan id tetap (dengan aturan: jika sudah ada, di-update; jika belum, dibuat).
 * - Idempoten lewat kunci alami: email user, slug campaign/organization.
 */
import 'dotenv/config'
import { PrismaClient } from '@/prisma/client'
import { hashPassword } from '@/lib/auth/password'

const prisma = new PrismaClient()
const DEMO_PASSWORD = 'Demo#2026'

async function main() {
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD)
  const now = new Date()

  // --- Users (presenter accounts) ---
  // 4 akun demo + presenter accounts for AksiPeduli demo
  const presenterAccounts = [
    {
      email: 'presenter1@aksibareng.test',
      displayName: 'Andi Saputra',
      role: 'ORGANIZER',
    },
    {
      email: 'presenter2@aksibareng.test',
      displayName: 'Putri Malik',
      role: 'ORGANIZER',
    },
    {
      email: 'presenter3@aksibareng.test',
      displayName: 'Budi Santoso',
      role: 'VOLUNTEER',
    },
    {
      email: 'walek@aksibareng.test',
      displayName: 'Walek Demo',
      role: 'VOLUNTEER',
    },
  ]

  for (const acc of presenterAccounts) {
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        displayName: acc.displayName,
        role: acc.role,
        passwordHash: demoPasswordHash,
      },
      create: {
        email: acc.email,
        passwordHash: demoPasswordHash,
        displayName: acc.displayName,
        role: acc.role,
      },
    })
  }

  // --- Categories ---
  const campaignCat = await prisma.category.upsert({
    where: { scope_slug: { scope: 'CAMPAIGN', slug: 'pangan' } },
    update: { name: 'Pangan' },
    create: { scope: 'CAMPAIGN', name: 'Pangan', slug: 'pangan' },
  })

  const expenseCat = await prisma.category.upsert({
    where: { scope_slug: { scope: 'EXPENSE', slug: 'bahan-makanan' } },
    update: { name: 'Bahan makanan' },
    create: { scope: 'EXPENSE', name: 'Bahan makanan', slug: 'bahan-makanan' },
  })

  // --- Organizations (AksiPeduli) ---
  // 2 organisasi fiktif, hanya field publik yang diload
  const org1 = await prisma.organization.upsert({
    where: { slug: 'aksi-peduli-cilacap' },
    update: {
      name: 'Aksi Peduli Cilacap',
      verificationStatus: 'VERIFIED',
      publicArea: 'Cilacap, Jawa Tengah',
    },
    create: {
      id: 'org-aksipedi-001',
      ownerId: presenterAccounts[0].id,
      name: 'Aksi Peduli Cilacap',
      slug: 'aksi-peduli-cilacap',
      description: 'Komunitas amal untuk membantu keluarga terdampak banjir di Cilacap.',
      categoryId: campaignCat.id,
      contactEmail: 'kontak@aksipeduli-cilacap.test', // hanya untuk admin, tidak dipublikasikan
      publicArea: 'Cilacap, Jawa Tengah',
      website: 'https://aksipeduli-cilacap.example',
      logoUrl: 'https://res.cloudinary.com/aksiba/image/upload/v1/demo/aksipeduli',
      verificationStatus: 'VERIFIED',
    },
  })

  const org2 = await prisma.organization.upsert({
    where: { slug: 'yayasan-bersama-bangun' },
    update: {
      name: 'Yayasan Bersama Bangun',
      verificationStatus: 'PENDING',
      publicArea: 'Banyumas, Jawa Tengah',
    },
    create: {
      id: 'org-yayasan-002',
      ownerId: presenterAccounts[1].id,
      name: 'Yayasan Bersama Bangun',
      slug: 'yayasan-bersama-bangun',
      description: 'Yayasan amal umum — dipakai presentasi evaluasi bertahap.',
      categoryId: campaignCat.id,
      contactEmail: 'kontak@yayasan-bangun.test',
      publicArea: 'Banyumas, Jawa Tengah',
      verificationStatus: 'PENDING',
    },
  })

  // --- Verifikasi organisasi ---
  // Lalu-lintas: tidak ada tx_hash palsu; donasi uang tetap PENDING sampai presenter benar-benar mengirim testnet.
  await prisma.organizationVerification.upsert({
    where: { id: 'ver-org-001' },
    update: { status: 'VERIFIED', reviewedAt: now, reviewNote: 'Verifikasi lengkap' },
    create: {
      id: 'ver-org-001',
      organizationId: org1.id,
      submittedBy: presenterAccounts[0].id,
      documentStorageKey: 'demo/verifications/aksipeduli-cilacap.pdf',
      documentSha256: 'demo-sha256-aksipedi-cilacap',
      documentSalt: 'demo-salt-1',
      status: 'VERIFIED',
      reviewerId: presenterAccounts[0].id,
      reviewedAt: now,
    },
  })

  // --- Campaigns (AksiPeduli) ---
  // 2 kampanye: satu ACTIVE, satu DRAFT. Target amount realistic testnet.
  const camp1 = await prisma.campaign.upsert({
    where: { slug: '100-meals-cilacap' },
    update: {
      status: 'ACTIVE',
      targetAmountWei: '500000000000000000', // 0.5 ETH testnet
    },
    create: {
      id: 'camp-100meals',
      organizationId: org1.id,
      title: '100 Meals for Cilacap',
      slug: '100-meals-cilacap',
      story:
        'Dapur komunitas menyiapkan 100 porsi makanan bergizi per hari untuk keluarga terdampak banjir di Cilacap. Semua donasi pada MVP adalah aset testnet.',
      categoryId: campaignCat.id,
      periodStartsAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      periodEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      targetAmountWei: '500000000000000000',
      fundingAsset: 'NATIVE_ETH_TESTNET',
      generalLocation: 'Cilacap, Jawa Tengah',
      status: 'ACTIVE',
    },
  })

  const camp2 = await prisma.campaign.upsert({
    where: { slug: 'bantuan-darurat-banyumas' },
    update: {
      status: 'DRAFT',
      targetAmountWei: '100000000000000000', // 0.1 ETH testnet
    },
    create: {
      id: 'camp-darurat',
      organizationId: org2.id,
      title: 'Bantuan Darurat Banyumas',
      slug: 'bantuan-darurat-banyumas',
      description:
        'Kampanye dana untuk beli vitamin dan perlengkatan keluarga di Banyumas. Saat ini masih draft.',
      categoryId: campaignCat.id,
      periodStartsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      periodEndsAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      targetAmountWei: '100000000000000000',
      fundingAsset: 'NATIVE_ETH_TESTNET',
      generalLocation: 'Banyumas, Jawa Tengah',
      status: 'DRAFT',
    },
  })

  // --- Donations ---
  // Donor: presenter1, presenter2, dan anonim. Total < dana target.
  await prisma.donation.upsert({
    where: { donationIntentNonce: 'donor-pres1-001' },
    update: {},
    create: {
      campaignId: camp1.id,
      donorUserId: presenterAccounts[0].id,
      donorDisplayName: 'Andi Saputra',
      isAnonymous: false,
      amountWei: '10000000000000000', // 0.01 ETH
      chainId: 11155111,
      status: 'CONFIRMED',
      donationIntentNonce: 'donor-pres1-001',
      confirmedAt: now,
    },
  })

  await prisma.donation.upsert({
    where: { donationIntentNonce: 'donor-pres2-001' },
    update: {},
    create: {
      campaignId: camp1.id,
      donorUserId: presenterAccounts[1].id,
      donorDisplayName: 'Putri Malik',
      isAnonymous: false,
      amountWei: '20000000000000000', // 0.02 ETH
      chainId: 11155111,
      status: 'PENDING',
      donationIntentNonce: 'donor-pres2-001',
    },
  })

  await prisma.donation.upsert({
    where: { donationIntentNonce: 'donor-anon-001' },
    update: {},
    create: {
      campaignId: camp1.id,
      donorUserId: null, // donasi dari akun tak dikenal
      donorDisplayName: 'Donatur Anonim',
      isAnonymous: true,
      amountWei: '5000000000000000', // 0.005 ETH
      chainId: 11155111,
      status: 'INTENT',
      donationIntentNonce: 'donor-anon-001',
    },
  })

  // --- Goods Donations (barang) ---
  // 2 jenis barang, kondisi fiktif, qty realistis
  await prisma.goodsDonation.upsert({
    where: { id: 'gd-beras' },
    update: { status: 'RECEIVED', receivedQuantity: 200 },
    create: {
      id: 'gd-beras',
      campaignId: camp1.id,
      donorUserId: presenterAccounts[0].id,
      donorDisplayName: 'Andi Saputra',
      itemName: 'Beras',
      category: 'Bahan makanan',
      quantity: 200,
      unit: 'kg',
      condition: 'NEW',
      handoverMethod: 'DROP_OFF',
      status: 'RECEIVED',
      receivedQuantity: 200,
      receivedBy: presenterAccounts[0].id,
      receivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.goodsDonation.upsert({
    where: { id: 'gd-minyak' },
    update: { status: 'RECEIVED', receivedQuantity: 40 },
    create: {
      id: 'gd-minyak',
      campaignId: camp1.id,
      donorDisplayName: 'Donatur Anonim',
      itemName: 'Minyak goreng',
      category: 'Bahan makanan',
      quantity: 40,
      unit: 'liter',
      condition: 'LIKE_NEW',
      handoverMethod: 'COURIER',
      status: 'RECEIVED',
      receivedQuantity: 40,
      receivedBy: presenterAccounts[0].id,
      receivedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  // --- Inventory items ---
  const inventory = await prisma.inventoryItem.upsert({
    where: { id: 'inv-paket-001' },
    update: {
      quantityReceived: 300,
      quantityAllocated: 300,
      quantityDistributed: 200,
    },
    create: {
      id: 'inv-paket-001',
      campaignId: camp1.id,
      name: 'Paket makanan siap distribusi',
      category: 'Bahan makanan',
      unit: 'paket',
      quantityReceived: 300,
      quantityAllocated: 300,
      quantityDistributed: 200,
    },
  })

  // --- Expenses ---
  // Expense PROPOSED total < dana terkumpil (0.03 ETH total donasi < 0.5 ETH target)
  await prisma.expense.upsert({
    where: { id: 'exp-food' },
    update: { status: 'PROPOSED' },
    create: {
      id: 'exp-food',
      campaignId: camp1.id,
      category: 'Bahan makanan',
      amountWei: '20000000000000000', // 0.02 ETH testnet
      description: 'Pembelian bahan makanan untuk dapur komunitas',
      payeeName: 'Toko Sembako Bu Yati (fiktif)',
      createdBy: presenterAccounts[0].id,
      status: 'PROPOSED',
    },
  })

  // --- Distribution Batches ---
  const batch = await prisma.distributionBatch.upsert({
    where: { id: 'batch-1' },
    update: {
      status: 'PARTIALLY_DELIVERED',
      verifiedBy: presenterAccounts[0].id,
    },
    create: {
      id: 'batch-1',
      campaignId: camp1.id,
      title: 'Batch 1 — Distribusi paket makanan',
      aidType: 'GOODS',
      generalLocation: 'Kelurahan A, Cilacap',
      plannedDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      deliveredAt: now,
      personInChargeId: presenterAccounts[0].id,
      status: 'PARTIALLY_DELIVERED',
      notes: 'Dua keluarga belum ditemui; sisa paket dijadwalkan ulang.',
      verifiedBy: presenterAccounts[0].id,
      verifiedAt: now,
    },
  })

  // Distribution items
  await prisma.distributionItem.upsert({
    where: { id: 'di-batch1-001' },
    update: {
      quantityPlanned: 300,
      quantityDispatched: 300,
      quantityReceived: 200,
    },
    create: {
      id: 'di-batch1-001',
      batchId: batch.id,
      inventoryItemId: inventory.id,
      description: 'Paket makanan siap distribusi',
      unit: 'paket',
      quantityPlanned: 300,
      quantityDispatched: 300,
      quantityReceived: 200,
    },
  })

  // --- Platform settings ---
  await prisma.platformSetting.upsert({
    where: { key: 'required_confirmations' },
    update: { value: 2 },
    create: { key: 'required_confirmations', value: 2, updatedBy: presenterAccounts[0].id },
  })

  await prisma.platformSetting.upsert({
    where: { key: 'max_upload_bytes' },
    update: { value: 5 * 1024 * 1024 },
    create: {
      key: 'max_upload_bytes',
      value: 5 * 1024 * 1024,
      updatedBy: presenterAccounts[0].id,
    },
  })

  // Summary
  const users = await prisma.user.count()
  const orgs = await prisma.organization.count()
  const camps = await prisma.campaign.count()
  const donations = await prisma.donation.count()
  const goods = await prisma.goodsDonation.count()
  const expenses = await prisma.expense.count()
  const batches = await prisma.distributionBatch.count()

  console.log(
    `[aksi-peduli seed] Selesai: users=${users}, orgs=${orgs}, camps=${camps}, ` +
      `donations=${donations}, goods=${goods}, expenses=${expenses}, batches=${batches}`
  )
}

main()
  .catch((error) => {
    console.error('[aksi-peduli seed] Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })