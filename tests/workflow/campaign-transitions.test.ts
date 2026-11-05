import { describe, expect, test, vi } from 'vitest'
import { AUDIT_ACTIONS } from '@/lib/audit'
import {
  assertTransition,
  findRule,
  TransitionNotAllowedError,
  TransitionReasonRequiredError,
  WORKFLOW_TRANSITIONS,
  type WorkflowRegistry
} from '@/lib/workflow/assert-transition'

const context = { requestId: 'req-123456', ipHash: 'b'.repeat(64) }
const actor = { id: 'user-1', role: 'ORGANIZER' as const }

function mockTx(createImpl: (data: unknown) => Promise<unknown> = async () => ({})) {
  const create = vi.fn(createImpl)
  return { tx: { auditLog: { create } } as never, create }
}

describe('Campaign transitions — negative tests', () => {
  test('PENDING_REVIEW → CLOSED ditolak (lompatan status)', async () => {
    const { tx } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'campaign',
        entityId: 'camp-1',
        from: 'PENDING_REVIEW',
        to: 'CLOSED',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionNotAllowedError)
  })

  test('ACTIVE → COMPLETED ditolak (lompatan status)', async () => {
    const { tx } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'campaign',
        entityId: 'camp-2',
        from: 'ACTIVE',
        to: 'COMPLETED',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionNotAllowedError)
  })

  test('DRAFT → ACTIVE ditolak (lewati PENDING_REVIEW)', async () => {
    const { tx } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'campaign',
        entityId: 'camp-3',
        from: 'DRAFT',
        to: 'ACTIVE',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionNotAllowedError)
  })

  test('PENDING_REVIEW → DRAFT tanpa alasan ditolak', async () => {
    const { tx, create } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'campaign',
        entityId: 'camp-4',
        from: 'PENDING_REVIEW',
        to: 'DRAFT',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionReasonRequiredError)
    expect(create).not.toHaveBeenCalled()
  })

  test('ACTIVE → PAUSED dengan alasan menulis audit', async () => {
    const { tx, create } = mockTx()
    const rule = await assertTransition(tx, {
      entityType: 'campaign',
      entityId: 'camp-5',
      from: 'ACTIVE',
      to: 'PAUSED',
      actor,
      context,
      reason: 'Musim hujan',
      before: { status: 'ACTIVE' },
      after: { status: 'PAUSED' }
    })
    expect(rule.action).toBe('campaign.paused')
    expect(create).toHaveBeenCalledTimes(1)
  })

  test('CLOSED → CANCELLED Ditolak karena CLOSED sudah final (tanpa alasan)', async () => {
    const { tx } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'campaign',
        entityId: 'camp-6',
        from: 'CLOSED',
        to: 'CANCELLED',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionReasonRequiredError)
  })

  test('Semakin transisi di luar daftar, deny by default', () => {
    // Registry kosong bawaan menolak semua
    expect(WORKFLOW_TRANSITIONS.campaign).toBeDefined()
    const hasRule = findRule(WORKFLOW_TRANSITIONS, 'campaign', 'PENDING_REVIEW', 'CLOSED')
    expect(hasRule).toBeNull()
  })

  test('Setiap action campaign terdaftar di AUDIT_ACTIONS', () => {
    for (const rule of WORKFLOW_TRANSITIONS.campaign) {
      expect(AUDIT_ACTIONS).toContain(rule.action)
    }
  })
})