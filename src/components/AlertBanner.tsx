'use client'

import { BillWithStatus } from '@/lib/types'

interface Props {
  bills: BillWithStatus[]
}

export default function AlertBanner({ bills }: Props) {
  const overdue = bills.filter(b => b.status === 'overdue')
  const dueSoon = bills.filter(b => b.status === 'due_soon')

  if (overdue.length === 0 && dueSoon.length === 0) return null

  return (
    <div className="space-y-2 mb-6 animate-fade-in">
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 bg-danger-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-lg">🚨</span>
          <p className="text-sm text-danger-600 font-medium">
            {overdue.length === 1
              ? `1 conta atrasada: ${overdue[0].name}`
              : `${overdue.length} contas atrasadas!`}
          </p>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-center gap-3 bg-warn-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-lg">⏰</span>
          <p className="text-sm text-warn-600 font-medium">
            {dueSoon.length === 1
              ? `${dueSoon[0].name} vence em ${dueSoon[0].days_until_due} dia(s)`
              : `${dueSoon.length} contas vencem nos próximos 3 dias`}
          </p>
        </div>
      )}
    </div>
  )
}
