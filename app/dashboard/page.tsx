import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/session'

export default async function DashboardIndexPage() {
  const actor = await requireSession()

  if (actor.role === 'ORGANIZER') redirect('/dashboard/organizer')
  if (actor.role === 'ADMIN') redirect('/dashboard/admin')
  redirect('/dashboard/me')
}
