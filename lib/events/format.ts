// Format waktu tampilan: zona Asia/Jakarta dan locale id-ID (AGENTS.md §Waktu).
// API mengirim ISO-8601; hanya lapisan tampilan yang mengubahnya.

const TIME_ZONE = 'Asia/Jakarta'

const DAY = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: TIME_ZONE })
const TIME = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE
})
const DATE_TIME = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE
})

export function formatDateTime(value: string | Date): string {
  return `${DATE_TIME.format(new Date(value))} WIB`
}

/** Satu hari → "20 Nov 2026, 09.00–12.00 WIB"; lintas hari → rentang tanggal. */
export function formatEventWindow(startsAt: string | Date, endsAt: string | Date): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  if (DAY.format(start) === DAY.format(end)) {
    return `${DAY.format(start)}, ${TIME.format(start)}–${TIME.format(end)} WIB`
  }

  return `${DAY.format(start)} – ${DAY.format(end)} WIB`
}
