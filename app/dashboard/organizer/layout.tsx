import { Alert } from '@/components/ui/alert'
import { requireSession } from '@/lib/auth/session'
import { ForbiddenNotice } from '../_components/forbidden-notice'

export default async function OrganizerAreaLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireSession()

  if (actor.role !== 'ORGANIZER') {
    return <ForbiddenNotice reason="Halaman ini untuk akun organizer. Akun Anda memakai dashboard lain." />
  }

  return (
    <div className="flex flex-col gap-5">
      {actor.organizationId ? null : (
        <Alert tone="warning" title="Organisasi belum ada">
          Akun organizer ini belum memiliki organisasi, jadi kegiatan belum bisa dibuat. Ajukan verifikasi organisasi
          terlebih dahulu.
        </Alert>
      )}
      {children}
    </div>
  )
}
