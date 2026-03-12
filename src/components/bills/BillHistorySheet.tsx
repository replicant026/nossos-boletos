'use client'

import { useEffect, useMemo } from 'react'
import { Bill, Payment, getCategoryIcon } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/bills'

interface Props {
  bill: Bill
  allPayments: Payment[]
  onClose: () => void
}

interface BillOccurrence {
  year: number
  month: number
  refDate: string
  dueDate: Date
  payment: Payment | null
}

function getDueDate(bill: Bill, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(bill.due_day, lastDay)
  return new Date(year, month, day)
}

function billOccursInMonth(bill: Bill, year: number, month: number): boolean {
  if (!bill.active) return false

  const startDate = new Date(bill.start_date)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()

  if (year < startYear || (year === startYear && month < startMonth)) return false

  if (bill.end_date) {
    const endDate = new Date(bill.end_date)
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth()
    if (year > endYear || (year === endYear && month > endMonth)) return false
  }

  switch (bill.recurrence) {
    case 'once':    return year === startYear && month === startMonth
    case 'monthly': return true
    case 'yearly':  return month === startMonth
    default:        return false
  }
}

function getRefDate(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function computeOccurrences(bill: Bill, payments: Payment[]): BillOccurrence[] {
  const today = new Date()
  const startDate = new Date(bill.start_date)

  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()
  const endYear = today.getFullYear()
  const endMonth = today.getMonth()

  const occurrences: BillOccurrence[] = []

  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0
    const mEnd   = y === endYear   ? endMonth   : 11

    for (let m = mStart; m <= mEnd; m++) {
      if (!billOccursInMonth(bill, y, m)) continue

      const refDate = getRefDate(y, m)
      const dueDate = getDueDate(bill, y, m)
      const payment = payments.find(
        p => p.bill_id === bill.id && p.reference_date === refDate
      ) || null

      occurrences.push({ year: y, month: m, refDate, dueDate, payment })
    }
  }

  return occurrences.reverse()
}

export default function BillHistorySheet({ bill, allPayments, onClose }: Props) {
  const occurrences = useMemo(
    () => computeOccurrences(bill, allPayments),
    [bill, allPayments]
  )

  const totalPaid = occurrences.reduce((sum, occ) => {
    if (!occ.payment?.paid_at) return sum
    return sum + (occ.payment.amount_paid ?? occ.payment.month_amount ?? bill.amount)
  }, 0)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={[
          'fixed z-50 bg-white shadow-2xl flex flex-col',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]',
          // Desktop: modal centralizado grande
          'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-[760px] md:max-h-[85vh] md:rounded-2xl',
          'animate-slide-up md:animate-fade-in',
        ].join(' ')}
        role="dialog"
        aria-modal
        aria-label={`Histórico de ${bill.name}`}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-200" />
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-100 flex-shrink-0">
          <span className="text-2xl">{getCategoryIcon(bill.category)}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-surface-800 truncate text-lg leading-tight">
              {bill.name}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {bill.category} · Vence dia {bill.due_day} · {occurrences.length} ocorrência{occurrences.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {occurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-surface-400">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm">Nenhum histórico encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-50 z-10">
                <tr className="text-left text-xs text-surface-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Mês</th>
                  <th className="px-3 py-3 font-medium hidden sm:table-cell">Vencimento</th>
                  <th className="px-3 py-3 font-medium">Pago em</th>
                  <th className="px-3 py-3 font-medium text-right">Valor</th>
                  <th className="px-3 py-3 font-medium">Quem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {occurrences.map((occ) => {
                  const isPaid = !!occ.payment?.paid_at
                  const standardAmount = occ.payment?.month_amount ?? bill.amount
                  const paidAmount     = occ.payment?.amount_paid ?? standardAmount
                  const hasCustomValue = occ.payment?.month_amount != null && occ.payment.month_amount !== bill.amount

                  return (
                    <tr
                      key={occ.refDate}
                      className={
                        !isPaid
                          ? 'bg-red-50/60'
                          : hasCustomValue
                          ? 'bg-amber-50/40'
                          : ''
                      }
                    >
                      <td className="px-4 py-3 font-medium text-surface-700 whitespace-nowrap">
                        {getMonthName(occ.month).slice(0, 3)}/{occ.year}
                      </td>
                      <td className="px-3 py-3 text-surface-500 hidden sm:table-cell whitespace-nowrap">
                        {formatDate(occ.dueDate)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-brand-700">
                            {formatDate(occ.payment!.paid_at!)}
                          </span>
                        ) : (
                          <span className="text-red-500 font-medium">Não pago</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isPaid ? (
                          <div>
                            <span className="font-medium text-surface-800">
                              {formatCurrency(paidAmount)}
                            </span>
                            {hasCustomValue && (
                              <span className="block text-xs text-surface-400 line-through">
                                {formatCurrency(bill.amount)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-surface-500">
                            {formatCurrency(standardAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-surface-400 whitespace-nowrap">
                        {occ.payment?.paid_by || (isPaid ? '—' : '')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {occurrences.length > 0 && (
          <div className="flex-shrink-0 border-t border-surface-100 px-5 py-4 flex items-center justify-between bg-surface-50">
            <div>
              <p className="text-xs text-surface-400">Total pago</p>
              <p className="font-display font-bold text-xl text-brand-700">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-400">
                {occurrences.filter(o => o.payment?.paid_at).length} de {occurrences.length} pagas
              </p>
              <p className="text-xs text-surface-400">
                Valor padrão: {formatCurrency(bill.amount)}/mês
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
