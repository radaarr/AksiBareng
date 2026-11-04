'use client'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'

export default function OrganizerEventsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      description="Daftar kegiatan gagal dimuat. Periksa koneksi Anda, lalu coba lagi."
      action={<Button onClick={reset}>Coba lagi</Button>}
    />
  )
}
