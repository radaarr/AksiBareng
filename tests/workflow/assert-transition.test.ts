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

const registry: WorkflowRegistry = {
  demo: [
    { from: 'DRAFT', to: 'PUBLISHED', action: 'event.published' },
    { from: 'PUBLISHED', to: 'CANCELLED', action: 'event.cancelled', requiresReason: true }
  ]
}

const context = { requestId: 'req-123456', ipHash: 'b'.repeat(64) }
const actor = { id: 'user-1', role: 'ORGANIZER' as const }

function mockTx(createImpl: (data: unknown) => Promise<unknown> = async () => ({})) {
  const create = vi.fn(createImpl)
  return { tx: { auditLog: { create } } as never, create }
}

describe('findRule', () => {
  test('menemukan rule yang cocok; selain itu null', () => {
    expect(findRule(registry, 'demo', 'DRAFT', 'PUBLISHED')?.action).toBe('event.published')
    expect(findRule(registry, 'demo', 'PUBLISHED', 'DRAFT')).toBeNull()
    expect(findRule(registry, 'tidak-ada', 'DRAFT', 'PUBLISHED')).toBeNull()
  })
})

describe('assertTransition', () => {
  test('registry kosong (bawaan) menolak semuanya — deny by default', async () => {
    const { tx } = mockTx()
    await expect(
      assertTransition(tx, {
        entityType: 'event',
        entityId: 'event-1',
        from: 'DRAFT',
        to: 'PUBLISHED',
        actor,
        context
      })
    ).rejects.toBeInstanceOf(TransitionNotAllowedError)
  })

  test('transisi tanpa rule ditolak dan tidak menulis audit', async () => {
    const { tx, create } = mockTx()
    await expect(
      assertTransition(
        tx,
        { entityType: 'demo', entityId: 'x', from: 'PUBLISHED', to: 'DRAFT', actor, context },
        registry
      )
    ).rejects.toBeInstanceOf(TransitionNotAllowedError)
    expect(create).not.toHaveBeenCalled()
  })

  test('rule requiresReason tanpa alasan ditolak; audit tidak tertulis', async () => {
    const { tx, create } = mockTx()
    await expect(
      assertTransition(
        tx,
        { entityType: 'demo', entityId: 'x', from: 'PUBLISHED', to: 'CANCELLED', actor, context },
        registry
      )
    ).rejects.toBeInstanceOf(TransitionReasonRequiredError)
    expect(create).not.toHaveBeenCalled()
  })

  test('transisi valid menulis audit before/after dalam satu panggilan', async () => {
    const { tx, create } = mockTx()
    const rule = await assertTransition(
      tx,
      {
        entityType: 'demo',
        entityId: 'evt-1',
        from: 'PUBLISHED',
        to: 'CANCELLED',
        reason: 'Lokasi banjir',
        actor,
        context,
        before: { title: 'Beach Cleanup Day' },
        after: { title: 'Beach Cleanup Day' }
      },
      registry
    )
    expect(rule.action).toBe('event.cancelled')
    expect(create).toHaveBeenCalledTimes(1)
    const data = create.mock.calls[0]?.[0] as { data: Record<string, unknown> }
    expect(data.data).toMatchObject({
      action: 'event.cancelled',
      entityType: 'demo',
      entityId: 'evt-1',
      actorUserId: 'user-1',
      actorRole: 'ORGANIZER',
      reason: 'Lokasi banjir'
    })
    expect(data.data.before).toMatchObject({ status: 'PUBLISHED', title: 'Beach Cleanup Day' })
    expect(data.data.after).toMatchObject({ status: 'CANCELLED' })
  })

  test('aktor SYSTEM tidak menyimpan id semu di audit', async () => {
    const { tx, create } = mockTx()
    await assertTransition(
      tx,
      {
        entityType: 'demo',
        entityId: 'evt-2',
        from: 'DRAFT',
        to: 'PUBLISHED',
        actor: { id: 'system', role: 'SYSTEM' },
        context
      },
      registry
    )
    const data = create.mock.calls[0]?.[0] as { data: Record<string, unknown> }
    expect(data.data.actorUserId).toBeNull()
    expect(data.data.actorRole).toBe('SYSTEM')
  })

  test('kegagalan tulis audit menggugurkan transisi (exception dilempar)', async () => {
    const { tx } = mockTx(async () => {
      throw new Error('db down')
    })
    await expect(
      assertTransition(
        tx,
        { entityType: 'demo', entityId: 'evt-3', from: 'DRAFT', to: 'PUBLISHED', actor, context },
        registry
      )
    ).rejects.toThrow('db down')
  })
})

describe('WORKFLOW_TRANSITIONS bawaan', () => {
  test('registry bawaan kosong dan setiap action yang dipakai ada di katalog AUDIT_ACTIONS', () => {
    for (const rules of Object.values(WORKFLOW_TRANSITIONS)) {
      for (const rule of rules) {
        expect(AUDIT_ACTIONS).toContain(rule.action)
      }
    }
    expect(WORKFLOW_TRANSITIONS.event).toEqual([])
    expect(WORKFLOW_TRANSITIONS.event_registration).toEqual([])
  })
})
