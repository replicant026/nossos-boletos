'use client'

import { useState } from 'react'
import { BillWithStatus, getCategoryIcon } from '@/lib/types'
import { formatCurrency, formatDate, getMonthName } from '@/lib/bills'

interface Props {
  bill: BillWithStatus
  onPay: (bill: BillWithStatus) => void
  onUnpay: (bill: BillWithStatus) => void
  onEdit: (bill: BillWithStatus) => void
  onSetMonthAmount: (bill: BillWithStatus, amount: number | null) => Promise<void>
}

const statusConfig = {
  paid: {
    border: 'border-brand-200',
    bg: 'bg-brand-50/50',
    badge: 'bg-brand-100 text-brand-700',
    label: 'Paga',
  },
  due_soon: {
    border: 'border-amber-200',
    bg: 'bg-warn-50/50',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Vence em breve',
  },
  overdue: {
    border: 'border-red-200',
    bg: 'bg-danger-50/50',
    badge: 'bg-red-100 text-red-700',
    label: 'Atrasada',
  },
  pending: {
    border: 'border-surface-200',
    bg: 'bg-white',
    badge: 'bg-surface-100 text-surface-500',
    label: 'Pendente',
  },
}

export default function BillCard({ bill, onPay, onUnpay, onEdit, onSetMonthAmount }: Props) {
  const config = statusConfig[bill.status]
  const displayAmount = bill.payment?.month_amount ?? bill.amount
  const [editingAmount, setEditingAmount] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSaveAmount() {
    setSaving(true)
    const val = amountInput ? parseFloat(amountInput) : null
    await onSetMonthAmount(bill, val)
    setEditingAmount(false)
    setAmountInput('')
    setSaving(false)
  }

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-2xl p-4 transition-all hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0 mt-0.5">{getCategoryIcon(bill.category)}</span>
          <div className="min-w-0">
            <h3 className="font-medium text-surface-800 truncate">{bill.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-xs text-surface-400">
                Vence dia {bill.due_day}
              </span>
              {bill.status === 'overdue' && bill.overdue_month && (
                <span className="text-xs text-danger-500 font-medium">
                  (atraso de {getMonthName(bill.overdue_month.month)})
                </span>
              )}
              {bill.status === 'overdue' && !bill.overdue_month && (
                <span className="text-xs text-danger-500 font-medium">
                  ({Math.abs(bill.days_until_due)}d atrás)
                </span>
              )}
              {bill.status === 'due_soon' && bill.days_until_due >= 0 && (
                <span className="text-xs text-warn-600 font-medium">
                  (em {bill.days_until_due}d)
                </span>
              )}
            </div>
            {bill.payment?.paid_at && (
              <p className="text-xs text-brand-600 mt-1.5">
                Pago por <strong>{bill.payment.paid_by || '—'}</strong> em{' '}
                {formatDate(bill.payment.paid_at)}
                {bill.payment.notes && (
                  <span className="text-surface-400"> • {bill.payment.notes}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Right side */}
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
                onKeyDown={e => { if (e.key === 'Enter') handleSaveAmount(); if (e.key === 'Escape') setEditingAmount(false) }}
              />
              <button onClick={handleSaveAmount} disabled={saving} className="text-brand-600 font-bold text-sm">✓</button>
              <button onClick={() => setEditingAmount(false)} className="text-surface-400 text-sm">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-1 justify-end">
              <p className={`font-display font-700 text-lg ${
                bill.status === 'paid' ? 'text-brand-600' :
                bill.status === 'overdue' ? 'text-danger-600' :
                'text-surface-800'
              }`}>
                {formatCurrency(bill.status === 'paid' ? (bill.payment?.amount_paid ?? displayAmount) : displayAmount)}
              </p>
              {bill.status !== 'paid' && (
                <button
                  onClick={() => { setAmountInput(displayAmount.toFixed(2)); setEditingAmount(true) }}
                  className="text-surface-300 hover:text-surface-500 transition-colors text-xs ml-0.5"
                  title="Ajustar valor deste mês"
                >✏️</button>
              )}
            </div>
          )}
          {bill.payment?.month_amount != null && bill.status !== 'paid' && (
            <p className="text-xs text-surface-400 mt-0.5">padrão: {formatCurrency(bill.amount)}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100">
        {bill.status === 'paid' ? (
          <button
            onClick={() => onUnpay(bill)}
            className="text-xs text-surface-400 hover:text-danger-500 transition-colors"
          >
            ↩ Desmarcar pagamento
          </button>
        ) : (
          <button
            onClick={() => onPay(bill)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg"
          >
            ✓ Marcar como paga
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit(bill)}
          className="text-xs text-surface-400 hover:text-surface-600 transition-colors"
        >
          Editar
        </button>
      </div>
    </div>
  )
}
