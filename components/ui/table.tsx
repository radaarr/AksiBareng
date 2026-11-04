import type { ReactNode } from 'react'
import { cx } from './cn'
import { Skeleton } from './skeleton'

export type DataTableColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  /** Judul tabel untuk pembaca layar; tidak tampil di layar. */
  caption: string
  /** Tampil menggantikan tabel saat `rows` kosong. */
  empty?: ReactNode
  loading?: boolean
  skeletonRows?: number
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  empty,
  loading = false,
  skeletonRows = 4,
  className
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>

  return (
    <div className={cx('overflow-hidden rounded-xl border border-zinc-200 bg-white', className)}>
      <table className="w-full max-sm:block">
        <caption className="sr-only">{caption}</caption>

        <thead className="border-b border-zinc-200 bg-zinc-50 max-sm:hidden">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  'px-4 py-3 text-xs font-semibold text-zinc-700',
                  column.align === 'right' ? 'text-right' : 'text-left'
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="max-sm:block max-sm:space-y-3 max-sm:p-3">
          {loading
            ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-zinc-200 last:border-b-0 max-sm:block max-sm:rounded-lg max-sm:border max-sm:p-3">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 max-sm:block max-sm:px-0 max-sm:py-1.5">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-b border-zinc-200 last:border-b-0 max-sm:block max-sm:rounded-lg max-sm:border max-sm:border-zinc-200 max-sm:p-3"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cx(
                        'px-4 py-3 align-top text-sm text-zinc-900 max-sm:block max-sm:px-0 max-sm:py-2',
                        column.align === 'right' ? 'text-right max-sm:text-left' : 'text-left'
                      )}
                    >
                      {/* Label kolom untuk tampilan kartu di ponsel; header tabel sudah disembunyikan di sana. */}
                      <span className="block text-xs font-medium text-zinc-700 sm:hidden">{column.header}</span>
                      <div className="max-sm:mt-0.5">{column.render(row)}</div>
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>

      {loading ? (
        <span role="status" className="sr-only">
          Memuat data
        </span>
      ) : null}
    </div>
  )
}
