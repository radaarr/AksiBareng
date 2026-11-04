import Link from 'next/link'
import { signOut } from '@/lib/auth/config'
import { getActor } from '@/lib/auth/session'

const navItems = [
  { href: '/dashboard/organizer/campaigns', label: 'Kampanye saya' },
  { href: '/dashboard/organizer/campaigns/new', label: 'Buat kampanye' }
]

/**
 * Shell sementara untuk area organizer. Layout dashboard 3 role adalah T1.7
 * milik B; shell ini hanya membungkus route kampanye milik C.
 */
export default async function OrganizerCampaignsLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const actor = await getActor()

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

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
          <div className="flex flex-col">
            <Link
              href="/"
              className="rounded-md text-lg font-semibold tracking-tight text-zinc-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              AksiBareng
            </Link>
            <span className="text-sm text-zinc-700">AksiPeduli · Organizer</span>
          </div>

          <nav aria-label="Navigasi kampanye">
            <ul className="flex flex-wrap items-center gap-1">
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
              <li>
                <Link
                  href="/campaigns"
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-zinc-700 underline-offset-4 hover:bg-zinc-100 hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                >
                  Katalog publik
                </Link>
              </li>
              {actor ? (
                <li>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                    >
                      Keluar ({actor.displayName})
                    </button>
                  </form>
                </li>
              ) : (
                <li>
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    Masuk
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main id="konten" className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-zinc-700">
          <p className="font-semibold">SIMULASI — aset testnet Sepolia, bukan uang sungguhan.</p>
          <p>Semua akses data dan otorisasi diperiksa di server.</p>
        </div>
      </footer>
    </div>
  )
}
