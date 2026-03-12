'use client'

import { BillWithStatus } from '@/lib/types'
import ProgressRing from '@/components/ui/ProgressRing'

type FilterType = 'paid' | 'due_soon' | 'overdue' | null

interface Props {
  bills: BillWithStatus[]
  activeFilter: FilterType
  onFilter: (filter: FilterType) => void
}

interface ChipConfig {
  filter: FilterType
  emoji: string
  label: string
  count: number
  activeClass: string
  inactiveClass: string
  badgeClass: string
}

export default function SummaryChips({ bills, activeFilter, onFilter }: Props) {
  const paidCount = bills.filter(b => b.status === 'paid').length
  const dueSoonCount = bills.filter(b => b.status === 'due_soon').length
  const overdueCount = bills.filter(b => b.status === 'overdue').length
  const total = bills.length

  const chips: ChipConfig[] = [
    {
      filter: 'paid',
      emoji: '✅',
      label: 'Pagas',
      count: paidCount,
      activeClass: 'bg-brand-600 text-white shadow-md shadow-brand-600/20',
      inactiveClass: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      badgeClass: 'bg-brand-500 text-white',
    },
    {
      filter: 'due_soon',
      emoji: '⏰',
      label: 'A vencer',
      count: dueSoonCount,
      activeClass: 'bg-warn-600 text-white shadow-md shadow-warn-600/20',
      inactiveClass: 'bg-warn-50 text-warn-600 hover:bg-amber-100',
      badgeClass: 'bg-warn-500 text-white',
    },
    {
      filter: 'overdue',
      emoji: '🚨',
      label: 'Atrasadas',
      count: overdueCount,
      activeClass: 'bg-danger-600 text-white shadow-md shadow-danger-600/20',
      inactiveClass: overdueCount > 0
        ? 'bg-danger-50 text-danger-600 hover:bg-red-100'
        : 'bg-surface-50 text-surface-400',
      badgeClass: 'bg-danger-500 text-white',
    },
  ]

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-shrink-0">
        <ProgressRing paid={paidCount} total={total} />
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {chips.map(chip => {
          const isActive = activeFilter === chip.filter
          return (
            <button
              key={chip.filter}
              onClick={() => onFilter(isActive ? null : chip.filter)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
                isActive ? chip.activeClass : chip.inactiveClass
              }`}
            >
              <span className="text-base leading-none">{chip.emoji}</span>
              <span className="flex-1">{chip.label}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : chip.badgeClass
                }`}
              >
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
