'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase-context'
import { Bill, Payment, BillWithStatus } from '@/lib/types'
import {
  computeBillStatuses,
  formatCurrency,
  getMonthName,
  getRefDate,
} from '@/lib/bills'

interface Props {
  householdId: string
  bills: Bill[]
  members: string[]
  onSelectMonth: (year: number, month: number) => void
}

interface MonthSummary {
  year: number
  month: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  total: number
  bills: BillWithStatus[]
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getBarColor(summary: MonthSummary): string {
  if (summary.totalOverdue > 0) return 'bg-red-400'
  if (summary.totalPending > 0) return 'bg-amber-400'
  return 'bg-emerald-400'
}

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 55%)`
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: nameToColor(name) }}
    >
      {initials}
    </div>
  )
}

export default function TabHistorico({ householdId, bills, members, onSelectMonth }: Props) {
  const supabase = useSupabase()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set())

  const fetchYearPayments = useCallback(async () => {
    setLoading(true)

    const refDates: string[] = []
    for (let m = 0; m < 12; m++) {
      refDates.push(getRefDate(selectedYear, m))
    }

    const { data } = await supabase
      .from('payments')
      .select('*')
      .in('reference_date', refDates)

    setPayments(data || [])
    setLoading(false)
  }, [selectedYear])

  useEffect(() => {
    fetchYearPayments()
  }, [fetchYearPayments])

  const monthlySummaries: MonthSummary[] = []

  for (let m = 0; m < 12; m++) {
    const billStatuses = computeBillStatuses(bills, payments, selectedYear, m)
    const totalPaid = billStatuses
      .filter(b => b.status === 'paid')
      .reduce((s, b) => s + (b.payment?.amount_paid ?? b.amount), 0)
    const totalOverdue = billStatuses
      .filter(b => b.status === 'overdue')
      .reduce((s, b) => s + b.amount, 0)
    const totalPending = billStatuses
      .filter(b => b.status === 'pending' || b.status === 'due_soon')
      .reduce((s, b) => s + b.amount, 0)
    const total = billStatuses.reduce((s, b) => s + b.amount, 0)

    monthlySummaries.push({
      year: selectedYear,
      month: m,
      totalPaid,
      totalPending,
      totalOverdue,
      total,
      bills: billStatuses,
    })
  }

  const totalPaidYear = monthlySummaries.reduce((s, m) => s + m.totalPaid, 0)
  const monthWithMax = monthlySummaries.reduce((max, m) =>
    m.totalPaid > max.totalPaid ? m : max, monthlySummaries[0])
  const activeMonths = monthlySummaries.filter(m => m.total > 0)
  const avgMonthly = activeMonths.length > 0
    ? totalPaidYear / activeMonths.length
    : 0

  const maxValue = Math.max(...monthlySummaries.map(m => m.total), 1)

  // ── Stats por membro ──
  const allPaidBills = monthlySummaries.flatMap(s =>
    s.bills
      .filter(b => b.status === 'paid')
      .map(b => ({ ...b, month: s.month }))
  )
  const totalBillsYear = monthlySummaries.reduce((s, m) => s + m.total, 0)
  const fairShare = members.length > 0 ? totalBillsYear / members.length : 0

  const byMember: Record<string, { amount: number; count: number; bestMonth: number; bestMonthAmount: number }> = {}
  for (const m of members) {
    byMember[m] = { amount: 0, count: 0, bestMonth: -1, bestMonthAmount: 0 }
  }
  const byMemberMonth: Record<string, Record<number, number>> = {}
  for (const m of members) byMemberMonth[m] = {}

  for (const bill of allPaidBills) {
    const who = bill.payment?.paid_by
    if (who && byMember[who] !== undefined) {
      const paid = bill.payment?.amount_paid ?? bill.amount
      byMember[who].amount += paid
      byMember[who].count += 1
      byMemberMonth[who][bill.month] = (byMemberMonth[who][bill.month] ?? 0) + paid
    }
  }

  for (const m of members) {
    const monthlyAmounts = byMemberMonth[m]
    let best = -1, bestAmt = 0
    for (const [mo, amt] of Object.entries(monthlyAmounts)) {
      if (amt > bestAmt) { bestAmt = amt; best = Number(mo) }
    }
    byMember[m].bestMonth = best
    byMember[m].bestMonthAmount = bestAmt
  }

  const topMember = members.length > 0
    ? members.reduce((top, m) => byMember[m].amount > byMember[top].amount ? m : top, members[0])
    : null
  const hasAnyMemberPayment = members.some(m => byMember[m].amount > 0)

  function toggleMonth(monthIndex: number) {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(monthIndex)) {
        next.delete(monthIndex)
      } else {
        next.add(monthIndex)
      }
      return next
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setSelectedYear(y => y - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 text-surface-600 font-bold text-lg transition-colors"
        >
          ←
        </button>
        <span className="font-display text-xl font-bold text-surface-800 min-w-[4rem] text-center">
          {selectedYear}
        </span>
        <button
          onClick={() => setSelectedYear(y => y + 1)}
          disabled={selectedYear >= now.getFullYear()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 text-surface-600 font-bold text-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop: stats + gráfico lado a lado */}
          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 mb-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 mb-6 lg:mb-0">
              <div className="bg-surface-800 rounded-2xl p-4">
                <p className="text-xs text-surface-300 mb-1">Total no ano</p>
                <p className="font-display text-lg font-bold text-white leading-tight">
                  {formatCurrency(totalPaidYear)}
                </p>
              </div>
              <div className="bg-brand-50 rounded-2xl p-4">
                <p className="text-xs text-brand-500 mb-1">Mês mais caro</p>
                <p className="font-display text-lg font-bold text-brand-700 leading-tight">
                  {monthWithMax.totalPaid > 0 ? MONTH_SHORT[monthWithMax.month] : '—'}
                </p>
                {monthWithMax.totalPaid > 0 && (
                  <p className="text-xs text-brand-500 mt-0.5">
                    {formatCurrency(monthWithMax.totalPaid)}
                  </p>
                )}
              </div>
              <div className="bg-surface-50 rounded-2xl p-4">
                <p className="text-xs text-surface-400 mb-1">Média mensal</p>
                <p className="font-display text-lg font-bold text-surface-700 leading-tight">
                  {formatCurrency(avgMonthly)}
                </p>
              </div>
            </div>

            {/* Gráfico de barras */}
            <div className="bg-white border border-surface-100 rounded-2xl p-4">
              <h3 className="text-xs font-medium text-surface-400 mb-4 uppercase tracking-wide">
                Gastos mensais {selectedYear}
              </h3>
              <div className="flex items-end gap-1 h-40 lg:h-52">
                {monthlySummaries.map((summary, i) => {
                  const heightPct =
                    summary.total > 0
                      ? Math.max((summary.total / maxValue) * 100, 6)
                      : 0
                  const barColor = getBarColor(summary)
                  const isCurrentMonth =
                    summary.year === now.getFullYear() &&
                    summary.month === now.getMonth()

                  return (
                    <button
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group"
                      onClick={() => onSelectMonth(summary.year, summary.month)}
                      title={`${getMonthName(summary.month)}: ${formatCurrency(summary.total)}`}
                    >
                      <div className="w-full flex flex-col justify-end h-36 lg:h-48">
                        {summary.total > 0 ? (
                          <div
                            className={`w-full ${barColor} rounded-t-sm group-hover:opacity-75 transition-opacity ${
                              isCurrentMonth ? 'ring-2 ring-offset-1 ring-brand-400' : ''
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        ) : (
                          <div className="w-full h-1 bg-surface-100 rounded" />
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-medium ${
                          isCurrentMonth ? 'text-brand-600' : 'text-surface-400'
                        }`}
                      >
                        {MONTH_SHORT[i]}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                  <span className="text-[10px] text-surface-400">Tudo pago</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span className="text-[10px] text-surface-400">Parcial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                  <span className="text-[10px] text-surface-400">Com atraso</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Contribuições por membro no ano ── */}
          {members.length > 1 && (
            <div className="bg-white border border-surface-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-700">
                  👥 Contribuições por membro — {selectedYear}
                </h3>
                {hasAnyMemberPayment && (
                  <span className="text-xs text-surface-400">
                    {formatCurrency(totalBillsYear)} total · cota {formatCurrency(fairShare)}/pessoa
                  </span>
                )}
              </div>

              {!hasAnyMemberPayment ? (
                <p className="text-xs text-surface-400 text-center py-4">
                  Nenhum pagamento registrado com responsável neste ano.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {members.map(member => {
                    const { amount, count, bestMonth } = byMember[member]
                    const pct = totalPaidYear > 0 ? (amount / totalPaidYear) * 100 : 0
                    const balance = amount - fairShare
                    const isTop = member === topMember && amount > 0

                    return (
                      <div key={member} className="bg-surface-50 rounded-xl p-3.5">
                        <div className="flex items-center gap-2.5 mb-3">
                          <Avatar name={member} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-surface-800 truncate">{member}</span>
                              {isTop && <span title="Maior contribuidor do ano" className="text-sm">🏆</span>}
                            </div>
                            <span className="text-xs text-surface-400">
                              {count > 0 ? `${count} conta${count > 1 ? 's' : ''}` : 'nenhuma conta'}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold font-display text-surface-800">
                              {formatCurrency(amount)}
                            </p>
                            <p className="text-xs text-surface-400">{pct.toFixed(0)}%</p>
                          </div>
                        </div>

                        {/* Barra */}
                        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: nameToColor(member) }}
                          />
                        </div>

                        {/* Saldo vs cota + mês destaque */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-medium ${balance >= 0 ? 'text-brand-600' : 'text-warn-600'}`}
                            title={`Cota igualitária: ${formatCurrency(fairShare)}`}
                          >
                            {balance >= 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)} vs cota
                          </span>
                          {bestMonth >= 0 && (
                            <span className="text-xs text-surface-400">
                              melhor: {MONTH_SHORT[bestMonth]}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Lista de meses — 2 colunas no desktop */}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {monthlySummaries.map((summary, i) => {
              const isExpanded = expandedMonths.has(i)
              const paidCount = summary.bills.filter(b => b.status === 'paid').length
              const totalCount = summary.bills.length
              const pct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0
              const hasData = summary.total > 0

              return (
                <div
                  key={i}
                  className="bg-white border border-surface-100 rounded-2xl overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-3 p-4 hover:bg-surface-50 transition-colors text-left"
                    onClick={() => hasData && toggleMonth(i)}
                    disabled={!hasData}
                  >
                    <div className="w-12 flex-shrink-0">
                      <p className="text-sm font-bold font-display text-surface-800">
                        {MONTH_SHORT[i]}
                      </p>
                      <p className="text-xs text-surface-400">{selectedYear}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      {hasData ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-surface-500">
                              {paidCount} de {totalCount} pagas
                            </span>
                            <span className="text-xs font-medium text-surface-600">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct === 100 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-surface-300">Sem contas neste mês</p>
                      )}
                    </div>

                    {hasData && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold font-display text-surface-800">
                          {formatCurrency(summary.totalPaid)}
                        </p>
                        {summary.totalPending + summary.totalOverdue > 0 && (
                          <p className="text-xs text-surface-400">
                            +{formatCurrency(summary.totalPending + summary.totalOverdue)} pendente
                          </p>
                        )}
                      </div>
                    )}

                    {hasData && (
                      <span
                        className={`text-surface-300 text-xs transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-surface-50 divide-y divide-surface-50">
                      {summary.bills.length === 0 ? (
                        <p className="text-xs text-surface-400 px-4 py-3">Nenhuma conta.</p>
                      ) : (
                        summary.bills.map(bill => (
                          <div key={bill.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div
                              className={`w-1.5 h-6 rounded-full flex-shrink-0 ${
                                bill.status === 'paid'
                                  ? 'bg-emerald-400'
                                  : bill.status === 'overdue'
                                  ? 'bg-red-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-surface-700 truncate">{bill.name}</p>
                              <p className="text-xs text-surface-400">{bill.category}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p
                                className={`text-sm font-medium ${
                                  bill.status === 'paid' ? 'text-emerald-600' : 'text-surface-600'
                                }`}
                              >
                                {formatCurrency(
                                  bill.status === 'paid'
                                    ? (bill.payment?.amount_paid ?? bill.amount)
                                    : bill.amount
                                )}
                              </p>
                              {bill.status === 'paid' && bill.payment?.paid_by && (
                                <p className="text-[10px] text-surface-400">{bill.payment.paid_by}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div className="px-4 py-3">
                        <button
                          onClick={() => onSelectMonth(summary.year, summary.month)}
                          className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
                        >
                          Ver mês completo →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
