import type { Prisma, UserRole } from '@prisma/client'
import { writeAuditLog, type AuditAction } from '@/lib/audit'

// Mesin transisi tunggal untuk semua perubahan status (docs/FLOWS.md §3 & §5).
// Aturan hidup sebagai data di WORKFLOW_TRANSITIONS; pemilik wilayah menambah
// baris lewat PR kecil. Yang tidak terdaftar DITOLAK — deny by default.

export type WorkflowRule = {
  from: string
  to: string
  /** Action audit_logs yang ditulis saat transisi berhasil. */
  action: AuditAction
  /** Wajib `reason` non-kosong (mis. pembatalan kegiatan). */
  requiresReason?: boolean
}

export class TransitionNotAllowedError extends Error {
  constructor(
    readonly entityType: string,
    readonly from: string,
    readonly to: string
  ) {
    super('INVALID_STATE_TRANSITION')
    this.name = 'TransitionNotAllowedError'
  }
}

export class TransitionReasonRequiredError extends Error {
  constructor(
    readonly entityType: string,
    readonly from: string,
    readonly to: string
  ) {
    super('REASON_REQUIRED')
    this.name = 'TransitionReasonRequiredError'
  }
}

// Tabel transisi. Sengaja kosong di PR ini — baris event & registration
// menyusul dari pemilik wilayah B lewat PR kecil (docs/TEAM_PLAN.md §2).
// `action` wajib terdaftar di AUDIT_ACTIONS; buildAuditEntry menolak lainnya.
export const WORKFLOW_TRANSITIONS: Record<string, readonly WorkflowRule[]> = {
  event: [],
  event_registration: []
}

export type WorkflowRegistry = Record<string, readonly WorkflowRule[]>

/** Murni: rule yang cocok atau null. Dipakai test dan pemanggil yang butuh inspeksi. */
export function findRule(
  registry: WorkflowRegistry,
  entityType: string,
  from: string,
  to: string
): WorkflowRule | null {
  return registry[entityType]?.find((rule) => rule.from === from && rule.to === to) ?? null
}

export type TransitionInput = {
  entityType: string
  entityId: string
  from: string
  to: string
  reason?: string | null
  actor: { id: string; role: UserRole | 'SYSTEM' }
  context: { requestId: string; ipHash: string }
  /** Tambahan field audit di luar status (mis. `{ title, quota }`); opsional. */
  before?: unknown
  after?: unknown
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value !== undefined && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) }
  }
  return value === undefined ? {} : { value }
}

/**
 * Validasi transisi + tulis audit_logs dalam transaksi pemanggil.
 * Tidak memperbarui baris entitas itu sendiri — pemanggil memperbarui status
 * pada transaksi yang sama, sehingga kegagalan audit menggugurkan transisi.
 */
export async function assertTransition(
  tx: Prisma.TransactionClient,
  input: TransitionInput,
  registry: WorkflowRegistry = WORKFLOW_TRANSITIONS
): Promise<WorkflowRule> {
  const rule = findRule(registry, input.entityType, input.from, input.to)
  if (!rule) {
    throw new TransitionNotAllowedError(input.entityType, input.from, input.to)
  }
  if (rule.requiresReason && (!input.reason || input.reason.trim().length === 0)) {
    throw new TransitionReasonRequiredError(input.entityType, input.from, input.to)
  }

  await writeAuditLog(tx, {
    action: rule.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actorUserId: input.actor.role === 'SYSTEM' ? null : input.actor.id,
    actorRole: input.actor.role,
    before: { ...asJsonObject(input.before), status: input.from },
    after: { ...asJsonObject(input.after), status: input.to },
    reason: input.reason ?? null,
    requestId: input.context.requestId,
    ipHash: input.context.ipHash
  })

  return rule
}
