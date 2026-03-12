export interface Household {
  id: string
  hash: string
  name: string
  members: string[]
  created_at: string
}

export interface Bill {
  id: string
  household_id: string
  name: string
  amount: number
  due_day: number
  category: string
  recurrence: 'once' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  active: boolean
  created_at: string
}

export interface Payment {
  id: string
  bill_id: string
  reference_date: string
  paid_at: string | null
  paid_by: string | null
  amount_paid: number | null
  month_amount: number | null
  notes: string | null
  created_at: string
}

export interface BillWithStatus extends Bill {
  payment: Payment | null
  status: 'paid' | 'due_soon' | 'overdue' | 'pending'
  due_date: Date
  days_until_due: number
  overdue_month?: { year: number; month: number }
}

export const CATEGORIES = [
  { value: 'Moradia', icon: '🏠' },
  { value: 'Energia', icon: '⚡' },
  { value: 'Água', icon: '💧' },
  { value: 'Internet', icon: '🌐' },
  { value: 'Telefone', icon: '📱' },
  { value: 'Transporte', icon: '🚗' },
  { value: 'Saúde', icon: '🏥' },
  { value: 'Educação', icon: '📚' },
  { value: 'Seguros', icon: '🛡️' },
  { value: 'Streaming', icon: '📺' },
  { value: 'Cartão', icon: '💳' },
  { value: 'Empréstimo', icon: '🏦' },
  { value: 'Alimentação', icon: '🍽️' },
  { value: 'Outros', icon: '📋' },
] as const

export function getCategoryIcon(category: string): string {
  return CATEGORIES.find(c => c.value === category)?.icon || '📋'
}
