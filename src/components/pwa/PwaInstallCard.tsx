'use client'

import { useEffect, useMemo, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isIosDevice() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false

  const matchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches
  const navigatorStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  )

  return matchMediaStandalone || navigatorStandalone
}

export default function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  const ios = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    setInstalled(isStandaloneMode())

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
      setShowIosHelp(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (installed) return

    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }

    if (ios) {
      setShowIosHelp(v => !v)
    }
  }

  return (
    <div className="bg-white border border-surface-100 rounded-2xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
        App no celular
      </h2>

      <p className="text-sm text-surface-600">
        Salve o NossosBoletos na tela inicial para abrir como aplicativo.
      </p>

      <button
        onClick={handleInstall}
        disabled={installed}
        className="w-full text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl transition-colors disabled:bg-surface-200 disabled:text-surface-500"
      >
        {installed ? 'Aplicativo ja instalado' : 'Instalar no celular'}
      </button>

      {ios && !installed && (
        <p className="text-xs text-surface-500">
          No iPhone: toque em Compartilhar e depois em Adicionar a Tela de Inicio.
        </p>
      )}

      {showIosHelp && ios && !installed && (
        <div className="text-xs text-surface-500 bg-surface-50 rounded-xl p-3">
          Passo a passo: abra no Safari, toque em Compartilhar, role para baixo e escolha
          Adicionar a Tela de Inicio.
        </div>
      )}
    </div>
  )
}
