import type { UserRole } from '@prisma/client'
import { signOut } from '@/lib/auth/config'
import { requireSession } from '@/lib/auth/session'

const ROLE_LABEL: Record<UserRole, string> = {
  VOLUNTEER: 'Relawan / Donatur',
  ORGANIZER: 'Organizer',
  ADMIN: 'Admin platform'
}

// Halaman sementara sampai T1.7 (B) membangun layout dashboard per peran.
// Fungsinya: membuktikan sesi berlaku dan pintu keluar tersedia.
export default async function DashboardPage() {
  const actor = await requireSession()

  async function logout() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-zinc-600">Anda masuk sebagai</p>
        <h1 className="text-2xl font-bold tracking-tight">{actor.displayName}</h1>
        <p className="text-sm text-zinc-700">{ROLE_LABEL[actor.role]}</p>
      </header>

      {actor.role === 'ORGANIZER' && !actor.organizationId ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Akun ini belum memiliki organisasi. Pengajuan verifikasi tersedia pada T1.6.
        </p>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
        Halaman ini sementara. Dashboard per peran dibangun pada task T1.7 dan akan menggantikan halaman ini.
      </section>

      <form action={logout}>
        <button
          type="submit"
          className="min-h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          Keluar
        </button>
      </form>
    </main>
  )
}
