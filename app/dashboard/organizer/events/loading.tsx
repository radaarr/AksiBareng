import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingOrganizerEvents() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-5 w-72" />
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
      <span className="sr-only">Memuat daftar kegiatan</span>
    </div>
  )
}
