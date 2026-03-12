'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: async () => false,
})

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ ...options, resolve })
    })
  }, [])

  function handleResponse(value: boolean) {
    state?.resolve(value)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
            <h3 className="font-display text-lg font-700 text-surface-800 mb-2">{state.title}</h3>
            <p className="text-sm text-surface-500 mb-6">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResponse(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResponse(true)}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                  state.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}
