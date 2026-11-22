import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { shellCard } from './Shell'

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[]
  rows: T[]
  empty?: string
}) {
  const { t } = useTranslation()
  if (!rows.length) {
    return (
      <div className={`${shellCard} px-6 py-16 text-center text-sm text-slate-500`}>
        {empty || t('common.empty')}
      </div>
    )
  }
  return (
    <div className={`${shellCard} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-neutral-500">
              {columns.map((column) => (
                <th key={column.key} className={`text-start font-medium px-5 py-3 ${column.className ?? ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-3.5 align-middle ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Cell({ title, detail }: { title: ReactNode; detail?: ReactNode }) {
  return (
    <div>
      <strong className="block text-neutral-900 font-medium">{title}</strong>
      {detail ? <small className="block text-neutral-500 text-xs mt-0.5">{detail}</small> : null}
    </div>
  )
}
