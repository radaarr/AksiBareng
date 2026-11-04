import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cx } from '@/components/ui/cn'
import { signOut } from '@/lib/auth/config'
import { requireSession } from '@/lib/auth/session'
import { BottomNav, MobileMenu, SidebarNav } from './_components/dashboard-nav'
import { ROLE_LABEL, navItemsFor } from './_components/nav-items'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireSession()
  const items = navItemsFor(actor.role)
  const isVolunteer = actor.role === 'VOLUNTEER'

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row lg:gap-8 lg:px-6">
        <aside className="hidden w-60 shrink-0 flex-col gap-6 py-6 lg:flex">
          <Link
            href="/dashboard"
            className="rounded-md px-3 text-base font-bold tracking-tight text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            AksiBareng
          </Link>
          <SidebarNav items={items} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:border-0 lg:bg-transparent lg:px-0 lg:py-6">
            <div className="flex min-w-0 items-center gap-3">
              {isVolunteer ? null : <MobileMenu items={items} />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{actor.displayName}</p>
                <p className="text-xs text-zinc-700">{ROLE_LABEL[actor.role]}</p>
              </div>
            </div>

            <form action={logout}>
              <Button type="submit" variant="secondary">
                Keluar
              </Button>
            </form>
          </header>

          <main className={cx('flex-1 px-4 py-6 lg:px-0 lg:py-8', isVolunteer && 'pb-28 lg:pb-10')}>{children}</main>
        </div>
      </div>

      {isVolunteer ? <BottomNav items={items} /> : null}
    </div>
  )
}
