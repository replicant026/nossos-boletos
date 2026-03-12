'use client'

import { useState, useEffect } from 'react'
import { Bill, CATEGORIES } from '@/lib/types'
import { useSupabase } from '@/lib/supabase-context'
import Modal from './Modal'
import { useToast } from '@/lib/toast'
import { useConfirm } from '@/lib/confirm'

interface Props {
  bill: Bill | null  // null = create new
  householdId: string
  onClose: () => void
  onSaved: () => void
}

export default function BillFormModal({ bill, householdId, onClose, onSaved }: Props) {
  const supabase = useSupabase()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('10')
  const [category, setCategory] = useState('Outros')
  const [recurrence, setRecurrence] = useState<'once' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (bill) {
      setName(bill.name)
      setAmount(bill.amount.toString())
      setDueDay(bill.due_day.toString())
      setCategory(bill.category)
      setRecurrence(bill.recurrence)
      setStartDate(bill.start_date)
      setEndDate(bill.end_date || '')
    } else {
      setName('')
      setAmount('')
      setDueDay('10')
      setCategory('Outros')
      setRecurrence('monthly')
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate('')
    }
  }, [bill])

  async function handleSave() {
    if (!name.trim() || !amount) return
    setSaving(true)

    const data = {
      household_id: householdId,
      name: name.trim(),
      amount: parseFloat(amount),
      due_day: parseInt(dueDay),
      category,
      recurrence,
      start_date: startDate,
      end_date: endDate || null,
    }

    let error
    if (bill) {
      ;({ error } = await supabase.from('bills').update(data).eq('id', bill.id))
    } else {
      ;({ error } = await supabase.from('bills').insert(data))
    }

    if (error) {
      toast('Erro ao salvar: ' + error.message, 'error')
      setSaving(false)
      return
    }

    toast(bill ? 'Conta atualizada!' : 'Conta criada!', 'success')
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!bill) return
    const ok = await confirm({
      title: 'Excluir conta',
      message: `Excluir "${bill.name}"? Os pagamentos registrados também serão removidos.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    const { error } = await supabase.from('bills').delete().eq('id', bill.id)
    if (error) {
      toast('Erro ao excluir: ' + error.message, 'error')
      setDeleting(false)
      return
    }
    toast('Conta excluída', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={bill ? 'Editar Conta' : 'Nova Conta'}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nome da conta *</label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Conta de Luz"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="150.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Dia do vencimento *</label>
            <input
              type="number"
              min="1"
              max="31"
              className="input"
              value={dueDay}
              onChange={e => setDueDay(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Categoria</label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs transition-all border ${
                  category === cat.value
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="truncate w-full text-center">{cat.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Recorrência</label>
          <div className="flex gap-2">
            {[
              { v: 'monthly' as const, l: 'Mensal' },
              { v: 'yearly' as const, l: 'Anual' },
              { v: 'once' as const, l: 'Única' },
            ].map(r => (
              <button
                key={r.v}
                onClick={() => setRecurrence(r.v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  recurrence === r.v
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                {r.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Início</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fim (opcional)</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {bill && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger disabled:opacity-50"
            >
              {deleting ? '...' : 'Excluir'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !amount}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : bill ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
