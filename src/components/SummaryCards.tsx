'use client'

import { BillWithStatus } from '@/lib/types'
import { formatCurrency } from '@/lib/bills'

interface Props {
  bills: BillWithStatus[]
}

export default function SummaryCards({ bills }: Props) {
  const total = bills.reduce((s, b) => s + b.amount, 0)
  const paid = bills.filter(b => b.status === 'paid')
  const totalPaid = paid.reduce((s, b) => s + (b.payment?.amount_paid ?? b.amount), 0)
  const overdue = bills.filter(b => b.status === 'overdue')
  const totalOverdue = overdue.reduce((s, b) => s + b.amount, 0)
  const pending = bills.filter(b => b.status !== 'paid')
  const totalPending = pending.reduce((s, b) => s + b.amount, 0)

  const cards = [
    { label: 'Total do Mês', value: formatCurrency(total), color: 'bg-surface-800', textColor: 'text-white', subColor: 'text-surface-300' },
    { label: 'Pago', value: formatCurrency(totalPaid), count: `${paid.length} de ${bills.length}`, color: 'bg-brand-50', textColor: 'text-brand-700', subColor: 'text-brand-500' },
    { label: 'Pendente', value: formatCurrency(totalPending), count: `${pending.length} conta(s)`, color: 'bg-warn-50', textColor: 'text-warn-600', subColor: 'text-warn-500' },
    { label: 'Atrasado', value: formatCurrency(totalOverdue), count: overdue.length > 0 ? `${overdue.length} conta(s)` : 'Nenhuma', color: overdue.length > 0 ? 'bg-danger-50' : 'bg-surface-50', textColor: overdue.length > 0 ? 'text-danger-600' : 'text-surface-500', subColor: overdue.length > 0 ? 'text-danger-400' : 'text-surface-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`${card.color} rounded-2xl p-4 animate-fade-in`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <p className={`text-xs font-medium ${card.subColor} mb-1`}>{card.label}</p>
          <p className={`font-display text-lg font-700 ${card.textColor}`}>{card.value}</p>
          {'count' in card && card.count && (
            <p className={`text-xs ${card.subColor} mt-0.5`}>{card.count}</p>
          )}
        </div>
      ))}
    </div>
  )
}
