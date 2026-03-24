'use client'

import { useEffect, useState } from 'react'
import { Bill, CATEGORIES } from '@/lib/types'
import { useSupabase } from '@/lib/supabase-context'
import Modal from './Modal'
import { useToast } from '@/lib/toast'
import { useConfirm } from '@/lib/confirm'

interface Props {
  bill: Bill | null
  householdId: string
  onClose: () => void
  onSaved: () => void
  defaultYear?: number
  defaultMonth?: number
}

function getDefaultStartDate(defaultYear?: number, defaultMonth?: number): string {
  if (
    typeof defaultYear === 'number' &&
    Number.isInteger(defaultYear) &&
    typeof defaultMonth === 'number' &&
    Number.isInteger(defaultMonth) &&
    defaultMonth >= 0 &&
    defaultMonth <= 11
  ) {
    return `${defaultYear}-${String(defaultMonth + 1).padStart(2, '0')}-01`
  }

  return new Date().toISOString().slice(0, 10)
}

export default function BillFormModal({
  bill,
  householdId,
  onClose,
  onSaved,
  defaultYear,
  defaultMonth,
}: Props) {
  const supabase = useSupabase()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [isOneOff, setIsOneOff] = useState(false)
  const [recurringType, setRecurringType] = useState<'monthly' | 'yearly'>('monthly')

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('10')
  const [category, setCategory] = useState('Outros')
  const [startDate, setStartDate] = useState(getDefaultStartDate(defaultYear, defaultMonth))
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (bill) {
      setName(bill.name)
      setAmount(bill.amount.toString())
      setDueDay(bill.due_day.toString())
      setCategory(bill.category)
      setStartDate(bill.start_date)
      setEndDate(bill.end_date || '')

      if (bill.recurrence === 'once') {
        setIsOneOff(true)
        setRecurringType('monthly')
      } else {
        setIsOneOff(false)
        setRecurringType(bill.recurrence)
      }
      return
    }

    setIsOneOff(false)
    setRecurringType('monthly')
    setName('')
    setAmount('')
    setDueDay('10')
    setCategory('Outros')
    setStartDate(getDefaultStartDate(defaultYear, defaultMonth))
    setEndDate('')
  }, [bill, defaultYear, defaultMonth])

  async function handleSave() {
    if (!name.trim() || !amount) return
    setSaving(true)

    const parsedAmount = parseFloat(amount)
    const parsedDueDay = Math.max(1, Math.min(31, parseInt(dueDay, 10) || 1))
    const startDateObj = new Date(`${startDate}T00:00:00`)
    const oneOffDueDay = Number.isNaN(startDateObj.getTime())
      ? parsedDueDay
      : startDateObj.getDate()

    const data = {
      household_id: householdId,
      name: name.trim(),
      amount: parsedAmount,
      due_day: isOneOff ? oneOffDueDay : parsedDueDay,
      category,
      recurrence: isOneOff ? ('once' as const) : recurringType,
      start_date: startDate,
      end_date: isOneOff ? null : (endDate || null),
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

    toast('Conta excluida', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose} title={bill ? 'Editar Conta' : 'Nova Conta'}>
      <div className="space-y-4">
        <div>
          <label className="label">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsOneOff(false)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                !isOneOff
                  ? 'bg-brand-50 border-brand-500 text-brand-700'
                  : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              Recorrente
            </button>
            <button
              onClick={() => setIsOneOff(true)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                isOneOff
                  ? 'bg-brand-50 border-brand-500 text-brand-700'
                  : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              Unica
            </button>
          </div>
        </div>

        {!isOneOff && (
          <div>
            <label className="label">Recorrencia</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRecurringType('monthly')}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  recurringType === 'monthly'
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setRecurringType('yearly')}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  recurringType === 'yearly'
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
                }`}
              >
                Anual
              </button>
            </div>
          </div>
        )}

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

        <div className={`grid gap-3 ${isOneOff ? 'grid-cols-1' : 'grid-cols-2'}`}>
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

          {!isOneOff && (
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
          )}
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

        <div className={`grid gap-3 ${isOneOff ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className="label">{isOneOff ? 'Data' : 'Inicio'}</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {!isOneOff && (
            <div>
              <label className="label">Fim (opcional)</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}
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
            {saving ? 'Salvando...' : bill ? 'Salvar Alteracoes' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
