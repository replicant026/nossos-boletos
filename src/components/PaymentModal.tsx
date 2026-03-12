'use client'

import { useState } from 'react'
import { BillWithStatus } from '@/lib/types'
import { formatCurrency, getRefDate } from '@/lib/bills'
import { useSupabase } from '@/lib/supabase-context'
import Modal from './Modal'
import { useToast } from '@/lib/toast'

interface Props {
  bill: BillWithStatus | null
  members: string[]
  year: number
  month: number
  onClose: () => void
  onSaved: () => void
}

export default function PaymentModal({ bill, members, year, month, onClose, onSaved }: Props) {
  const supabase = useSupabase()
  const { toast } = useToast()
  const [paidBy, setPaidBy] = useState(members[0] || '')
  const [amountPaid, setAmountPaid] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!bill) return null

  async function handleSave() {
    if (!bill) return
    setSaving(true)

    const refDate = bill.overdue_month
      ? getRefDate(bill.overdue_month.year, bill.overdue_month.month)
      : getRefDate(year, month)
    const amount = amountPaid ? parseFloat(amountPaid) : (bill.payment?.month_amount ?? bill.amount)

    const { error } = await supabase.from('payments').upsert(
      {
        bill_id: bill.id,
        reference_date: refDate,
        paid_at: new Date().toISOString(),
        paid_by: paidBy || null,
        amount_paid: amount,
        notes: notes || null,
      },
      { onConflict: 'bill_id,reference_date' }
    )

    if (error) {
      toast('Erro ao registrar pagamento: ' + error.message, 'error')
      setSaving(false)
      return
    }

    toast('Pagamento registrado!', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal open={!!bill} onClose={onClose} title="Marcar como Paga">
      <div className="space-y-4">
        <div className="bg-surface-50 rounded-xl p-4">
          <p className="font-medium text-surface-800">{bill.name}</p>
          <p className="text-sm text-surface-500">Valor: {formatCurrency(bill.payment?.month_amount ?? bill.amount)}</p>
        </div>

        <div>
          <label className="label">Quem pagou?</label>
          <div className="flex gap-2">
            {members.map(m => (
              <button
                key={m}
                onClick={() => setPaidBy(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  paidBy === m
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Valor pago (deixe vazio se igual)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            placeholder={(bill.payment?.month_amount ?? bill.amount).toFixed(2)}
            value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Observação (opcional)</label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Pago via Pix"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Confirmar Pagamento ✓'}
        </button>
      </div>
    </Modal>
  )
}
