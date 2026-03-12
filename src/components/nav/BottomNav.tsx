'use client'

type Tab = 'inicio' | 'contas' | 'historico' | 'grupo'

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

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-100 z-30 md:hidden">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
              active === tab.id ? 'text-brand-600' : 'text-surface-400'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {active === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

export type { Tab }
