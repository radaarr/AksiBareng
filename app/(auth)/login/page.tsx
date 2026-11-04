import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth/config'
import { getActor } from '@/lib/auth/session'

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Email atau kata sandi salah.',
  rate_limited: 'Terlalu banyak percobaan masuk. Coba lagi 15 menit lagi.',
  Configuration: 'Login sedang tidak tersedia. Hubungi admin platform.',
  AccessDenied: 'Akun ini tidak dapat masuk.'
}

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; registered?: string }>
}) {
  const params = await searchParams

  if (await getActor()) redirect('/dashboard')

  async function login(formData: FormData) {
    'use server'
    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirectTo: '/dashboard'
      })
    } catch (error) {
      if (error instanceof AuthError) {
        const code =
          'code' in error && typeof error.code === 'string' && error.code ? error.code : 'CredentialsSignin'
        redirect(`/login?error=${encodeURIComponent(code)}`)
      }
      throw error
    }
  }

  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? 'Gagal masuk. Periksa email dan kata sandi Anda.')
    : null

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Masuk ke AksiBareng</h1>
        <p className="text-sm text-zinc-600">Gunakan akun yang sudah Anda daftarkan.</p>
      </header>

      {params.registered ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
          Akun berhasil dibuat. Silakan masuk.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Kata sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
        </div>

        <button
          type="submit"
          className="min-h-11 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
        >
          Masuk
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          Daftar sebagai relawan
        </Link>
      </p>
    </main>
  )
}
