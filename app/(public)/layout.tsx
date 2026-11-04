import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/campaigns', label: 'Kampanye' },
  { href: '/verify', label: 'Verifikasi' },
  { href: '/how-it-works', label: 'Cara kerja' }
]

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-zinc-900 focus:ring-2 focus:ring-zinc-900"
      >
        Lewati ke konten utama
      </a>

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="rounded-md px-1 py-2 text-lg font-semibold tracking-tight text-zinc-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            AksiBareng
          </Link>
          <nav aria-label="Navigasi utama">
            <ul className="flex flex-wrap gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-zinc-700 underline-offset-4 hover:bg-zinc-100 hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="konten" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-zinc-700">
          <p className="font-semibold">SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</p>
          <p>Semua donasi uang adalah aset testnet Sepolia — bukan uang sungguhan.</p>
          <p className="text-zinc-600">AksiBareng — Every Contribution Matters.</p>
        </div>
      </footer>
    </div>
  )
}
