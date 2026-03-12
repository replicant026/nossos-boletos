'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  title: string
  count: number
  children: React.ReactNode
  defaultCollapsed?: boolean
  accentColor?: 'brand' | 'warn' | 'danger' | 'surface'
}

const ACCENT_MAP = {
  brand: {
    badge: 'bg-brand-100 text-brand-700',
    chevron: 'text-brand-600',
    border: 'border-brand-100',
  },
  warn: {
    badge: 'bg-warn-50 text-warn-600',
    chevron: 'text-warn-600',
    border: 'border-amber-100',
  },
  danger: {
    badge: 'bg-danger-50 text-danger-600',
    chevron: 'text-danger-600',
    border: 'border-red-100',
  },
  surface: {
    badge: 'bg-surface-100 text-surface-500',
    chevron: 'text-surface-400',
    border: 'border-surface-100',
  },
}

export default function BillSection({
  title,
  count,
  children,
  defaultCollapsed = false,
  accentColor = 'surface',
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [height, setHeight] = useState<number | 'auto'>(defaultCollapsed ? 0 : 'auto')
  const contentRef = useRef<HTMLDivElement>(null)
  const accent = ACCENT_MAP[accentColor]

  useEffect(() => {
    if (!defaultCollapsed && contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
      const timer = setTimeout(() => setHeight('auto'), 400)
      return () => clearTimeout(timer)
    }
  }, [defaultCollapsed])

  function toggle() {
    if (!contentRef.current) return

    if (collapsed) {
      setHeight(contentRef.current.scrollHeight)
      setCollapsed(false)
      const timer = setTimeout(() => setHeight('auto'), 400)
      return () => clearTimeout(timer)
    } else {
      setHeight(contentRef.current.scrollHeight)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0)
          setCollapsed(true)
        })
      })
    }
  }

  if (count === 0) return null

  return (
    <div className={`mb-4 border ${accent.border} rounded-2xl overflow-hidden bg-white`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-surface-700 text-sm">{title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent.badge}`}>
            {count}
          </span>
        </div>
        <span
          className={`text-lg leading-none transition-transform duration-300 ${accent.chevron} ${
            collapsed ? '' : 'rotate-180'
          }`}
          style={{ display: 'inline-block' }}
        >
          ⌄
        </span>
      </button>

      <div
        ref={contentRef}
        style={{
          height: height === 'auto' ? 'auto' : `${height}px`,
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>
      </div>
    </div>
  )
}
