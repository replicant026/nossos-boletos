'use client'

import { useState, useRef, useCallback } from 'react'
import { BillWithStatus, getCategoryIcon } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/bills'

interface Props {
  bill: BillWithStatus
  onPay: (bill: BillWithStatus) => void
  onUnpay: (bill: BillWithStatus) => void
  onEdit: (bill: BillWithStatus) => void
  onDelete: (bill: BillWithStatus) => void
  onSetMonthAmount: (bill: BillWithStatus, amount: number | null) => Promise<void>
  onHistory: (bill: BillWithStatus) => void
}

const STATUS_BORDER: Record<BillWithStatus['status'], string> = {
  overdue:  'bg-red-500',
  due_soon: 'bg-amber-400',
  paid:     'bg-brand-500',
  pending:  'bg-surface-300',
}

const SWIPE_THRESHOLD = 60
const SWIPE_MAX      = 120

export default function SwipeableBillCard({
  bill,
  onPay,
  onUnpay,
  onEdit,
  onDelete,
  onSetMonthAmount,
  onHistory,
}: Props) {
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput]     = useState('')
  const [saving, setSaving]               = useState(false)

  const displayAmount = bill.payment?.month_amount ?? bill.amount
  const hasCustomAmount = bill.payment?.month_amount != null

  async function handleSaveAmount() {
    setSaving(true)
    const val = amountInput ? parseFloat(amountInput) : null
    await onSetMonthAmount(bill, val)
    setEditingAmount(false)
    setAmountInput('')
    setSaving(false)
  }

  const [translateX, setTranslateX]     = useState(0)
  const [dragging, setDragging]         = useState(false)
  const [actionsOpen, setActionsOpen]   = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current   = e.touches[0].clientX
    touchStartY.current   = e.touches[0].clientY
    isHorizontal.current  = null
    setDragging(true)
    setActionsOpen(false)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      isHorizontal.current = Math.abs(dx) > Math.abs(dy)
    }

    if (!isHorizontal.current) return

    e.preventDefault()

    const clamped = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx))
    setTranslateX(clamped)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setDragging(false)

    if (translateX >= SWIPE_THRESHOLD) {
      if (bill.status === 'paid') {
        onUnpay(bill)
      } else {
        onPay(bill)
      }
      setTranslateX(0)
    } else if (translateX <= -SWIPE_THRESHOLD) {
      setTranslateX(-SWIPE_MAX)
      setActionsOpen(true)
    } else {
      setTranslateX(0)
    }
  }, [translateX, bill, onPay, onUnpay])

  function closeActions() {
    setTranslateX(0)
    setActionsOpen(false)
  }

  const swipeRightProgress = Math.min(1, Math.max(0, translateX / SWIPE_THRESHOLD))
  const swipeLeftProgress  = Math.min(1, Math.max(0, -translateX / SWIPE_THRESHOLD))

  return (
    <div className="relative overflow-hidden rounded-2xl select-none">

      <div
        className={`absolute inset-0 flex items-center pl-5 rounded-2xl transition-colors ${
          bill.status === 'paid' ? 'bg-surface-100' : 'bg-brand-50'
        }`}
        style={{ opacity: swipeRightProgress }}
        aria-hidden
      >
        <span className="text-xl">
          {bill.status === 'paid' ? '↩' : '✓'}
        </span>
        <span className={`ml-2 text-sm font-medium ${
          bill.status === 'paid' ? 'text-surface-500' : 'text-brand-700'
        }`}>
          {bill.status === 'paid' ? 'Desmarcar' : 'Pagar'}
        </span>
      </div>

      <div
        className="absolute inset-0 flex items-center justify-end pr-5 bg-red-50 rounded-2xl"
        style={{ opacity: swipeLeftProgress }}
        aria-hidden
      >
        <span className="text-xl">⋯</span>
        <span className="ml-2 text-sm font-medium text-red-600">Ações</span>
      </div>

      <div
        className={`relative bg-white border border-surface-100 rounded-2xl overflow-hidden ${
          dragging ? '' : 'transition-transform duration-200 ease-out'
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex">
          <div className={`w-1 flex-shrink-0 ${STATUS_BORDER[bill.status]}`} />

          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">

              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {getCategoryIcon(bill.category)}
                </span>
                <div className="min-w-0">
                  <button
                    onClick={() => onHistory(bill)}
                    className="font-semibold text-surface-800 truncate text-left hover:text-brand-700 transition-colors leading-snug"
                  >
                    {bill.name}
                  </button>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-surface-400">{bill.category}</span>
                    <span className="text-surface-200 text-xs">•</span>
                    <span className="text-xs text-surface-400">
                      Vence dia {bill.due_day}
                    </span>
                    {bill.status === 'overdue' && bill.overdue_month && (
                      <span className="text-xs text-red-500 font-medium">
                        · {getMonthName(bill.overdue_month.month)} atrasado
                      </span>
                    )}
                    {bill.status === 'overdue' && !bill.overdue_month && (
                      <span className="text-xs text-red-500 font-medium">
                        · {Math.abs(bill.days_until_due)}d atrás
                      </span>
                    )}
                    {bill.status === 'due_soon' && bill.days_until_due >= 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        · vence em {bill.days_until_due}d
                      </span>
                    )}
                  </div>
                  {bill.payment?.paid_at && (
                    <p className="text-xs text-brand-600 mt-1">
                      Pago por <strong>{bill.payment.paid_by || '—'}</strong>{' '}
                      em {formatDate(bill.payment.paid_at)}
                      {bill.payment.notes && (
                        <span className="text-surface-400"> · {bill.payment.notes}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                {editingAmount ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      className="w-24 text-right text-sm border border-brand-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      placeholder={displayAmount.toFixed(2)}
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveAmount()
                        if (e.key === 'Escape') setEditingAmount(false)
                      }}
                    />
                    <button
                      onClick={handleSaveAmount}
                      disabled={saving}
                      className="text-brand-600 font-bold text-sm"
                    >✓</button>
                    <button
                      onClick={() => setEditingAmount(false)}
                      className="text-surface-400 text-sm"
                    >✕</button>
                  </div>
                ) : (
                  <div>
                    <p className={`font-display font-bold text-lg leading-tight ${
                      bill.status === 'paid'    ? 'text-brand-600'   :
                      bill.status === 'overdue' ? 'text-red-600'     :
                      'text-surface-800'
                    }`}>
                      {formatCurrency(
                        bill.status === 'paid'
                          ? (bill.payment?.amount_paid ?? displayAmount)
                          : displayAmount
                      )}
                    </p>
                    {hasCustomAmount && bill.status !== 'paid' && (
                      <p className="text-xs text-surface-400 line-through mt-0.5">
                        {formatCurrency(bill.amount)}
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className={`mt-3 pt-3 border-t border-surface-100 flex items-center gap-2 ${
              actionsOpen
                ? 'flex'
                : 'hidden md:flex'
            }`}>
              {bill.status === 'paid' ? (
                <button
                  onClick={() => { closeActions(); onUnpay(bill) }}
                  className="text-xs text-surface-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <span>↩</span> Desmarcar
                </button>
              ) : (
                <button
                  onClick={() => { closeActions(); onPay(bill) }}
                  className="text-xs font-medium text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>✓</span> Marcar como paga
                </button>
              )}

              <div className="flex-1" />

              {bill.status !== 'paid' && !editingAmount && (
                <button
                  onClick={() => {
                    closeActions()
                    setAmountInput(displayAmount.toFixed(2))
                    setEditingAmount(true)
                  }}
                  className="text-xs text-surface-400 hover:text-surface-600 transition-colors flex items-center gap-1"
                  title="Ajustar valor deste mês"
                >
                  <span>✏️</span>
                  <span className="hidden md:inline">Valor do mês</span>
                </button>
              )}

              <button
                onClick={() => { closeActions(); onHistory(bill) }}
                className="text-xs text-surface-400 hover:text-surface-600 transition-colors flex items-center gap-1"
                title="Histórico"
              >
                <span>📊</span>
                <span className="hidden md:inline">Histórico</span>
              </button>

              <button
                onClick={() => { closeActions(); onEdit(bill) }}
                className="text-xs text-surface-400 hover:text-surface-600 transition-colors flex items-center gap-1"
                title="Editar"
              >
                <span>✏</span>
                <span className="hidden md:inline">Editar</span>
              </button>

              <button
                onClick={() => { closeActions(); onDelete(bill) }}
                className="text-xs text-surface-400 hover:text-red-500 transition-colors flex items-center gap-1"
                title="Excluir"
              >
                <span>🗑</span>
                <span className="hidden md:inline">Excluir</span>
              </button>

              {actionsOpen && (
                <button
                  onClick={closeActions}
                  className="text-xs text-surface-300 hover:text-surface-500 transition-colors ml-1"
                  title="Fechar"
                >✕</button>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
