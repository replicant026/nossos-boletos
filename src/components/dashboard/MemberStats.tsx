'use client'

import { useState } from 'react'
import { BillWithStatus } from '@/lib/types'
import { formatCurrency } from '@/lib/bills'

interface Props {
  bills: BillWithStatus[]
  members: string[]
}

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 55%)`
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const bg = nameToColor(name)
  const cls = size === 'sm'
    ? 'w-7 h-7 text-xs'
    : 'w-9 h-9 text-sm'

  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

export default function MemberStats({ bills, members }: Props) {
  const [open, setOpen] = useState(true)

  const paidBills = bills.filter(b => b.status === 'paid' && b.payment?.paid_at)
  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const totalBillsAmount = bills.reduce((s, b) => s + (b.payment?.month_amount ?? b.amount), 0)
  const totalPaidAmount = paidBills.reduce(
    (s, b) => s + (b.payment?.amount_paid ?? b.payment?.month_amount ?? b.amount),
    0
  )

  // Por membro: R$ pago + quantidade
  const byMember: Record<string, { amount: number; count: number }> = {}
  for (const m of members) {
    byMember[m] = { amount: 0, count: 0 }
  }
  for (const bill of paidBills) {
    const who = bill.payment?.paid_by
    if (who && byMember[who] !== undefined) {
      byMember[who].amount += bill.payment?.amount_paid ?? bill.payment?.month_amount ?? bill.amount
      byMember[who].count += 1
    }
  }

  // Contas pagas sem payer registrado
  const noBuyerBills = paidBills.filter(b => !b.payment?.paid_by)

  // Divisão justa: total de todas as contas ÷ nº de membros
  const fairShare = members.length > 0 ? totalBillsAmount / members.length : 0

  // Membro com maior contribuição
  const topMember = members.reduce((top, m) =>
    byMember[m].amount > byMember[top].amount ? m : top
  , members[0])

  const hasAnyPayment = totalPaidAmount > 0

  if (members.length === 0) return null

  return (
    <div className="mb-4 border border-surface-100 rounded-2xl overflow-hidden bg-white">
      {/* Header colapsável */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-surface-700 text-sm">👥 Contribuições do mês</span>
          {hasAnyPayment && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-500">
              {formatCurrency(totalPaidAmount)} pagos
            </span>
          )}
        </div>
        <span
          className={`text-lg leading-none transition-transform duration-300 text-surface-400 ${open ? 'rotate-180' : ''}`}
          style={{ display: 'inline-block' }}
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4">

          {/* Lista por membro */}
          <div className="space-y-3">
            {members.map(member => {
              const { amount, count } = byMember[member]
              const pct = totalPaidAmount > 0 ? (amount / totalPaidAmount) * 100 : 0
              const balance = amount - fairShare
              const isTop = member === topMember && hasAnyPayment && amount > 0

              return (
                <div key={member}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <Avatar name={member} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-surface-800 truncate">{member}</span>
                        {isTop && <span title="Maior contribuidor do mês" className="text-sm">🏆</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-surface-400">
                          {count > 0 ? `${count} conta${count > 1 ? 's' : ''}` : 'nenhuma conta'}
                        </span>
                        {count > 0 && (
                          <span
                            className={`text-xs font-medium ${
                              balance >= 0 ? 'text-brand-600' : 'text-red-500'
                            }`}
                            title={`Cota ideal: ${formatCurrency(fairShare)}`}
                          >
                            {balance >= 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)} vs cota
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold font-display text-surface-800">
                        {formatCurrency(amount)}
                      </p>
                      {totalPaidAmount > 0 && (
                        <p className="text-xs text-surface-400">{pct.toFixed(0)}%</p>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden ml-12">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: nameToColor(member),
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Divisão justa */}
          {totalBillsAmount > 0 && (
            <div className="bg-surface-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-surface-400 mb-1.5">
                Divisão igualitária · {formatCurrency(totalBillsAmount)} total ÷ {members.length} membros
              </p>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const paid = byMember[m].amount
                  const balance = paid - fairShare
                  return (
                    <div key={m} className="flex items-center gap-1.5">
                      <Avatar name={m} size="sm" />
                      <div>
                        <span className="text-xs font-medium text-surface-700">{m.split(' ')[0]}</span>
                        <span className={`text-xs ml-1 ${balance >= 0 ? 'text-brand-600' : 'text-red-500'}`}>
                          {balance >= 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Contas sem payer */}
          {noBuyerBills.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-xs font-medium text-amber-700 mb-1">
                ⚠️ {noBuyerBills.length} conta{noBuyerBills.length > 1 ? 's' : ''} paga{noBuyerBills.length > 1 ? 's' : ''} sem responsável registrado
              </p>
              <p className="text-xs text-amber-600">
                {noBuyerBills.map(b => b.name).join(', ')}
              </p>
            </div>
          )}

          {/* Estado vazio */}
          {!hasAnyPayment && unpaidBills.length > 0 && (
            <p className="text-xs text-surface-400 text-center py-2">
              Nenhum pagamento registrado ainda neste mês.
            </p>
          )}

        </div>
      )}
    </div>
  )
}
