import { hashPassword } from '../lib/auth/password'
import {
  AidType,
  CategoryScope,
  DistributionStatus,
  GoodsCondition,
  GoodsDonationStatus,
  HandoverMethod,
  PrismaClient,
  RegistrationStatus,
  VerificationStatus,
  WalletLinkStatus
} from '@prisma/client'

// Seed sesuai docs/DATABASE.md §10 dan docs/DEMO_SCRIPT.md §4.
// Semua entitas fiktif; idempoten lewat upsert pada kunci alami (email/slug) atau id tetap.
// Catatan: tidak ada tx_hash palsu — donasi uang dibiarkan PENDING sampai presenter
// benar-benar mengirim transaksi testnet (AGENTS.md guardrail 4).

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'Demo#2026'
const CHAIN_ID = 11155111 // Sepolia

const DAY = 24 * 60 * 60 * 1000
const now = new Date()
const daysFromNow = (days: number, hourUtc = 0) => {
  const d = new Date(now.getTime() + days * DAY)
  d.setUTCHours(hourUtc, 0, 0, 0)
  return d
}

// ID tetap untuk baris yang tidak punya kunci unik alami, supaya re-run tidak menggandakan.
const ids = {
  orgVerified: 'a1000000-0000-4000-8000-000000000001',
  orgNew: 'a1000000-0000-4000-8000-000000000002',
  verificationVerified: 'a2000000-0000-4000-8000-000000000001',
  verificationPending: 'a2000000-0000-4000-8000-000000000002',
  event: 'a3000000-0000-4000-8000-000000000001',
  eventDraft: 'a3000000-0000-4000-8000-000000000002',
  attendanceSessionClosed: 'a3100000-0000-4000-8000-000000000001',
  taskKebersihan: 'a4000000-0000-4000-8000-000000000001',
  taskLogistik: 'a4000000-0000-4000-8000-000000000002',
  taskDokumentasi: 'a4000000-0000-4000-8000-000000000003',
  campaign: 'a5000000-0000-4000-8000-000000000001',
  goodsBeras: 'a6000000-0000-4000-8000-000000000001',
  goodsMinyak: 'a6000000-0000-4000-8000-000000000002',
  inventoryPack: 'a7000000-0000-4000-8000-000000000001',
  expenseFood: 'a8000000-0000-4000-8000-000000000001',
  batchOne: 'a9000000-0000-4000-8000-000000000001',
  batchItemOne: 'aa000000-0000-4000-8000-000000000001'
} as const

const extraVolunteers = [
  { name: 'Bagas Prakoso', email: 'bagas@aksibareng.test' },
  { name: 'Citra Lestari', email: 'citra@aksibareng.test' },
  { name: 'Dewa Mahendra', email: 'dewa@aksibareng.test' },
  { name: 'Eka Nuraini', email: 'eka@aksibareng.test' },
  { name: 'Fajar Ramadhan', email: 'fajar@aksibareng.test' },
  { name: 'Gita Puspita', email: 'gita@aksibareng.test' },
  { name: 'Hendra Wijaya', email: 'hendra@aksibareng.test' },
  { name: 'Intan Maharani', email: 'intan@aksibareng.test' },
  { name: 'Joko Susilo', email: 'joko@aksibareng.test' },
  { name: 'Kartika Sari', email: 'kartika@aksibareng.test' },
  { name: 'Lukman Hakim', email: 'lukman@aksibareng.test' }
]

async function main() {
  // Satu sumber parameter Argon2id dengan aplikasi (docs/PRIVACY_SECURITY.md §4).
  const demoPasswordHash = await hashPassword(DEMO_PASSWORD)

  // ── Users (4 akun demo + 11 relawan tambahan agar kuota 12/20 terlihat nyata) ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aksibareng.test' },
    update: { displayName: 'Sari Admin', role: 'ADMIN', passwordHash: demoPasswordHash },
    create: {
      email: 'admin@aksibareng.test',
      passwordHash: demoPasswordHash,
      displayName: 'Sari Admin',
      role: 'ADMIN'
    }
  })

  const organizer = await prisma.user.upsert({
    where: { email: 'komunitas@aksibareng.test' },
    update: { displayName: 'Dimas Organizer', role: 'ORGANIZER', passwordHash: demoPasswordHash },
    create: {
      email: 'komunitas@aksibareng.test',
      passwordHash: demoPasswordHash,
      displayName: 'Dimas Organizer',
      role: 'ORGANIZER'
    }
  })

  const newOrganizer = await prisma.user.upsert({
    where: { email: 'baru@aksibareng.test' },
    update: { displayName: 'Nadia Organizer Baru', role: 'ORGANIZER', passwordHash: demoPasswordHash },
    create: {
      email: 'baru@aksibareng.test',
      passwordHash: demoPasswordHash,
      displayName: 'Nadia Organizer Baru',
      role: 'ORGANIZER'
    }
  })

  const rani = await prisma.user.upsert({
    where: { email: 'relawan@aksibareng.test' },
    update: { displayName: 'Rani', passwordHash: demoPasswordHash },
    create: {
      email: 'relawan@aksibareng.test',
      passwordHash: demoPasswordHash,
      displayName: 'Rani'
    }
  })

  const volunteers = [rani]
  for (const person of extraVolunteers) {
    // Akun pengisi kuota: kata sandi acak agar tidak ada yang bisa login tanpa sepengetahuan presenter.
    const unusableHash = await hashPassword(crypto.randomUUID())
    volunteers.push(
      await prisma.user.upsert({
        where: { email: person.email },
        update: { displayName: person.name },
        create: { email: person.email, passwordHash: unusableHash, displayName: person.name }
      })
    )
  }

  // ── Wallet testnet (alamat fiktif, bukan milik siapa pun) ──
  await prisma.walletLink.upsert({
    where: { address_chainId: { address: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d', chainId: CHAIN_ID } },
    update: { userId: rani.id, status: WalletLinkStatus.VERIFIED },
    create: {
      userId: rani.id,
      address: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
      chainId: CHAIN_ID,
      status: WalletLinkStatus.VERIFIED,
      nonce: 'seed-wallet-rani',
      verifiedAt: now
    }
  })

  // ── Kategori ──
  const orgCategory = await prisma.category.upsert({
    where: { scope_slug: { scope: CategoryScope.EVENT, slug: 'lingkungan' } },
    update: { name: 'Lingkungan' },
    create: { scope: CategoryScope.EVENT, name: 'Lingkungan', slug: 'lingkungan' }
  })
  await prisma.category.upsert({
    where: { scope_slug: { scope: CategoryScope.CAMPAIGN, slug: 'pangan' } },
    update: { name: 'Pangan' },
    create: { scope: CategoryScope.CAMPAIGN, name: 'Pangan', slug: 'pangan' }
  })
  await prisma.category.upsert({
    where: { scope_slug: { scope: CategoryScope.EXPENSE, slug: 'bahan-makanan' } },
    update: { name: 'Bahan makanan' },
    create: { scope: CategoryScope.EXPENSE, name: 'Bahan makanan', slug: 'bahan-makanan' }
  })

  // ── Organisasi ──
  const orgVerified = await prisma.organization.upsert({
    where: { slug: 'komunitas-bersih-pantai' },
    update: { verificationStatus: VerificationStatus.VERIFIED },
    create: {
      id: ids.orgVerified,
      ownerId: organizer.id,
      name: 'Komunitas Bersih Pantai',
      slug: 'komunitas-bersih-pantai',
      description: 'Komunitas relawan kebersihan pesisir di Jawa Tengah.',
      categoryId: orgCategory.id,
      contactEmail: 'halo@komunitasbersihpantai.test',
      publicArea: 'Cilacap, Jawa Tengah',
      verificationStatus: VerificationStatus.VERIFIED
    }
  })

  const orgNew = await prisma.organization.upsert({
    where: { slug: 'yayasan-peduli-baru' },
    update: { verificationStatus: VerificationStatus.PENDING },
    create: {
      id: ids.orgNew,
      ownerId: newOrganizer.id,
      name: 'Yayasan Peduli Baru',
      slug: 'yayasan-peduli-baru',
      description: 'Yayasan baru — dipakai untuk memperlihatkan gating verifikasi.',
      categoryId: orgCategory.id,
      contactEmail: 'kontak@yayasanpedulibaru.test',
      publicArea: 'Banyumas, Jawa Tengah',
      verificationStatus: VerificationStatus.PENDING
    }
  })

  // Rekaman verifikasi: lama tidak ditimpa, pengajuan ulang membuat baris baru.
  await prisma.organizationVerification.upsert({
    where: { id: ids.verificationVerified },
    update: { status: VerificationStatus.VERIFIED },
    create: {
      id: ids.verificationVerified,
      organizationId: orgVerified.id,
      submittedBy: organizer.id,
      documentStorageKey: 'demo/verifications/komunitas-bersih-pantai.pdf',
      documentSha256: 'demo-sha256-komunitas-bersih-pantai',
      documentSalt: 'demo-salt-1',
      status: VerificationStatus.VERIFIED,
      reviewerId: admin.id,
      reviewNote: 'Dokumen komunitas lengkap.',
      reviewedAt: daysFromNow(-20)
    }
  })

  await prisma.organizationVerification.upsert({
    where: { id: ids.verificationPending },
    update: { status: VerificationStatus.PENDING },
    create: {
      id: ids.verificationPending,
      organizationId: orgNew.id,
      submittedBy: newOrganizer.id,
      documentStorageKey: 'demo/verifications/yayasan-peduli-baru.pdf',
      documentSha256: 'demo-sha256-yayasan-peduli-baru',
      documentSalt: 'demo-salt-2',
      status: VerificationStatus.PENDING
    }
  })

  // ── Kegiatan: Beach Cleanup Day, 20 kuota, 12 terdaftar (DEMO_SCRIPT §4) ──
  const event = await prisma.event.upsert({
    where: { slug: 'beach-cleanup-day' },
    update: { quota: 20, status: 'PUBLISHED' },
    create: {
      id: ids.event,
      organizationId: orgVerified.id,
      title: 'Beach Cleanup Day',
      slug: 'beach-cleanup-day',
      description: 'Aksi bersih-bersih pantai bersama warga dan sekolah sekitar.',
      categoryId: orgCategory.id,
      locationName: 'Pantai Teluk Penyu',
      publicAddress: 'Area pantai Teluk Penyu, Cilacap',
      city: 'Cilacap',
      startsAt: daysFromNow(14, 0),
      endsAt: daysFromNow(14, 4),
      quota: 20,
      registrationOpensAt: daysFromNow(-7),
      registrationClosesAt: daysFromNow(12),
      cancellationDeadline: daysFromNow(13),
      status: 'PUBLISHED',
      createdBy: organizer.id
    }
  })

  const tasks = [
    {
      id: ids.taskKebersihan,
      name: 'Kebersihan',
      description: 'Mengumpulkan dan memilah sampah di area pantai.',
      quota: 8
    },
    {
      id: ids.taskLogistik,
      name: 'Logistik',
      description: 'Menyiapkan perlengkapan, air minum, dan konsumsi relawan.',
      quota: 6
    },
    {
      id: ids.taskDokumentasi,
      name: 'Dokumentasi',
      description: 'Mendokumentasikan kegiatan tanpa memotret wajah tanpa izin.',
      quota: 4
    }
  ]

  for (const [index, task] of tasks.entries()) {
    await prisma.eventTask.upsert({
      where: { id: task.id },
      update: { name: task.name, description: task.description, quota: task.quota, sortOrder: index },
      create: { ...task, eventId: event.id, sortOrder: index }
    })
  }

  const registrations: { id: string }[] = []
  for (const [index, volunteer] of volunteers.entries()) {
    registrations.push(
      await prisma.eventRegistration.upsert({
        where: { eventId_userId: { eventId: event.id, userId: volunteer.id } },
        update: { status: RegistrationStatus.REGISTERED },
        create: {
          eventId: event.id,
          userId: volunteer.id,
          status: RegistrationStatus.REGISTERED,
          registeredAt: daysFromNow(-5 + index * 0.1)
        }
      })
    )
  }

  // Penempatan sebagian relawan (kuota tugas: 8/6/4); sisanya belum ditempatkan.
  const placements = [
    { taskId: ids.taskKebersihan, registration: registrations[0], notes: 'Koordinator area timur' },
    { taskId: ids.taskKebersihan, registration: registrations[1] },
    { taskId: ids.taskLogistik, registration: registrations[2] },
    { taskId: ids.taskDokumentasi, registration: registrations[3] }
  ]
  for (const placement of placements) {
    await prisma.taskAssignment.upsert({
      where: { registrationId: placement.registration.id },
      update: { taskId: placement.taskId, notes: placement.notes ?? null },
      create: {
        taskId: placement.taskId,
        registrationId: placement.registration.id,
        assignedBy: organizer.id,
        notes: placement.notes ?? null
      }
    })
  }

  // Kegiatan DRAFT (K-07: draf tidak tampil publik) dan sesi check-in tertutup
  // tanpa catatan kehadiran — contoh struktur data, bukan rekap kegiatan.
  await prisma.event.upsert({
    where: { slug: 'posko-persiapan-banjir' },
    update: { status: 'DRAFT', quota: 30 },
    create: {
      id: ids.eventDraft,
      organizationId: orgVerified.id,
      title: 'Posko Persiapan Banjir',
      slug: 'posko-persiapan-banjir',
      description: 'Persiapan dapur umum dan logistik untuk antisipasi banjir tahunan.',
      categoryId: orgCategory.id,
      locationName: 'Balai Komunitas Teluk Penyu',
      publicAddress: 'Area Balai Komunitas Teluk Penyu, Cilacap',
      city: 'Cilacap',
      startsAt: daysFromNow(21, 1),
      endsAt: daysFromNow(21, 5),
      quota: 30,
      registrationOpensAt: daysFromNow(7),
      registrationClosesAt: daysFromNow(19),
      cancellationDeadline: daysFromNow(20),
      status: 'DRAFT',
      createdBy: organizer.id
    }
  })

  await prisma.attendanceSession.upsert({
    where: { id: ids.attendanceSessionClosed },
    update: { status: 'CLOSED' },
    create: {
      id: ids.attendanceSessionClosed,
      eventId: event.id,
      openedBy: organizer.id,
      opensAt: daysFromNow(-3, 7),
      closesAt: daysFromNow(-3, 9),
      status: 'CLOSED'
    }
  })

  // ── Kampanye: 100 Meals for Cilacap, target 0,5 ETH testnet, 3 kategori anggaran ──
  const campaign = await prisma.campaign.upsert({
    where: { slug: '100-meals-for-cilacap' },
    update: { status: 'ACTIVE', reviewedBy: admin.id },
    create: {
      id: ids.campaign,
      organizationId: orgVerified.id,
      title: '100 Meals for Cilacap',
      slug: '100-meals-for-cilacap',
      story:
        'Dapur komunitas menyiapkan 100 porsi makanan bergizi per hari untuk keluarga terdampak banjir di Cilacap. Semua donasi pada MVP adalah aset testnet.',
      categoryId: (await prisma.category.findUniqueOrThrow({
        where: { scope_slug: { scope: CategoryScope.CAMPAIGN, slug: 'pangan' } }
      })).id,
      periodStartsAt: daysFromNow(-5),
      periodEndsAt: daysFromNow(30),
      targetAmountWei: '500000000000000000', // 0,5 ETH testnet
      fundingAsset: 'NATIVE_ETH_TESTNET',
      generalLocation: 'Cilacap, Jawa Tengah',
      status: 'ACTIVE',
      reviewedBy: admin.id,
      reviewedAt: daysFromNow(-4),
      reviewNote: 'Anggaran masuk akal dan penerima tidak diidentifikasi.'
    }
  })

  const budgets = [
    { version: 1, category: 'Bahan makanan', plannedAmountWei: '300000000000000000' },
    { version: 2, category: 'Logistik distribusi', plannedAmountWei: '100000000000000000' },
    { version: 3, category: 'Operasional dapur', plannedAmountWei: '100000000000000000' }
  ]
  for (const budget of budgets) {
    await prisma.campaignBudget.upsert({
      where: { campaignId_version: { campaignId: campaign.id, version: budget.version } },
      update: { category: budget.category, plannedAmountWei: budget.plannedAmountWei },
      create: {
        campaignId: campaign.id,
        version: budget.version,
        category: budget.category,
        plannedAmountWei: budget.plannedAmountWei,
        createdBy: organizer.id
      }
    })
  }

  // Donasi pemanasan tanpa tx_hash: tetap PENDING sampai transaksi testnet benar-benar dikirim.
  await prisma.donation.upsert({
    where: { donationIntentNonce: 'seed-donation-nonce-1' },
    update: {},
    create: {
      campaignId: campaign.id,
      donorUserId: rani.id,
      donorDisplayName: 'Rani',
      isAnonymous: false,
      amountWei: '10000000000000000', // 0,01 ETH testnet
      chainId: CHAIN_ID,
      status: 'PENDING',
      donationIntentNonce: 'seed-donation-nonce-1'
    }
  })

  // ── Donasi barang + inventaris + distribusi ──
  await prisma.goodsDonation.upsert({
    where: { id: ids.goodsBeras },
    update: { status: GoodsDonationStatus.RECEIVED },
    create: {
      id: ids.goodsBeras,
      campaignId: campaign.id,
      donorUserId: rani.id,
      donorDisplayName: 'Rani',
      itemName: 'Beras',
      category: 'Bahan makanan',
      quantity: 200,
      unit: 'kg',
      condition: GoodsCondition.NEW,
      handoverMethod: HandoverMethod.DROP_OFF,
      status: GoodsDonationStatus.RECEIVED,
      receivedQuantity: 200,
      receivedBy: organizer.id,
      receivedAt: daysFromNow(-3)
    }
  })

  await prisma.goodsDonation.upsert({
    where: { id: ids.goodsMinyak },
    update: { status: GoodsDonationStatus.RECEIVED },
    create: {
      id: ids.goodsMinyak,
      campaignId: campaign.id,
      donorDisplayName: 'Donatur anonim',
      itemName: 'Minyak goreng',
      category: 'Bahan makanan',
      quantity: 40,
      unit: 'liter',
      condition: GoodsCondition.NEW,
      handoverMethod: HandoverMethod.COURIER,
      status: GoodsDonationStatus.RECEIVED,
      receivedQuantity: 40,
      receivedBy: organizer.id,
      receivedAt: daysFromNow(-2)
    }
  })

  const inventory = await prisma.inventoryItem.upsert({
    where: { id: ids.inventoryPack },
    update: { quantityReceived: 300, quantityAllocated: 300, quantityDistributed: 200 },
    create: {
      id: ids.inventoryPack,
      campaignId: campaign.id,
      name: 'Paket makanan siap distribusi',
      category: 'Bahan makanan',
      unit: 'paket',
      quantityReceived: 300,
      quantityAllocated: 300,
      quantityDistributed: 200
    }
  })

  // ── Pengeluaran (belum disetujui: dana terkumpul belum terkonfirmasi) ──
  await prisma.expense.upsert({
    where: { id: ids.expenseFood },
    update: { status: 'PROPOSED' },
    create: {
      id: ids.expenseFood,
      campaignId: campaign.id,
      category: 'Bahan makanan',
      amountWei: '20000000000000000', // 0,02 ETH testnet
      description: 'Pembelian bahan makanan untuk dapur komunitas',
      payeeName: 'Toko Sembako Bu Yati (fiktif)',
      createdBy: organizer.id,
      status: 'PROPOSED'
    }
  })

  // ── Batch distribusi: 300 disiapkan, 200 diterima → PARTIALLY_DELIVERED ──
  const batch = await prisma.distributionBatch.upsert({
    where: { id: ids.batchOne },
    update: { status: DistributionStatus.PARTIALLY_DELIVERED, verifiedBy: admin.id },
    create: {
      id: ids.batchOne,
      campaignId: campaign.id,
      title: 'Batch 1 — Distribusi paket makanan',
      aidType: AidType.GOODS,
      generalLocation: 'Kelurahan A, Cilacap',
      plannedDate: daysFromNow(-1),
      dispatchedAt: daysFromNow(-1),
      deliveredAt: now,
      personInChargeId: organizer.id,
      status: DistributionStatus.PARTIALLY_DELIVERED,
      notes: 'Dua keluarga belum ditemui; sisa paket dijadwalkan ulang.',
      verifiedBy: admin.id,
      verifiedAt: now
    }
  })

  await prisma.distributionItem.upsert({
    where: { id: ids.batchItemOne },
    update: { quantityPlanned: 300, quantityDispatched: 300, quantityReceived: 200 },
    create: {
      id: ids.batchItemOne,
      batchId: batch.id,
      inventoryItemId: inventory.id,
      description: 'Paket makanan siap distribusi',
      unit: 'paket',
      quantityPlanned: 300,
      quantityDispatched: 300,
      quantityReceived: 200
    }
  })

  // ── Pengaturan platform ──
  await prisma.platformSetting.upsert({
    where: { key: 'required_confirmations' },
    update: { value: 2 },
    create: { key: 'required_confirmations', value: 2, updatedBy: admin.id }
  })
  await prisma.platformSetting.upsert({
    where: { key: 'max_upload_bytes' },
    update: { value: 5 * 1024 * 1024 },
    create: { key: 'max_upload_bytes', value: 5 * 1024 * 1024, updatedBy: admin.id }
  })

  const tally = {
    users: await prisma.user.count(),
    organizations: await prisma.organization.count(),
    events: await prisma.event.count(),
    registrations: await prisma.eventRegistration.count(),
    campaignBudgets: await prisma.campaignBudget.count()
  }
  process.stdout.write(`Seed selesai: ${JSON.stringify(tally)}\n`)
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
