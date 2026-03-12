'use client'

import type { Tab } from './BottomNav'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'inicio',    label: 'Início',    icon: '🏠' },
  { id: 'contas',    label: 'Contas',    icon: '📋' },
  { id: 'historico', label: 'Histórico', icon: '📊' },
  { id: 'grupo',     label: 'Grupo',     icon: '👥' },
]

export default function TopTabs({ active, onChange }: Props) {
  return (
    <nav className="hidden md:flex border-b border-surface-100 bg-white sticky top-[57px] z-20">
      <div className="max-w-7xl mx-auto px-6 flex gap-1 w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
