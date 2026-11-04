import { ButtonLink } from '@/components/ui/button'

/** Halaman 403: sebut peran yang dibutuhkan, tanpa membocorkan data resource (docs/UI_UX.md §4). */
export function ForbiddenNotice({ reason }: { reason: string }) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Akses ditolak</h1>
      <p className="text-sm text-zinc-700">{reason}</p>
      <ButtonLink href="/dashboard" variant="secondary" className="mt-1 w-fit">
        Kembali ke ringkasan
      </ButtonLink>
    </div>
  )
}
