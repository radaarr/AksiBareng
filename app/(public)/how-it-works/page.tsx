import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cara kerja — AksiBareng'
}

const flow = [
  {
    title: 'Organizer menyiapkan',
    body: 'Organizer terverifikasi membuat kegiatan atau kampanye, lengkap dengan anggaran dan kebutuhan barang.'
  },
  {
    title: 'Relawan dan donatur ikut',
    body: 'Relawan mendaftar dan check-in di lokasi. Donatur mendukung kampanye memakai aset testnet.'
  },
  {
    title: 'Bukti diperiksa',
    body: 'Kontribusi dan bukti distribusi tercatat. Publik dapat memeriksa ringkasan dan hash-nya.'
  }
]

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Cara kerja</h1>
        <p className="max-w-2xl text-zinc-700">
          AksiBareng menghubungkan kegiatan sosial dengan catatan yang dapat diperiksa. Berikut alurnya
          dan batasannya.
        </p>
      </header>

      <section aria-labelledby="alur" className="flex flex-col gap-5">
        <h2 id="alur" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Alur singkat
        </h2>
        <ol className="flex flex-col gap-4">
          {flow.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-zinc-900">{step.title}</h3>
                <p className="text-sm text-zinc-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="batasan" className="flex flex-col gap-5">
        <h2 id="batasan" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Apa yang dibuktikan dan tidak
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900">Dibuktikan oleh catatan chain</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              <li>Catatan tertentu dibuat pada waktu tertentu.</li>
              <li>Isi catatan tidak berubah setelah dicatat.</li>
              <li>Nominal dan alamat pelaku transaksi dapat dilihat.</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold text-zinc-900">Tidak dibuktikan</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
              <li>Kebenaran isi laporan atau bukti.</li>
              <li>Bantuan benar-benar sampai ke penerima.</li>
              <li>Kualitas kegiatan yang dilaporkan.</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-zinc-700">
          Karena itu verifikasi manusia tetap ada: organizer meninjau bukti, admin dapat memeriksa ulang,
          dan laporan publik menampilkan sumber setiap angka.
        </p>
      </section>

      <section aria-labelledby="privasi" className="flex flex-col gap-3">
        <h2 id="privasi" className="text-2xl font-semibold tracking-tight text-zinc-900">
          Privasi penerima bantuan
        </h2>
        <p className="max-w-2xl text-zinc-700">
          Nama, alamat, kontak, dan foto wajah penerima bantuan tidak pernah dicatat ke blockchain atau
          ditampilkan publik. Laporan hanya memuat ringkasan, seperti jumlah paket dan wilayah umum.
        </p>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</strong> Donasi uang pada versi ini
          tidak bernilai uang dan tidak dapat dicairkan.
        </p>
      </section>

      <nav aria-label="Navigasi lanjutan">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Kembali ke beranda
        </Link>
      </nav>
    </div>
  )
}
