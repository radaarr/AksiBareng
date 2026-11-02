import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">AksiBareng</h1>
        <p className="text-lg text-zinc-600">Every Contribution Matters.</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Dua modul utama</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-lg bg-zinc-100 p-4">
            <p className="font-semibold">AksiKegiatan</p>
            <p className="text-sm text-zinc-600">Kelola kegiatan sosial, relawan, tugas, dan presensi QR.</p>
          </li>
          <li className="rounded-lg bg-zinc-100 p-4">
            <p className="font-semibold">AksiPeduli</p>
            <p className="text-sm text-zinc-600">Kelola kampanye, donasi, pengeluaran, dan distribusi bantuan.</p>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
        <p className="text-sm text-amber-900">
          <strong>SIMULASI — aset testnet.</strong> Donasi uang pada MVP memakai aset testnet Sepolia dan
          bukan uang sungguhan. Aplikasi dalam tahap pengembangan.
        </p>
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/how-it-works" className="underline underline-offset-4">
          Cara kerja
        </Link>
        <Link href="/events" className="underline underline-offset-4">
          Katalog kegiatan
        </Link>
        <Link href="/campaigns" className="underline underline-offset-4">
          Katalog kampanye
        </Link>
        <Link href="/verify" className="underline underline-offset-4">
          Verifikasi catatan
        </Link>
        <Link href="/login" className="underline underline-offset-4">
          Masuk
        </Link>
      </nav>
    </main>
  )
}
