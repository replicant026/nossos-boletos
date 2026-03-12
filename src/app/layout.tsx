import type { Metadata } from 'next'
import './globals.css'
import { headers } from 'next/headers'
import { ToastProvider } from '@/lib/toast'
import { ConfirmProvider } from '@/lib/confirm'
import ToastContainer from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'NossosBoletos — Controle de Contas Simples',
  description: 'Gerencie suas contas a pagar de forma simples e compartilhada.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Força renderização dinâmica para que Next.js aplique o nonce do middleware
  // nos <script> gerados. Sem isso, páginas estáticas recebem o CSP com nonce
  // mas os scripts não têm o atributo nonce, e o browser os bloqueia.
  headers()

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="min-h-screen font-sans">
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}
