import { Bill, Payment, BillWithStatus } from './types'

/**
 * Para um dado mês/ano, retorna a data de vencimento de uma bill.
 * Se due_day > dias no mês, usa o último dia do mês.
 */
function getDueDate(bill: Bill, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const day = Math.min(bill.due_day, lastDay)
  return new Date(year, month, day)
}

/**
 * Verifica se uma bill tem ocorrência em um dado mês/ano.
 */
function billOccursInMonth(bill: Bill, year: number, month: number): boolean {
  if (!bill.active) return false

  const startDate = new Date(bill.start_date)
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()

  // Antes do início
  if (year < startYear || (year === startYear && month < startMonth)) return false

  // Depois do fim
  if (bill.end_date) {
    const endDate = new Date(bill.end_date)
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth()
    if (year > endYear || (year === endYear && month > endMonth)) return false
  }

  switch (bill.recurrence) {
    case 'once':
      return year === startYear && month === startMonth
    case 'monthly':
      return true
    case 'yearly':
      return month === startMonth
    default:
      return false
  }
}

/**
 * Dado um conjunto de bills e payments para um mês, retorna bills com status.
 */
export function computeBillStatuses(
  bills: Bill[],
  payments: Payment[],
  year: number,
  month: number
): BillWithStatus[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const refDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`

  return bills
    .filter(bill => billOccursInMonth(bill, year, month))
    .map(bill => {
      const dueDate = getDueDate(bill, year, month)
      const payment = payments.find(
        p => p.bill_id === bill.id && p.reference_date === refDateStr
      ) || null

      const diffTime = dueDate.getTime() - today.getTime()
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let status: BillWithStatus['status'] = 'pending'
      if (payment?.paid_at) {
        status = 'paid'
      } else if (daysUntilDue < 0) {
        status = 'overdue'
      } else if (daysUntilDue <= 3) {
        status = 'due_soon'
      }

      return {
        ...bill,
        payment,
        status,
        due_date: dueDate,
        days_until_due: daysUntilDue,
      }
    })
    .sort((a, b) => {
      // Atrasadas primeiro, depois próximas, depois pendentes, pagas por último
      const order = { overdue: 0, due_soon: 1, pending: 2, paid: 3 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return a.due_day - b.due_day
    })
}

/**
 * Retorna bills não pagas de meses anteriores como "overdue" para exibir no mês atual.
 */
export function computePreviousOverdueBills(
  bills: Bill[],
  payments: Payment[],
  currentYear: number,
  currentMonth: number,
  monthsBack: number = 12
): BillWithStatus[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result: BillWithStatus[] = []

  for (let i = 1; i <= monthsBack; i++) {
    let y = currentYear
    let m = currentMonth - i
    while (m < 0) { m += 12; y-- }

    const refDateStr = getRefDate(y, m)

    for (const bill of bills) {
      if (!billOccursInMonth(bill, y, m)) continue

      const payment = payments.find(
        p => p.bill_id === bill.id && p.reference_date === refDateStr
      ) || null

      if (payment?.paid_at) continue

      const dueDate = getDueDate(bill, y, m)
      if (dueDate >= today) continue

      const diffTime = dueDate.getTime() - today.getTime()
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      result.push({
        ...bill,
        payment,
        status: 'overdue',
        due_date: dueDate,
        days_until_due: daysUntilDue,
        overdue_month: { year: y, month: m },
      })
    }
  }

  return result.sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
}

/**
 * Formata valor em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

/**
 * Nome do mês
 */
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month]
}

/**
 * Referência date string para o Supabase
 */
export function getRefDate(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}
