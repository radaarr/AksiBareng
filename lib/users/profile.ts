import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { writeAuditLog } from '@/lib/audit'
import { updateProfileSchema } from '@/lib/validation/profile'
import { toFieldIssues, type FieldIssue } from '@/lib/validation/common'

export class InvalidProfileError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('VALIDATION_ERROR')
  }
}

export type Profile = {
  id: string
  email: string
  displayName: string
  role: UserRole
  isPublicName: boolean
  status: string
}

const PROFILE_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  isPublicName: true,
  status: true
} as const

export async function getProfile(userId: string): Promise<Profile | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT })
}

// AUTH-04: hanya field non-sensitif; perubahan ditulis ke audit_logs dalam
// transaksi yang sama (docs/DATABASE.md §8: perubahan penting tercatat).
export async function updateProfile(
  actor: { id: string; role: UserRole },
  input: unknown,
  context: { requestId: string; ipHash: string }
): Promise<Profile> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) throw new InvalidProfileError(toFieldIssues(parsed.error))

  const data = parsed.data

  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({
      where: { id: actor.id },
      select: { id: true, email: true, displayName: true, role: true, isPublicName: true, status: true }
    })
    if (!before) throw new Error('USER_NOT_FOUND')

    const updated = await tx.user.update({
      where: { id: actor.id },
      data,
      select: PROFILE_SELECT
    })

    await writeAuditLog(tx, {
      action: 'user.profile_updated',
      entityType: 'user',
      entityId: actor.id,
      actorUserId: actor.id,
      actorRole: actor.role,
      before: { displayName: before.displayName, isPublicName: before.isPublicName },
      after: { displayName: updated.displayName, isPublicName: updated.isPublicName },
      requestId: context.requestId,
      ipHash: context.ipHash
    })

    return updated
  })
}
