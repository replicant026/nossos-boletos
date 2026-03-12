'use client'

import { useRef } from 'react'
import { getMonthName } from '@/lib/bills'

interface Props {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export default function MonthNav({ year, month, onChange }: Props) {
  const touchStartX = useRef<number | null>(null)

  function prev() {
    if (month === 0) onChange(year - 1, 11)
    else onChange(year, month - 1)
  }

  function next() {
    if (month === 11) onChange(year + 1, 0)
    else onChange(year, month + 1)
  }

  function goToday() {
    const now = new Date()
    onChange(now.getFullYear(), now.getMonth())
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) {
      next()
    } else if (diff < -50) {
      prev()
    }
    touchStartX.current = null
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div
      className="flex items-center justify-between mb-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={prev}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-surface-200 hover:bg-surface-50 transition-colors text-surface-600 active:scale-95"
        aria-label="Mês anterior"
      >
        ←
      </button>

      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-surface-800">
          {getMonthName(month)}
        </h2>
        <p className="text-sm text-surface-400">{year}</p>
        {!isCurrentMonth && (
          <button
            onClick={goToday}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-0.5 transition-colors"
          >
            Ir para hoje
          </button>
        )}
      </div>

      <button
        onClick={next}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-surface-200 hover:bg-surface-50 transition-colors text-surface-600 active:scale-95"
        aria-label="Próximo mês"
      >
        →
      </button>
    </div>
  )
}
