import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type PagePlaceholderProps = {
  title: string
  description: string
  /** Rencana isi halaman; jangan menampilkan angka atau data karangan. */
  planned: string[]
  action?: ReactNode
}

export function PagePlaceholder({ title, description, planned, action }: PagePlaceholderProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Belum tersedia</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-zinc-900">Yang akan tampil di sini</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {planned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  )
}
