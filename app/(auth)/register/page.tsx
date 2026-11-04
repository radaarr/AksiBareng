'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ProblemPayload = {
  detail?: string
  errors?: { field: string; message: string }[]
}

const FIELD_IDS = {
  email: 'email-hint',
  password: 'password-hint',
  displayName: 'displayName-hint'
} as const

export default function RegisterPage() {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          displayName: formData.get('displayName')
        })
      })
      const payload = (await response.json().catch(() => null)) as ProblemPayload | null

      if (response.status === 201) {
        router.push('/login?registered=1')
        return
      }

      if (payload?.errors) {
        setFieldErrors(Object.fromEntries(payload.errors.map((issue) => [issue.field, issue.message])))
      }
      setMessage(payload?.detail ?? 'Pendaftaran gagal. Coba lagi.')
    } catch {
      setMessage('Tidak dapat menghubungi server. Periksa koneksi Anda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Daftar akun</h1>
        <p className="text-sm text-zinc-600">
          Satu akun untuk mengikuti kegiatan dan berdonasi. Dompet digital (wallet) tidak diperlukan.
        </p>
      </header>

      {message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="displayName" className="text-sm font-medium">
            Nama tampilan
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="nickname"
            required
            minLength={2}
            maxLength={60}
            aria-describedby={fieldErrors.displayName ? FIELD_IDS.displayName : undefined}
            aria-invalid={Boolean(fieldErrors.displayName)}
            className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
          {fieldErrors.displayName ? (
            <p id={FIELD_IDS.displayName} className="text-sm text-red-700">
              {fieldErrors.displayName}
            </p>
          ) : null}
        </div>

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
            aria-describedby={fieldErrors.email ? FIELD_IDS.email : undefined}
            aria-invalid={Boolean(fieldErrors.email)}
            className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
          {fieldErrors.email ? (
            <p id={FIELD_IDS.email} className="text-sm text-red-700">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Kata sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            aria-describedby={fieldErrors.password ? FIELD_IDS.password : 'password-rule'}
            aria-invalid={Boolean(fieldErrors.password)}
            className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
          {fieldErrors.password ? (
            <p id={FIELD_IDS.password} className="text-sm text-red-700">
              {fieldErrors.password}
            </p>
          ) : (
            <p id="password-rule" className="text-sm text-zinc-600">
              Minimal 10 karakter.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Memproses…' : 'Daftar'}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Masuk
        </Link>
      </p>
    </main>
  )
}
