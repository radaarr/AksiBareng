import Link from 'next/link'

export default function CampaignNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Kampanye tidak ditemukan</h1>
      <p className="max-w-xl text-zinc-700">
        Kampanye ini mungkin belum lolos tinjauan, sudah dihapus, atau alamatnya salah. Katalog hanya
        menampilkan kampanye yang aktif, ditutup, atau selesai.
      </p>
      <div>
        <Link
          href="/campaigns"
          className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Kembali ke katalog
        </Link>
      </div>
    </div>
  )
}
