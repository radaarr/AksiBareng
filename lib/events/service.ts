import {
  Prisma,
  type EventStatus,
  type RegistrationStatus,
  type VerificationStatus
} from '@prisma/client'
import { prisma } from '@/lib/db'
import type { FieldIssue } from '@/lib/validation/common'
import type { EventListQuery } from '@/lib/validation/event'
import { ACTIVE_REGISTRATION_STATUSES } from './guards'
import {
  decodeEventCursor,
  encodeEventCursor,
  isUuid,
  PUBLIC_DETAIL_STATUSES,
  PUBLIC_LIST_STATUSES
} from './query'

// Lapisan baca kegiatan. Tidak ada transisi status di sini — itu wewenang
// `lib/workflow/` (docs/FLOWS.md §5). Semua selector eksplisit: katalog publik
// tidak boleh membawa `createdBy`, kontak, atau data pendaftar (docs/RBAC.md §6).

export class InvalidEventQueryError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('VALIDATION_ERROR')
  }
}

// Prisma menolak array readonly di filter, jadi disalin sekali di sini.
const ACTIVE_STATUSES: RegistrationStatus[] = [...ACTIVE_REGISTRATION_STATUSES]

const EVENT_BASE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  startsAt: true,
  endsAt: true,
  city: true,
  locationName: true,
  quota: true,
  category: { select: { name: true, slug: true } },
  organization: {
    select: { name: true, slug: true, publicArea: true, logoUrl: true, verificationStatus: true }
  }
} as const

const EVENT_DETAIL_SELECT = {
  ...EVENT_BASE_SELECT,
  description: true,
  publicAddress: true,
  registrationOpensAt: true,
  registrationClosesAt: true,
  cancellationDeadline: true,
  tasks: {
    select: { id: true, name: true, description: true, quota: true },
    orderBy: { sortOrder: 'asc' }
  },
  _count: {
    select: { registrations: { where: { status: { in: ACTIVE_STATUSES } } } }
  }
} as const

const ORGANIZATION_EVENT_SELECT = {
  ...EVENT_BASE_SELECT,
  _count: {
    select: { registrations: { where: { status: { in: ACTIVE_STATUSES } } } }
  }
} as const

export type EventOrganizationSummary = {
  name: string
  slug: string
  publicArea: string
  logoUrl: string | null
  verificationStatus: VerificationStatus
}

export type PublicEventSummary = {
  id: string
  title: string
  slug: string
  status: EventStatus
  startsAt: string
  endsAt: string
  city: string | null
  locationName: string | null
  quota: number
  category: { name: string; slug: string }
  organization: EventOrganizationSummary
}

export type PublicEventTask = {
  id: string
  name: string
  description: string | null
  quota: number
}

export type PublicEventDetail = PublicEventSummary & {
  description: string | null
  publicAddress: string | null
  registrationOpensAt: string
  registrationClosesAt: string
  cancellationDeadline: string | null
  /** Agregat saja, tanpa identitas pendaftar (AGENTS.md guardrail 6). */
  registeredCount: number
  remainingQuota: number
  tasks: PublicEventTask[]
}

export type OrganizationEventSummary = PublicEventSummary & {
  registeredCount: number
  remainingQuota: number
}

type BaseRow = Prisma.EventGetPayload<{ select: typeof EVENT_BASE_SELECT }>

function toSummary(row: BaseRow): PublicEventSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    city: row.city,
    locationName: row.locationName,
    quota: row.quota,
    category: { name: row.category.name, slug: row.category.slug },
    organization: {
      name: row.organization.name,
      slug: row.organization.slug,
      publicArea: row.organization.publicArea,
      logoUrl: row.organization.logoUrl,
      verificationStatus: row.organization.verificationStatus
    }
  }
}

function remaining(quota: number, registeredCount: number): number {
  return Math.max(0, quota - registeredCount)
}

export type PublicEventPage = {
  data: PublicEventSummary[]
  pagination: { nextCursor: string | null; hasMore: boolean }
}

export async function listPublicEvents(query: EventListQuery): Promise<PublicEventPage> {
  const cursor = query.cursor ? decodeEventCursor(query.cursor) : null
  if (query.cursor && !cursor) {
    throw new InvalidEventQueryError([{ field: 'cursor', message: 'Penanda halaman tidak valid.' }])
  }

  const where: Prisma.EventWhereInput = {
    status: query.status ?? { in: [...PUBLIC_LIST_STATUSES] },
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
    ...(query.q ? { title: { contains: query.q, mode: 'insensitive' } } : {}),
    ...(query.from || query.to
      ? {
          startsAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {})
          }
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { startsAt: { gt: cursor.startsAt } },
            { startsAt: cursor.startsAt, id: { gt: cursor.id } }
          ]
        }
      : {})
  }

  const rows = await prisma.event.findMany({
    where,
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    take: query.limit + 1,
    select: EVENT_BASE_SELECT
  })

  const hasMore = rows.length > query.limit
  const page = hasMore ? rows.slice(0, query.limit) : rows
  const last = page.at(-1)

  return {
    data: page.map(toSummary),
    pagination: {
      nextCursor: hasMore && last ? encodeEventCursor({ startsAt: last.startsAt, id: last.id }) : null,
      hasMore
    }
  }
}

/** `idOrSlug` menerima keduanya: halaman publik C memakai slug (EVT-05). */
export async function getPublicEvent(idOrSlug: string): Promise<PublicEventDetail | null> {
  const row = await prisma.event.findFirst({
    where: {
      ...(isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }),
      status: { in: [...PUBLIC_DETAIL_STATUSES] }
    },
    select: EVENT_DETAIL_SELECT
  })

  if (!row) return null

  const registeredCount = row._count.registrations

  return {
    ...toSummary(row),
    description: row.description,
    publicAddress: row.publicAddress,
    registrationOpensAt: row.registrationOpensAt.toISOString(),
    registrationClosesAt: row.registrationClosesAt.toISOString(),
    cancellationDeadline: row.cancellationDeadline?.toISOString() ?? null,
    registeredCount,
    remainingQuota: remaining(row.quota, registeredCount),
    tasks: row.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      quota: task.quota
    }))
  }
}

/** Daftar untuk dashboard organizer: semua status milik organisasinya sendiri. */
export async function listOrganizationEvents(
  organizationId: string
): Promise<OrganizationEventSummary[]> {
  const rows = await prisma.event.findMany({
    where: { organizationId },
    orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
    take: 100,
    select: ORGANIZATION_EVENT_SELECT
  })

  return rows.map((row) => {
    const registeredCount = row._count.registrations
    return {
      ...toSummary(row),
      registeredCount,
      remainingQuota: remaining(row.quota, registeredCount)
    }
  })
}
