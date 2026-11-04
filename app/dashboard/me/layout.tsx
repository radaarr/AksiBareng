import { requireSession } from '@/lib/auth/session'
import { ForbiddenNotice } from '../_components/forbidden-notice'

export default async function VolunteerAreaLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireSession()

  if (actor.role !== 'VOLUNTEER') {
    return (
      <ForbiddenNotice reason="Halaman ini untuk akun relawan atau donatur. Akun Anda memakai dashboard lain." />
    )
  }

  return children
}
