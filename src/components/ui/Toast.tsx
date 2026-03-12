'use client'

import { useToast } from '@/lib/toast'

const typeConfig = {
  success: { bg: 'bg-brand-600', icon: '✓' },
  error:   { bg: 'bg-red-500',   icon: '✕' },
  warning: { bg: 'bg-amber-500', icon: '⚠' },
}

export default function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const config = typeConfig[t.type]
        return (
          <div
            key={t.id}
            className={`${config.bg} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in min-w-[200px] max-w-[320px]`}
          >
            <span className="text-base">{config.icon}</span>
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
