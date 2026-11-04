import Link from 'next/link'

type GateStatus = 'UNVERIFIED' | 'PENDING' | 'REJECTED' | 'SUSPENDED'

const STATUS_COPY: Record<GateStatus, { title: string; description: string }> = {
  UNVERIFIED: {
    title: 'Organisasi belum terverifikasi',
    description:
      'Hanya organizer terverifikasi yang dapat membuat kampanye donasi publik. Ini berlaku juga untuk menyimpan draf yang akan diajukan ke admin.'
  },
  PENDING: {
    title: 'Verifikasi organisasi sedang ditinjau',
    description:
      'Pengajuan verifikasi Anda sudah diterima admin. Kampanye baru dapat dibuat setelah organisasi berstatus terverifikasi.'
  },
  REJECTED: {
    title: 'Pengajuan verifikasi organisasi ditolak',
    description:
      'Periksa kembali dokumen dan profil organisasi, lalu ajukan verifikasi ulang. Kampanye belum dapat dibuat sebelum disetujui admin.'
  },
  SUSPENDED: {
    title: 'Organisasi sedang ditangguhkan',
    description:
      'Organisasi ini tidak dapat membuat kampanye baru. Hubungi admin platform untuk informasi lebih lanjut.'
  }
}

/**
 * Gate UI untuk organizer belum terverifikasi (CAM-01). Ini hanya lapisan
 * tampilan; API tetap mengembalikan 403 ORGANIZATION_NOT_VERIFIED.
 */
export function VerificationGate({
  organizationName,
  publicArea,
  contactEmail,
  platformAdminEmail,
  verificationStatus
}: {
  organizationName: string
  publicArea: string | null
  contactEmail: string
  platformAdminEmail: string
  verificationStatus: GateStatus
}) {
  const copy = STATUS_COPY[verificationStatus]
  const subject = encodeURIComponent(`Pengajuan verifikasi organisasi: ${organizationName}`)
  const body = encodeURIComponent(
    `Halo admin AksiBareng,\n\nKami ingin mengajukan verifikasi organisasi ${organizationName}${
      publicArea ? ` (${publicArea})` : ''
    }.\nKontak: ${contactEmail}\n\nTerima kasih.`
  )

  return (
    <section
      aria-labelledby="gate-verifikasi"
      className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 id="gate-verifikasi" className="text-xl font-semibold text-amber-950">
          {copy.title}
        </h2>
        <p className="text-sm text-amber-950">{copy.description}</p>
      </div>

      <div className="flex flex-col gap-2 text-sm text-amber-950">
        <p className="font-semibold">Yang perlu disiapkan:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Profil organisasi dengan nama dan wilayah umum.</li>
          <li>Kontak resmi yang dapat dihubungi admin.</li>
          <li>Dokumen pendukung kegiatan atau legalitas organisasi.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`mailto:${platformAdminEmail}?subject=${subject}&body=${body}`}
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Ajukan verifikasi organisasi
        </a>
        <Link
          href="/how-it-works"
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Pelajari cara kerja
        </Link>
      </div>

      <p className="text-sm text-amber-950">
        Formulir pengajuan di dalam aplikasi sedang disiapkan. Untuk demo, pengajuan lewat email admin
        di atas. Anda tetap dapat melihat katalog dan laporan transparansi tanpa login.
      </p>
    </section>
  )
}
