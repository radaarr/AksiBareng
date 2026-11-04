import Link from 'next/link'

const steps = [
  {
    title: 'Ikut atau dukung',
    body: 'Daftar sebagai relawan, ajukan donasi barang, atau dukung kampanye dengan aset testnet.'
  },
  {
    title: 'Kegiatan berjalan',
    body: 'Organizer mengelola kuota, tugas, pengeluaran, dan distribusi bantuan dari satu tempat.'
  },
  {
    title: 'Bukti tercatat',
    body: 'Kontribusi dan bukti penting dicatat, lalu bisa diperiksa siapa saja lewat halaman transparansi.'
  }
]

const modules = [
  {
    name: 'AksiKegiatan',
    body: 'Katalog kegiatan sosial, pendaftaran relawan, kuota, pembagian tugas, dan check-in QR.'
  },
  {
    name: 'AksiPeduli',
    body: 'Kampanye donasi, inventaris barang, pengeluaran, distribusi bantuan, dan laporan publik.'
  }
]

// Angka contoh untuk menggambarkan bentuk laporan; bukan data pengguna nyata.
const demoStats = [
  { label: 'Kegiatan demo', value: '3' },
  { label: 'Kampanye aktif', value: '1' },
  { label: 'Kontribusi tercatat', value: '24' }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          AksiKegiatan + AksiPeduli
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">AksiBareng</h1>
        <p className="max-w-2xl text-lg text-zinc-700">
          Satu tempat untuk mengelola kegiatan sosial, donasi, dan distribusi bantuan — dengan catatan
          yang bisa diperiksa, bukan sekadar janji.
        </p>
        <div>
          <Link
            href="/how-it-works"
            className="inline-flex min-h-11 items-center rounded-md bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Lihat cara kerja
          </Link>
        </div>
      </section>

      <section aria-labelledby="alur" className="flex flex-col gap-6">
        <h2 id="alur" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Tiga langkah
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5">
              <span className="text-sm font-semibold text-zinc-500">Langkah {index + 1}</span>
              <h3 className="font-semibold text-zinc-900">{step.title}</h3>
              <p className="text-sm text-zinc-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="modul" className="flex flex-col gap-6">
        <h2 id="modul" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dua modul
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {modules.map((module) => (
            <li key={module.name} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900">{module.name}</h3>
              <p className="text-sm text-zinc-700">{module.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="ringkasan"
        className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-6"
      >
        <div className="flex flex-col gap-2">
          <h2 id="ringkasan" className="text-xl font-semibold text-amber-950">
            Contoh ringkasan
          </h2>
          <p className="text-sm text-amber-950">
            <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Angka di bawah berasal
            dari data demo, bukan kegiatan nyata.
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          {demoStats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-amber-950">{stat.label}</dt>
              <dd className="text-2xl font-semibold text-amber-950">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
