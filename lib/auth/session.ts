import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { UnauthenticatedError } from './errors'
import { auth } from './config'

export { UnauthenticatedError }

export type Actor = {
  id: string
  email: string
  displayName: string
  role: UserRole
  isPublicName: boolean
  /** Organisasi yang dimiliki aktor; null bila belum punya (docs/RBAC.md §5). */
  organizationId: string | null
}

// docs/RBAC.md §1: id, role, dan status dibaca dari database tiap request —
// bukan dari isi token, supaya suspend/perubahan role langsung berlaku.
export async function getActor(): Promise<Actor | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      isPublicName: true,
      status: true,
      organizationsOwned: { select: { id: true }, take: 1 }
    }
  })

  if (!user || user.status !== 'ACTIVE') return null

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isPublicName: user.isPublicName,
    organizationId: user.organizationsOwned[0]?.id ?? null
  }
}

/** Untuk route handler: lempar UnauthenticatedError, pemanggil memetakan ke 401. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor()
  if (!actor) throw new UnauthenticatedError()
  return actor
}

/** Untuk server component/halaman: alihkan ke /login bila belum masuk. */
export async function requireSession(): Promise<Actor> {
  const actor = await getActor()
  if (!actor) redirect('/login')
  return actor
}
