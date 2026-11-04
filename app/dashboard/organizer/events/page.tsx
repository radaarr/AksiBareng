import { ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, type DataTableColumn } from '@/components/ui/table'
import { requireSession } from '@/lib/auth/session'
import { formatEventWindow } from '@/lib/events/format'
import { listOrganizationEvents, type OrganizationEventSummary } from '@/lib/events/service'

// Semua status ditampilkan, termasuk draf — halaman ini milik organizer
// (docs/RBAC.md §3.3), berbeda dari katalog publik yang hanya status publik.
const columns: DataTableColumn<OrganizationEventSummary>[] = [
  {
    key: 'title',
    header: 'Kegiatan',
    render: (row) => (
      <a
        href={`/dashboard/organizer/events/${row.id}`}
        className="font-medium text-emerald-800 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {row.title}
      </a>
    )
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />
  },
  {
    key: 'schedule',
    header: 'Jadwal',
    render: (row) => formatEventWindow(row.startsAt, row.endsAt)
  },
  {
    key: 'quota',
    header: 'Kuota',
    align: 'right',
    render: (row) => `${row.registeredCount}/${row.quota} terisi · sisa ${row.remainingQuota}`
  }
]

export default async function OrganizerEventsPage() {
  const actor = await requireSession()

  if (!actor.organizationId) {
    return (
      <div className="flex max-w-2xl flex-col gap-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kegiatan</h1>
        <Card>
          <CardHeader>
            <CardTitle>Organisasi belum ada</CardTitle>
            <CardDescription>
              Kegiatan hanya bisa dibuat setelah akun Anda memiliki organisasi terverifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink href="/dashboard/organizer" variant="secondary">
              Kembali ke ringkasan
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    )
  }

  const events = await listOrganizationEvents(actor.organizationId)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Kegiatan</h1>
          <p className="mt-1 text-sm text-zinc-700">Semua kegiatan organisasi Anda, termasuk yang masih draf.</p>
        </div>
        <ButtonLink href="/dashboard/organizer/events/new">Buat kegiatan</ButtonLink>
      </div>

      <DataTable
        caption="Daftar kegiatan organisasi Anda"
        columns={columns}
        rows={events}
        getRowKey={(row) => row.id}
        empty={
          <EmptyState
            title="Belum ada kegiatan."
            description="Buat kegiatan pertama untuk mulai menerima pendaftaran relawan."
            action={<ButtonLink href="/dashboard/organizer/events/new">Buat kegiatan pertama</ButtonLink>}
          />
        }
      />
    </div>
  )
}
