import React from 'react'

const steps = [
  {
    emoji: '🏠',
    num: 'PASSO 1',
    title: 'Crie seu grupo',
    description: 'Dê um nome e adicione os membros da casa. Leva 30 segundos.',
  },
  {
    emoji: '📋',
    num: 'PASSO 2',
    title: 'Adicione as contas',
    description: 'Cadastre boletos, recorrências e vencimentos de uma vez.',
  },
  {
    emoji: '🔗',
    num: 'PASSO 3',
    title: 'Compartilhe o link',
    description: 'Mande via WhatsApp ou QR Code. Todo mundo acessa na hora.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 px-6 md:px-16 text-center">
      <span className="text-brand-600 text-sm font-bold uppercase tracking-widest">
        Como funciona
      </span>
      <h2 className="font-display text-3xl md:text-4xl font-black text-surface-900 mt-3 mb-3 tracking-tight">
        Pronto em menos de 2 minutos
      </h2>
      <p className="text-surface-500 text-base max-w-sm mx-auto mb-14 leading-relaxed">
        Sem download, sem cadastro. Só criar, adicionar e compartilhar.
      </p>

      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-center gap-6 md:gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div className="flex-1 text-center px-4">
              <div className="w-14 h-14 rounded-2xl border border-surface-100 bg-white shadow-sm flex items-center justify-center text-2xl mx-auto mb-4">
                {step.emoji}
              </div>
              <p className="text-xs font-bold text-brand-600 tracking-wider mb-1">{step.num}</p>
              <h3 className="font-display text-base font-bold text-surface-900 mb-2">{step.title}</h3>
              <p className="text-sm text-surface-500 leading-relaxed">{step.description}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block text-surface-300 text-xl flex-shrink-0">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
