import type { CampaignStatus, EventStatus, UserRole } from '@prisma/client'

// Kontrak akses: docs/RBAC.md §2–§3, nama action: docs/RBAC.md §3.5.
// Semua fungsi di file ini murni — tanpa database dan tanpa next/server — supaya
// seluruh matriks dapat diuji sebagai fungsi biasa. Precondition bisnis (kuota,
// periode pendaftaran, stok, legalitas transisi) TIDAK dicek di sini; itu tugas
// lapisan domain/workflow.

export type AccessActor = {
  id: string
  role: UserRole
  /** Organisasi yang dimiliki aktor (docs/RBAC.md §5); null bila belum punya. */
  organizationId: string | null
}

/** Bentuk minimal yang dibutuhkan untuk memutuskan akses pada kegiatan. */
export type EventResource = {
  organizationId: string
  status: EventStatus
}

/** Bentuk minimal untuk memutuskan akses pada kampanye. */
export type CampaignResource = {
  organizationId: string
  status: CampaignStatus
}

/** Registrasi/kontribusi: hanya kepemilikan yang menentukan. */
export type RegistrationResource = {
  userId: string
}

export type TaskResource = {
  eventOrganizationId: string
  /** Terisi bila relawan sudah ditempatkan pada posisi ini. */
  assignedUserId?: string | null
}

export type Action =
  | 'event:create'
  | 'event:read'
  | 'event:list_own'
  | 'event:update'
  | 'event:publish'
  | 'event:close_registration'
  | 'event:cancel'
  | 'registration:create'
  | 'registration:read_own'
  | 'registration:cancel_own'
  | 'registration:list'
  | 'task:create'
  | 'task:update'
  | 'task:assign'
  | 'task:unassign'
  | 'task:read'
  | 'attendance:create_session'
  | 'attendance:close_session'
  | 'attendance:issue_token'
  | 'attendance:scan'
  | 'contribution:read_own'
  | 'contribution:list'
  | 'contribution:verify'
  | 'contribution:revoke'
  | 'campaign:create'
  | 'campaign:read_own'
  | 'campaign:update'
  | 'campaign:budget'
  | 'campaign:submit'
  | 'campaign:review'
  | 'campaign:pause'
  | 'organization:review'

/** Resource minimal per action; `void` berarti cukup peran saja. */
export type ActionResource = {
  'event:create': void
  'event:read': EventResource
  'event:list_own': void
  'event:update': EventResource
  'event:publish': EventResource
  'event:close_registration': EventResource
  'event:cancel': EventResource
  'registration:create': EventResource
  'registration:read_own': RegistrationResource
  'registration:cancel_own': RegistrationResource
  'registration:list': EventResource
  'task:create': EventResource
  'task:update': EventResource
  'task:assign': EventResource
  'task:unassign': EventResource
  'task:read': TaskResource
  'attendance:create_session': EventResource
  'attendance:close_session': EventResource
  'attendance:issue_token': RegistrationResource
  'attendance:scan': EventResource
  'contribution:read_own': RegistrationResource
  'contribution:list': EventResource
  'contribution:verify': EventResource
  'contribution:revoke': void
  'campaign:create': void
  'campaign:read_own': void
  'campaign:update': CampaignResource
  'campaign:budget': CampaignResource
  'campaign:submit': CampaignResource
  'campaign:review': void
  'campaign:pause': void
  'organization:review': void
}

/** Status kegiatan yang boleh dilihat publik dan menerima pendaftaran (EVT-04, EVT-06). */
function isPublicEvent(status: EventStatus): boolean {
  return status === 'PUBLISHED' || status === 'ONGOING'
}

function ownsOrganization(actor: AccessActor, organizationId: string): boolean {
  return (
    actor.role === 'ORGANIZER' && actor.organizationId !== null && actor.organizationId === organizationId
  )
}

// Deny by default: action tanpa entri di sini tidak dapat dipanggil sama sekali
// (union `Action` membuat penambahan action tanpa aturan gagal saat compile).
const RULES: { [A in Action]: (actor: AccessActor, resource: ActionResource[A]) => boolean } = {
  'event:create': (actor) => actor.role === 'ORGANIZER' && actor.organizationId !== null,
  'event:read': (actor, event) =>
    isPublicEvent(event.status) || ownsOrganization(actor, event.organizationId) || actor.role === 'ADMIN',
  'event:list_own': (actor) => actor.role === 'ORGANIZER' && actor.organizationId !== null,
  'event:update': (actor, event) => ownsOrganization(actor, event.organizationId),
  'event:publish': (actor, event) => ownsOrganization(actor, event.organizationId),
  'event:close_registration': (actor, event) => ownsOrganization(actor, event.organizationId),
  'event:cancel': (actor, event) => ownsOrganization(actor, event.organizationId),

  // Satu akun satu peran utama: organizer/admin tidak memakai akunnya untuk mendaftar (docs/RBAC.md §1).
  'registration:create': (actor, event) => actor.role === 'VOLUNTEER' && isPublicEvent(event.status),
  'registration:read_own': (actor, registration) => registration.userId === actor.id,
  'registration:cancel_own': (actor, registration) => registration.userId === actor.id,
  'registration:list': (actor, event) => ownsOrganization(actor, event.organizationId),

  'task:create': (actor, event) => ownsOrganization(actor, event.organizationId),
  'task:update': (actor, event) => ownsOrganization(actor, event.organizationId),
  'task:assign': (actor, event) => ownsOrganization(actor, event.organizationId),
  'task:unassign': (actor, event) => ownsOrganization(actor, event.organizationId),
  'task:read': (actor, task) =>
    ownsOrganization(actor, task.eventOrganizationId) ||
    (task.assignedUserId !== null && task.assignedUserId !== undefined && task.assignedUserId === actor.id),

  'attendance:create_session': (actor, event) => ownsOrganization(actor, event.organizationId),
  'attendance:close_session': (actor, event) => ownsOrganization(actor, event.organizationId),
  'attendance:issue_token': (actor, registration) => registration.userId === actor.id,
  'attendance:scan': (actor, event) => ownsOrganization(actor, event.organizationId),

  'contribution:read_own': (actor, registration) => registration.userId === actor.id,
  'contribution:list': (actor, event) => ownsOrganization(actor, event.organizationId),
  'contribution:verify': (actor, event) => ownsOrganization(actor, event.organizationId),
  'contribution:revoke': (actor) => actor.role === 'ADMIN',

  'campaign:create': (actor) => actor.role === 'ORGANIZER' && actor.organizationId !== null,
  'campaign:read_own': (actor) => actor.role === 'ORGANIZER' && actor.organizationId !== null,
  // Status kampanye (DRAFT/REJECTED vs ACTIVE) adalah precondition bisnis;
  // diperiksa route handler agar dapat menjawab 409, bukan di matriks akses.
  'campaign:update': (actor, campaign) => ownsOrganization(actor, campaign.organizationId),
  'campaign:budget': (actor, campaign) => ownsOrganization(actor, campaign.organizationId),  'campaign:submit': (actor, campaign) =>
    ownsOrganization(actor, campaign.organizationId),

  'campaign:review': (actor) => actor.role === 'ADMIN',
  'campaign:pause': (actor) => actor.role === 'ADMIN',
  'organization:review': (actor) => actor.role === 'ADMIN'
}

/** Action yang tidak membawa resource: penolakannya selalu `403`, bukan `404`. */
const ROLE_ONLY_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'event:create',
  'event:list_own',
  'contribution:revoke',
  'campaign:create',
  'campaign:read_own',
  'campaign:review',
  'campaign:pause',
  'organization:review'
])

/** Action pada kegiatan yang keberadaannya sudah publik bila statusnya terbuka. */
const PUBLIC_EXISTENCE_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'event:read',
  'event:update',
  'event:publish',
  'event:close_registration',
  'event:cancel'
])

function hasEventStatus(resource: unknown): resource is EventResource {
  return typeof resource === 'object' && resource !== null && 'status' in resource
}

function hasCampaignStatus(resource: unknown): resource is CampaignResource {
  return typeof resource === 'object' && resource !== null && 'status' in resource
}

/** Status kampanye yang sudah tampil publik (docs/API.md §5). */
function isPublicCampaign(status: CampaignStatus): boolean {
  return status === 'ACTIVE' || status === 'CLOSED' || status === 'COMPLETED'
}

// docs/RBAC.md §5: resource privat → 404 agar keberadaan data tidak bocor;
// 403 hanya bila keberadaan resource memang sudah publik atau yang ditolak murni peran.
function denialCodeFor(action: Action, resource: unknown): 'FORBIDDEN' | 'NOT_FOUND' {
  if (ROLE_ONLY_ACTIONS.has(action)) return 'FORBIDDEN'
  if (PUBLIC_EXISTENCE_ACTIONS.has(action) && hasEventStatus(resource) && isPublicEvent(resource.status)) {
    return 'FORBIDDEN'
  }
  if (action.startsWith('campaign:') && hasCampaignStatus(resource) && isPublicCampaign(resource.status)) {
    return 'FORBIDDEN'
  }
  return 'NOT_FOUND'
}

export function can<A extends Action>(actor: AccessActor, action: A, resource: ActionResource[A]): boolean {
  return RULES[action](actor, resource)
}

export class AccessDeniedError extends Error {
  constructor(
    readonly status: 403 | 404,
    readonly code: 'FORBIDDEN' | 'NOT_FOUND'
  ) {
    // Pesan tidak boleh memuat nama/id resource (docs/RBAC.md §7).
    super(code === 'FORBIDDEN' ? 'Anda tidak memiliki akses ke data ini.' : 'Data tidak ditemukan.')
    this.name = 'AccessDeniedError'
  }
}

/**
 * Lempar `AccessDeniedError` bila aksi tidak diizinkan.
 * Pemanggil wajib sudah memakai `requireActor()`; aktor anonim ditolak di sana (401).
 */
export function assertCan<A extends Action>(
  actor: AccessActor,
  action: A,
  resource: ActionResource[A]
): void {
  if (can(actor, action, resource)) return

  const code = denialCodeFor(action, resource)
  throw new AccessDeniedError(code === 'FORBIDDEN' ? 403 : 404, code)
}
