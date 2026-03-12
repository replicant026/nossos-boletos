'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { createHouseholdClient, SupabaseProvider } from '@/lib/supabase-context'
import { Household, Bill, Payment, BillWithStatus } from '@/lib/types'
import { computeBillStatuses, computePreviousOverdueBills, getRefDate, formatCurrency } from '@/lib/bills'
import { getCategoryIcon } from '@/lib/types'
import AlertBanner from '@/components/AlertBanner'
import SummaryChips from '@/components/dashboard/SummaryChips'
import BillSection from '@/components/dashboard/BillSection'
import MemberStats from '@/components/dashboard/MemberStats'
import MonthNav from '@/components/MonthNav'
import SwipeableBillCard from '@/components/bills/SwipeableBillCard'
import BillHistorySheet from '@/components/bills/BillHistorySheet'
import PaymentModal from '@/components/PaymentModal'
import BillFormModal from '@/components/BillFormModal'
import TabHistorico from '@/components/tabs/TabHistorico'
import TabGrupo from '@/components/tabs/TabGrupo'
import { useToast } from '@/lib/toast'
import { useConfirm } from '@/lib/confirm'
import { SkeletonCard, SkeletonSummary } from '@/components/ui/Skeleton'
import BottomNav, { Tab } from '@/components/nav/BottomNav'
import TopTabs from '@/components/nav/TopTabs'

const RECURRENCE_LABEL: Record<string, string> = {
  monthly: 'Mensal',
  yearly:  'Anual',
  once:    'Única vez',
}

function TabContas({
  bills,
  onNew,
  onEdit,
  onDelete,
}: {
  bills: Bill[]
  onNew: () => void
  onEdit: (bill: Bill) => void
  onDelete: (bill: Bill) => void
}) {
  // Agrupa por categoria
  const grouped: Record<string, Bill[]> = {}
  for (const bill of bills) {
    if (!grouped[bill.category]) grouped[bill.category] = []
    grouped[bill.category].push(bill)
  }
  const categories = Object.keys(grouped).sort()

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-surface-800">Minhas Contas</h2>
        <button onClick={onNew} className="btn-primary text-sm">+ Nova</button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-3 block">📋</span>
          <p className="text-surface-500 mb-4">Nenhuma conta cadastrada</p>
          <button onClick={onNew} className="btn-primary">+ Adicionar primeira conta</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map(cat => (
            <div key={cat} className="bg-white border border-surface-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-50 border-b border-surface-100">
                <span className="text-base">{getCategoryIcon(cat)}</span>
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{cat}</span>
                <span className="ml-auto text-xs text-surface-400">{grouped[cat].length}</span>
              </div>
              <div className="divide-y divide-surface-50">
                {grouped[cat].map(bill => (
                  <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-800 truncate">{bill.name}</p>
                      <p className="text-xs text-surface-400 mt-0.5">
                        Vence dia {bill.due_day} · {RECURRENCE_LABEL[bill.recurrence] ?? bill.recurrence}
                      </p>
                    </div>
                    <p className="font-display font-bold text-surface-700 text-sm flex-shrink-0">
                      {formatCurrency(bill.amount)}
                    </p>
                    <button
                      onClick={() => onEdit(bill)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-300 hover:text-brand-600 hover:bg-brand-50 transition-colors flex-shrink-0"
                      title="Editar"
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => onDelete(bill)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Excluir"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const params = useParams()
  const hash = params.hash as string
  const supabase = useMemo(() => createHouseholdClient(hash), [hash])

  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [household, setHousehold] = useState<Household | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // Modals
  const [payingBill, setPayingBill] = useState<BillWithStatus | null>(null)
  const [editingBill, setEditingBill] = useState<Bill | null | 'new'>(null)
  const [historyBill, setHistoryBill] = useState<Bill | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'paid' | 'due_soon' | 'overdue' | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('inicio')

  // Fetch household
  useEffect(() => {
    async function fetchHousehold() {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('hash', hash)
        .single()

      if (error || !data) {
        setError('Link não encontrado. Verifique o endereço.')
        setLoading(false)
        return
      }

      setHousehold(data)
    }
    fetchHousehold()
  }, [hash])

  // Fetch bills & payments
  const fetchData = useCallback(async () => {
    if (!household) return

    const { data: billsData } = await supabase
      .from('bills')
      .select('*')
      .eq('household_id', household.id)
      .eq('active', true)
      .order('due_day')

    // Busca pagamentos para mês atual, próximo e 12 meses anteriores
    const refDates: string[] = []
    for (let i = 12; i >= -1; i--) {
      let y = year
      let m = month - i
      while (m < 0) { m += 12; y-- }
      while (m > 11) { m -= 12; y++ }
      refDates.push(getRefDate(y, m))
    }

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .in('reference_date', refDates)

    setBills(billsData || [])
    setPayments(paymentsData || [])
    setLoading(false)
  }, [household, year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed bill statuses
  const currentBillStatuses = computeBillStatuses(bills, payments, year, month)
  const previousOverdue = computePreviousOverdueBills(bills, payments, year, month)
  const billStatuses = [...previousOverdue, ...currentBillStatuses]
  const filteredByCategory = filterCategory
    ? billStatuses.filter(b => b.category === filterCategory)
    : billStatuses

  const filtered = filterStatus
    ? filteredByCategory.filter(b => b.status === filterStatus)
    : filteredByCategory

  // Get unique categories from current bills
  const categories = [...new Set(billStatuses.map(b => b.category))]

  async function handleSetMonthAmount(bill: BillWithStatus, amount: number | null) {
    const refDate = bill.overdue_month
      ? getRefDate(bill.overdue_month.year, bill.overdue_month.month)
      : getRefDate(year, month)

    if (amount === null) {
      // Remove month_amount, keep other payment data if exists
      if (bill.payment) {
        await supabase.from('payments').update({ month_amount: null }).eq('id', bill.payment.id)
      }
    } else {
      await supabase.from('payments').upsert(
        { bill_id: bill.id, reference_date: refDate, month_amount: amount },
        { onConflict: 'bill_id,reference_date' }
      )
    }
    fetchData()
  }

  async function handleDelete(bill: Bill | BillWithStatus) {
    const ok = await confirm({
      title: 'Excluir conta',
      message: `Excluir "${bill.name}"? Todos os pagamentos registrados também serão removidos.`,
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return
    await supabase.from('bills').delete().eq('id', bill.id)
    toast('Conta excluída', 'success')
    fetchData()
  }

  async function handleUnpay(bill: BillWithStatus) {
    if (!bill.payment) return
    const ok = await confirm({
      title: 'Desmarcar pagamento',
      message: `Desmarcar o pagamento de "${bill.name}"?`,
      confirmLabel: 'Desmarcar',
      danger: false,
    })
    if (!ok) return
    await supabase.from('payments').delete().eq('id', bill.payment.id)
    toast('Pagamento desmarcado', 'warning')
    fetchData()
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-5xl mb-4 block">😕</span>
          <h1 className="font-display text-2xl font-700 text-surface-800 mb-2">Ops!</h1>
          <p className="text-surface-500">{error}</p>
          <a href="/" className="btn-primary inline-block mt-4">
            Ir para o início
          </a>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading || !household) {
    return (
      <div className="min-h-screen pb-24">
        <header className="bg-white border-b border-surface-100 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="h-6 w-40 bg-surface-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-6">
          <SkeletonSummary />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <SupabaseProvider hash={hash}>
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header fixo */}
      <header className="bg-white border-b border-surface-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-surface-800 flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <rect width="100" height="100" rx="22" fill="#16a34a"/>
                <rect x="24" y="14" width="40" height="56" rx="5" fill="white" opacity="0.95"/>
                <rect x="32" y="24" width="24" height="3.5" rx="1.75" fill="#15803d" opacity="0.35"/>
                <rect x="32" y="32" width="18" height="3.5" rx="1.75" fill="#15803d" opacity="0.35"/>
                <rect x="32" y="40" width="21" height="3.5" rx="1.75" fill="#15803d" opacity="0.35"/>
                <rect x="32" y="48" width="15" height="3.5" rx="1.75" fill="#15803d" opacity="0.35"/>
                <circle cx="68" cy="68" r="20" fill="#22c55e"/>
                <path d="M57 68 L63.5 75 L79 60" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              NossosBoletos
            </h1>
            <p className="text-xs text-surface-400">{household.name}</p>
          </div>
        </div>
      </header>

      {/* Tabs desktop */}
      <TopTabs active={activeTab} onChange={setActiveTab} />

      {/* Conteúdo por aba */}
      {activeTab === 'inicio' && (
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-6">
          <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-8 xl:grid-cols-[380px_1fr]">

            {/* ── Sidebar esquerda (desktop) ── */}
            <div className="lg:sticky lg:top-[113px] lg:self-start lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto lg:pb-6">
              <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
              <SummaryChips
                bills={billStatuses}
                activeFilter={filterStatus}
                onFilter={setFilterStatus}
              />
              {household.members.length > 1 && (
                <MemberStats bills={billStatuses} members={household.members} />
              )}
            </div>

            {/* ── Conteúdo principal (bills) ── */}
            <div>
              <AlertBanner bills={billStatuses} />

              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-surface-500">Nenhuma conta para este mês</p>
                  <button
                    onClick={() => { setActiveTab('contas'); setEditingBill('new') }}
                    className="btn-primary mt-4"
                  >
                    + Adicionar primeira conta
                  </button>
                </div>
              ) : (
                <>
                  <BillSection
                    title="Atrasadas"
                    count={filtered.filter(b => b.status === 'overdue').length}
                    defaultCollapsed={false}
                    accentColor="danger"
                  >
                    {filtered
                      .filter(b => b.status === 'overdue')
                      .map((bill, i) => (
                        <div key={`${bill.id}-${bill.overdue_month?.month ?? month}`} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                          <SwipeableBillCard
                            bill={bill}
                            onPay={setPayingBill}
                            onUnpay={handleUnpay}
                            onEdit={setEditingBill}
                            onDelete={handleDelete}
                            onSetMonthAmount={handleSetMonthAmount}
                            onHistory={(b) => setHistoryBill(b)}
                          />
                        </div>
                      ))}
                  </BillSection>

                  <BillSection
                    title="A vencer"
                    count={filtered.filter(b => b.status === 'due_soon').length}
                    defaultCollapsed={false}
                    accentColor="warn"
                  >
                    {filtered
                      .filter(b => b.status === 'due_soon')
                      .map((bill, i) => (
                        <div key={`${bill.id}-${bill.overdue_month?.month ?? month}`} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                          <SwipeableBillCard
                            bill={bill}
                            onPay={setPayingBill}
                            onUnpay={handleUnpay}
                            onEdit={setEditingBill}
                            onDelete={handleDelete}
                            onSetMonthAmount={handleSetMonthAmount}
                            onHistory={(b) => setHistoryBill(b)}
                          />
                        </div>
                      ))}
                  </BillSection>

                  <BillSection
                    title="Pendentes"
                    count={filtered.filter(b => b.status === 'pending').length}
                    defaultCollapsed={false}
                    accentColor="surface"
                  >
                    {filtered
                      .filter(b => b.status === 'pending')
                      .map((bill, i) => (
                        <div key={`${bill.id}-${bill.overdue_month?.month ?? month}`} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                          <SwipeableBillCard
                            bill={bill}
                            onPay={setPayingBill}
                            onUnpay={handleUnpay}
                            onEdit={setEditingBill}
                            onDelete={handleDelete}
                            onSetMonthAmount={handleSetMonthAmount}
                            onHistory={(b) => setHistoryBill(b)}
                          />
                        </div>
                      ))}
                  </BillSection>

                  <BillSection
                    title="Pagas"
                    count={filtered.filter(b => b.status === 'paid').length}
                    defaultCollapsed={true}
                    accentColor="brand"
                  >
                    {filtered
                      .filter(b => b.status === 'paid')
                      .map((bill, i) => (
                        <div key={`${bill.id}-${bill.overdue_month?.month ?? month}`} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                          <SwipeableBillCard
                            bill={bill}
                            onPay={setPayingBill}
                            onUnpay={handleUnpay}
                            onEdit={setEditingBill}
                            onDelete={handleDelete}
                            onSetMonthAmount={handleSetMonthAmount}
                            onHistory={(b) => setHistoryBill(b)}
                          />
                        </div>
                      ))}
                  </BillSection>
                </>
              )}
            </div>
          </div>
        </main>
      )}

      {activeTab === 'contas' && (
        <TabContas
          bills={bills}
          onNew={() => setEditingBill('new')}
          onEdit={setEditingBill}
          onDelete={handleDelete}
        />
      )}

      {activeTab === 'historico' && (
        <TabHistorico
          householdId={household.id}
          bills={bills}
          members={household.members}
          onSelectMonth={(y, m) => {
            setYear(y)
            setMonth(m)
            setActiveTab('inicio')
          }}
        />
      )}

      {activeTab === 'grupo' && (
        <TabGrupo
          household={household}
          onUpdated={(updatedHousehold) => {
            setHousehold(updatedHousehold)
          }}
        />
      )}

      {/* Bottom Nav mobile */}
      <BottomNav active={activeTab} onChange={setActiveTab} />

      {/* Modals */}
      <PaymentModal
        bill={payingBill}
        members={household.members}
        year={year}
        month={month}
        onClose={() => setPayingBill(null)}
        onSaved={fetchData}
      />

      {editingBill !== null && (
        <BillFormModal
          bill={editingBill === 'new' ? null : editingBill}
          householdId={household.id}
          onClose={() => setEditingBill(null)}
          onSaved={fetchData}
        />
      )}

      {historyBill !== null && (
        <BillHistorySheet
          bill={historyBill}
          allPayments={payments}
          onClose={() => setHistoryBill(null)}
        />
      )}
    </div>
    </SupabaseProvider>
  )
}
