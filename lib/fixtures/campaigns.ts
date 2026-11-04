/**
 * Data demo untuk halaman publik kampanye (C2).
 *
 * SEMENTARA: sumber data akan diganti `GET /api/v1/campaigns` dan
 * `GET /api/v1/public/campaigns/{slug}/transparency` (lihat docs/API.md §5, §7).
 * Semua nilai fiktif, tanpa data pribadi, dan tidak ada transaksi nyata.
 * Nominal disimpan sebagai string wei — jangan diubah ke number (AGENTS.md).
 */

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

/** `source` mengikuti PRD §7.10: pisahkan blockchain, catatan DB, pernyataan organizer. */
export type DataSource = 'BLOCKCHAIN' | 'DATABASE' | 'ORGANIZER_STATEMENT'

export type ActivityEntry = {
  at: string
  title: string
  detail: string
  source: DataSource
  txHash?: string
  explorerUrl?: string
}

export type ExpenseStatus = 'PROPOSED' | 'APPROVED' | 'PAID'

export type ExpenseRecord = {
  category: string
  description: string
  amountWei: string
  status: ExpenseStatus
  recordedAt: string
}

export type BudgetItem = {
  category: string
  description: string
  plannedWei: string
}

export type BudgetVersion = {
  version: number
  createdAt: string
  supersededAt: string | null
  items: BudgetItem[]
}

export type CampaignFixture = {
  slug: string
  title: string
  summary: string
  story: string[]
  category: string
  organization: { name: string }
  generalLocation: string
  periodStartsAt: string
  periodEndsAt: string
  status: CampaignStatus
  fundingAsset: 'NATIVE_ETH_TESTNET'
  targetWei: string
  onChainCampaignId: number
  /** Hanya donasi `CONFIRMED` (DON-05). */
  raisedWei: string
  /** Hanya pengeluaran `APPROVED` + `PAID` (EXP-05). */
  usedWei: string
  /** Pengeluaran operasional; `PROPOSED` belum mengurangi dana yang digunakan. */
  expenses: ExpenseRecord[]
  budgets: BudgetVersion[]
  distributions: {
    batches: number
    verified: number
    itemsPrepared: number
    itemsDelivered: number
    unitLabel: string
  }
  updates: { at: string; title: string; body: string }[]
  activity: ActivityEntry[]
}

const explorerTx = (txHash: string) => `https://sepolia.etherscan.io/tx/${txHash}`

export const campaigns: CampaignFixture[] = [
  {
    slug: 'dapur-umum-cilacap',
    title: 'Dapur Umum untuk Warga Cilacap',
    summary:
      'Dapur umum harian untuk 150 warga terdampak banjir di Cilacap selama dua minggu. Dana dipakai untuk bahan makanan, bahan bakar, dan logistik dapur.',
    story: [
      'Banjir pada awal November membuat tiga kelurahan di Cilacap terisolasi selama beberapa hari. Warga mengungsi ke balai desa dan membutuhkan makanan siap saji setiap hari.',
      'Kami memasak di dapur umum yang sudah beroperasi sejak 2019 dan bekerja sama dengan karang taruna setempat. Setiap hari kami menyiapkan 150 porsi makan siang dan malam.',
      'Rencana penggunaan dana ditulis per kategori agar bisa diperiksa. Setiap pembelian menimbulkan catatan pengeluaran dan bukti yang hash-nya dicatat, bukan fotonya.',
      'Lokasi yang ditampilkan hanya tingkat kota. Data penerima bantuan tidak pernah ditampilkan atau dicatat di blockchain.'
    ],
    category: 'Bencana alam',
    organization: { name: 'Yayasan Peduli Pesisir' },
    generalLocation: 'Cilacap, Jawa Tengah',
    periodStartsAt: '2026-11-05T00:00:00.000Z',
    periodEndsAt: '2026-11-26T00:00:00.000Z',
    status: 'ACTIVE',
    fundingAsset: 'NATIVE_ETH_TESTNET',
    targetWei: '5000000000000000000',
    onChainCampaignId: 7,
    raisedWei: '2400000000000000000',
    usedWei: '900000000000000000',
    expenses: [
      {
        category: 'Bahan makanan',
        description: 'Pembelian bahan makanan minggu pertama.',
        amountWei: '600000000000000000',
        status: 'PAID',
        recordedAt: '2026-11-10T08:45:00.000Z'
      },
      {
        category: 'Logistik dapur',
        description: 'Gas dan air bersih untuk dapur umum.',
        amountWei: '200000000000000000',
        status: 'PAID',
        recordedAt: '2026-11-11T02:10:00.000Z'
      },
      {
        category: 'Transportasi',
        description: 'Distribusi porsi ke tiga titik pengungsian, menunggu pembayaran.',
        amountWei: '100000000000000000',
        status: 'APPROVED',
        recordedAt: '2026-11-12T01:00:00.000Z'
      }
    ],
    budgets: [
      {
        version: 2,
        createdAt: '2026-11-06T03:10:00.000Z',
        supersededAt: null,
        items: [
          {
            category: 'Bahan makanan',
            description: 'Beras, sayur, protein, dan bumbu untuk 150 porsi per hari.',
            plannedWei: '2400000000000000000'
          },
          {
            category: 'Logistik dapur',
            description: 'Gas, air bersih, dan peralatan masak sekali pakai.',
            plannedWei: '400000000000000000'
          },
          {
            category: 'Transportasi',
            description: 'Distribusi porsi ke tiga titik pengungsian.',
            plannedWei: '200000000000000000'
          }
        ]
      },
      {
        version: 1,
        createdAt: '2026-11-04T09:00:00.000Z',
        supersededAt: '2026-11-06T03:10:00.000Z',
        items: [
          {
            category: 'Bahan makanan',
            description: 'Perkiraan awal sebelum jumlah pengungsi bertambah.',
            plannedWei: '1800000000000000000'
          }
        ]
      }
    ],
    distributions: {
      batches: 3,
      verified: 2,
      itemsPrepared: 600,
      itemsDelivered: 420,
      unitLabel: 'paket makanan'
    },
    updates: [
      {
        at: '2026-11-12T10:00:00.000Z',
        title: 'Pengungsi bertambah, porsi dinaikkan',
        body: 'Jumlah pengungsi naik dari 110 menjadi 150 orang. Kami menaikkan porsi harian dan menambah anggaran bahan makanan pada versi anggaran ke-2.'
      },
      {
        at: '2026-11-08T11:30:00.000Z',
        title: 'Distribusi perdana selesai',
        body: 'Batch pertama berisi 200 paket makanan sudah diterima di dua titik pengungsian. Bukti distribusi menunggu privacy review sebelum tampil publik.'
      }
    ],
    activity: [
      {
        at: '2026-11-12T04:20:00.000Z',
        title: 'Donasi terkonfirmasi',
        detail: 'Donasi 0,5 ETH testnet tercatat dari transaksi yang berhasil diverifikasi.',
        source: 'BLOCKCHAIN',
        txHash: '0x5436fcde8f8f82eeca5b7e301150e5c450d80ab23272821a305e731a7c9a0ee3',
        explorerUrl: explorerTx('0x5436fcde8f8f82eeca5b7e301150e5c450d80ab23272821a305e731a7c9a0ee3')
      },
      {
        at: '2026-11-10T08:45:00.000Z',
        title: 'Pengeluaran dicatat',
        detail: 'Pembelian bahan makanan minggu pertama, 0,6 ETH testnet, status sudah dibayar (dicatat).',
        source: 'DATABASE',
        txHash: '0xc06655f7c9ac5a6fb8b26af8dedb1d0ef44e678591319ef17989dda0f45194e3',
        explorerUrl: explorerTx('0xc06655f7c9ac5a6fb8b26af8dedb1d0ef44e678591319ef17989dda0f45194e3')
      },
      {
        at: '2026-11-09T02:15:00.000Z',
        title: 'Batch distribusi diperbarui',
        detail: 'Batch kedua berubah menjadi sebagian diterima (420 dari 600 paket).',
        source: 'DATABASE'
      },
      {
        at: '2026-11-07T07:00:00.000Z',
        title: 'Pernyataan organizer',
        detail: 'Organizer menyatakan seluruh pembelian dilakukan lewat toko lokal dengan nota tersimpan.',
        source: 'ORGANIZER_STATEMENT'
      }
    ]
  },
  {
    slug: 'seragam-sekolah-anak-pelosok',
    title: 'Seragam Sekolah untuk Anak Pelosok',
    summary:
      'Pengadaan seragam dan perlengkapan sekolah untuk 120 siswa di tiga sekolah dasar. Kampanye sudah ditutup; seluruh dana sudah dibelanjakan dan dilaporkan.',
    story: [
      'Banyak keluarga di kecamatan ini tidak sanggup membeli seragam baru setiap tahun ajaran. Anak-anak sering datang dengan pakaian yang sudah tidak layak.',
      'Kami mengumpulkan data kebutuhan dari kepala sekolah, lalu memesan seragam ke penjahit lokal agar biayanya berputar di desa.',
      'Kampanye ditutup setelah periode selesai. Laporan akhir mencantumkan jumlah dana diterima, digunakan, dan distribusi yang sudah diverifikasi.'
    ],
    category: 'Pendidikan',
    organization: { name: 'Komunitas Sekolah Desa' },
    generalLocation: 'Kupang, Nusa Tenggara Timur',
    periodStartsAt: '2026-08-01T00:00:00.000Z',
    periodEndsAt: '2026-10-15T00:00:00.000Z',
    status: 'CLOSED',
    fundingAsset: 'NATIVE_ETH_TESTNET',
    targetWei: '3000000000000000000',
    onChainCampaignId: 4,
    raisedWei: '3050000000000000000',
    usedWei: '2900000000000000000',
    expenses: [
      {
        category: 'Seragam',
        description: 'Pembayaran penjahit lokal untuk 120 setel seragam.',
        amountWei: '2700000000000000000',
        status: 'PAID',
        recordedAt: '2026-09-30T06:30:00.000Z'
      },
      {
        category: 'Distribusi',
        description: 'Pengiriman ke tiga sekolah dasar.',
        amountWei: '200000000000000000',
        status: 'PAID',
        recordedAt: '2026-10-05T04:00:00.000Z'
      }
    ],
    budgets: [
      {
        version: 2,
        createdAt: '2026-08-20T04:00:00.000Z',
        supersededAt: null,
        items: [
          {
            category: 'Seragam',
            description: '120 setel seragam dijahit oleh penjahit lokal.',
            plannedWei: '2700000000000000000'
          },
          {
            category: 'Distribusi',
            description: 'Pengiriman ke tiga sekolah dasar.',
            plannedWei: '200000000000000000'
          }
        ]
      },
      {
        version: 1,
        createdAt: '2026-08-02T04:00:00.000Z',
        supersededAt: '2026-08-20T04:00:00.000Z',
        items: [
          {
            category: 'Seragam',
            description: 'Perkiraan awal untuk 100 siswa.',
            plannedWei: '2400000000000000000'
          }
        ]
      }
    ],
    distributions: {
      batches: 3,
      verified: 3,
      itemsPrepared: 300,
      itemsDelivered: 300,
      unitLabel: 'setel seragam'
    },
    updates: [
      {
        at: '2026-10-16T03:00:00.000Z',
        title: 'Kampanye ditutup',
        body: 'Seluruh distribusi sudah terverifikasi. Laporan akhir menunggu unggahan dokumen rekap.'
      }
    ],
    activity: [
      {
        at: '2026-10-15T09:00:00.000Z',
        title: 'Distribusi terverifikasi',
        detail: 'Batch ketiga diverifikasi koordinator. Hash bukti dicatat ke blockchain setelah konfirmasi.',
        source: 'BLOCKCHAIN',
        txHash: '0x831dd8640bf821ffeecde99d8c2df08c98c646af074e715fa3a2389246b2fca0',
        explorerUrl: explorerTx('0x831dd8640bf821ffeecde99d8c2df08c98c646af074e715fa3a2389246b2fca0')
      },
      {
        at: '2026-09-30T06:30:00.000Z',
        title: 'Pengeluaran dicatat',
        detail: 'Pembayaran penjahit lokal, 2,7 ETH testnet, sudah dibayar (dicatat).',
        source: 'DATABASE'
      }
    ]
  },
  {
    slug: 'air-bersih-desa-nusa',
    title: 'Air Bersih untuk Desa Nusa',
    summary:
      'Pembangunan sumur bor dan penyaringan air untuk 80 keluarga. Kampanye selesai; laporan dana dan distribusi sudah lengkap.',
    story: [
      'Sumur desa mengering pada musim kemarau, sehingga warga harus membeli air dari truk tangki setiap minggu.',
      'Dana dipakai untuk pengeboran, pompa, dan pelatihan perawatan agar fasilitas tetap berjalan setelah proyek selesai.',
      'Seluruh bukti pengeluaran disimpan privat. Yang tampil publik hanya hash bukti dan ringkasan penggunaan dana.'
    ],
    category: 'Air & sanitasi',
    organization: { name: 'Yayasan Air untuk Semua' },
    generalLocation: 'Sumba Tengah, Nusa Tenggara Timur',
    periodStartsAt: '2026-05-01T00:00:00.000Z',
    periodEndsAt: '2026-07-31T00:00:00.000Z',
    status: 'COMPLETED',
    fundingAsset: 'NATIVE_ETH_TESTNET',
    targetWei: '4000000000000000000',
    onChainCampaignId: 2,
    raisedWei: '4200000000000000000',
    usedWei: '4100000000000000000',
    expenses: [
      {
        category: 'Pengeboran',
        description: 'Sumur bor 40 meter dan pompa air.',
        amountWei: '3600000000000000000',
        status: 'PAID',
        recordedAt: '2026-06-12T03:00:00.000Z'
      },
      {
        category: 'Pelatihan',
        description: 'Pelatihan perawatan untuk enam warga desa.',
        amountWei: '500000000000000000',
        status: 'PAID',
        recordedAt: '2026-07-20T03:00:00.000Z'
      }
    ],
    budgets: [
      {
        version: 1,
        createdAt: '2026-05-03T02:00:00.000Z',
        supersededAt: null,
        items: [
          {
            category: 'Pengeboran',
            description: 'Sumur bor 40 meter dan pompa air.',
            plannedWei: '3600000000000000000'
          },
          {
            category: 'Pelatihan',
            description: 'Pelatihan perawatan untuk enam warga desa.',
            plannedWei: '500000000000000000'
          }
        ]
      }
    ],
    distributions: {
      batches: 2,
      verified: 2,
      itemsPrepared: 450,
      itemsDelivered: 450,
      unitLabel: 'jeriken air'
    },
    updates: [
      {
        at: '2026-08-02T02:00:00.000Z',
        title: 'Fasilitas diserahkan ke desa',
        body: 'Sumur beroperasi dan pengelolaan diserahkan ke kelompok air desa. Laporan akhir tersedia untuk diunduh.'
      }
    ],
    activity: [
      {
        at: '2026-08-01T05:00:00.000Z',
        title: 'Kampanye ditutup',
        detail: 'Kampanye selesai. Rekap akhir: 4,2 ETH testnet diterima, 4,1 ETH testnet digunakan.',
        source: 'DATABASE',
        txHash: '0x732c51850f319d935cc85bd4ae013fd59d39e1b85305c791bf92786f7c39fff3',
        explorerUrl: explorerTx('0x732c51850f319d935cc85bd4ae013fd59d39e1b85305c791bf92786f7c39fff3')
      }
    ]
  }
]

const PUBLIC_CAMPAIGN_STATUSES: CampaignStatus[] = ['ACTIVE', 'CLOSED', 'COMPLETED']

export function getPublicCampaigns(): CampaignFixture[] {
  // Setara filter API publik: hanya ACTIVE / CLOSED / COMPLETED (docs/API.md §5).
  return campaigns.filter((campaign) => PUBLIC_CAMPAIGN_STATUSES.includes(campaign.status))
}

export function getCampaignBySlug(slug: string): CampaignFixture | undefined {
  return getPublicCampaigns().find((campaign) => campaign.slug === slug)
}

export function getLatestBudget(campaign: CampaignFixture): BudgetVersion | undefined {
  return campaign.budgets.find((budget) => budget.supersededAt === null)
}

export type ExpenseCategoryTotal = {
  category: string
  amountWei: string
  count: number
}

/**
 * Agregat kategori pengeluaran untuk laporan publik (TRN-03).
 * Hanya `APPROVED` + `PAID` yang dihitung, agar cocok dengan `usedWei` (EXP-05).
 */
export function getExpenseCategories(campaign: CampaignFixture): ExpenseCategoryTotal[] {
  const totals = new Map<string, { amount: bigint; count: number }>()

  for (const expense of campaign.expenses) {
    if (expense.status === 'PROPOSED') continue
    const current = totals.get(expense.category) ?? { amount: BigInt(0), count: 0 }
    totals.set(expense.category, {
      amount: current.amount + BigInt(expense.amountWei),
      count: current.count + 1
    })
  }

  return [...totals.entries()].map(([category, total]) => ({
    category,
    amountWei: total.amount.toString(),
    count: total.count
  }))
}
