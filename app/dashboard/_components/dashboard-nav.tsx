'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/components/ui/cn'
import type { NavItem } from './nav-items'

const LINK_BASE =
  'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white'

/** Item terpanjang yang cocok, supaya induk dan anak tidak sama-sama aktif. */
function useActiveHref(items: NavItem[]): string | null {
  const pathname = usePathname()
  const matches = items.filter(
    (item) => item.ready && (pathname === item.href || pathname.startsWith(`${item.href}/`))
  )
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
}

function SoonItem({ label }: { label: string }) {
  return (
    <span className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm text-zinc-600">
      {label}
      <span className="rounded border border-zinc-300 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
        Segera
      </span>
    </span>
  )
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items)

  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
      {items.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active === item.href ? 'page' : undefined}
            className={cx(
              LINK_BASE,
              active === item.href ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'text-zinc-800 hover:bg-zinc-100'
            )}
          >
            {item.label}
          </Link>
        ) : (
          <SoonItem key={item.href} label={item.label} />
        )
      )}
    </nav>
  )
}

/** Hanya halaman yang sudah ada; bottom nav tidak boleh memuat tautan mati. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items)
  const ready = items.filter((item) => item.ready)

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {ready.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={active === item.href ? 'page' : undefined}
              className={cx(
                'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-center text-xs font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900',
                active === item.href ? 'text-zinc-900' : 'text-zinc-600'
              )}
            >
              <span className="flex flex-col items-center gap-1">
                <span
                  aria-hidden="true"
                  className={cx('h-0.5 w-6 rounded-full', active === item.href ? 'bg-zinc-900' : 'bg-transparent')}
                />
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Pengganti sidebar di layar kecil untuk organizer dan admin. */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const active = useActiveHref(items)

  return (
    <details className="relative lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-zinc-400 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        Menu
      </summary>
      <div className="absolute top-full left-0 z-20 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
        <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
          {items.map((item) =>
            item.ready ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? 'page' : undefined}
                className={cx(
                  LINK_BASE,
                  active === item.href ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'text-zinc-800 hover:bg-zinc-100'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <SoonItem key={item.href} label={item.label} />
            )
          )}
        </nav>
      </div>
    </details>
  )
}
