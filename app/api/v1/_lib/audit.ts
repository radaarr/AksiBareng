import { createHash, randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import type { Actor } from '@/lib/auth/session'

export type RequestContext = {
  requestId: string
  ipHash: string
}

/** Request id + hash IP untuk audit log; IP mentah tidak pernah disimpan. */
export function requestContext(request: NextRequest): RequestContext {
  const suppliedRequestId = request.headers.get('x-request-id')?.trim()
  const requestId = suppliedRequestId ? suppliedRequestId.slice(0, 100) : randomUUID()
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'lokal'
  const ipHash = createHash('sha256')
    .update(`${clientIp}:${process.env.AUTH_SECRET ?? 'dev'}`)
    .digest('hex')

  return { requestId, ipHash }
}

export type AuditInput = {
  actor: Actor
  action: string
  entityType: 'campaign' | 'organization'
  entityId: string
  context: RequestContext
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
}

export async function writeAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  await tx.auditLog.create({
    data: {
      actorUserId: input.actor.id,
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      requestId: input.context.requestId,
      ipHash: input.context.ipHash
    }
  })
}
