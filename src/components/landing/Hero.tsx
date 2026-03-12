function DashboardMockup() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-surface-50 border border-surface-100 rounded-2xl p-4 shadow-sm">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger-500" />
          <div className="w-2 h-2 rounded-full bg-warn-500" />
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="ml-2 text-xs font-semibold text-surface-500">
            Casa da Ana · Março 2025
          </span>
        </div>
        <div className="flex gap-2">
          <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            5 pagas
          </span>
          <span className="bg-warn-50 text-warn-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            2 pendentes
          </span>
        </div>
      </div>

      {/* Bill rows */}
      <div className="space-y-2">
        {[
          { name: 'Aluguel', value: 'R$ 1.200', who: 'Vence dia 5 · Ana e João', status: 'pago' },
          { name: 'Internet', value: 'R$ 120', who: 'Vence dia 12 · João', status: 'pendente' },
          { name: 'Conta de luz', value: 'R$ 180', who: 'Vence dia 15 · Ana', status: 'pago' },
        ].map(bill => (
          <div
            key={bill.name}
            className="flex items-center justify-between bg-white border border-surface-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-surface-800">{bill.name}</p>
              <p className="text-xs text-surface-400 mt-0.5">{bill.who}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-surface-800">{bill.value}</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  bill.status === 'pago'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-warn-50 text-warn-600'
                }`}
              >
                {bill.status === 'pago' ? '✓ Pago' : 'Pendente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="pt-28 pb-16 px-6 md:px-16 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
        100% gratuito · sem cadastro · sem senha
      </div>

      {/* Headline */}
      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-surface-900 leading-tight tracking-tight mb-5 max-w-3xl mx-auto">
        Contas da casa organizadas{' '}
        <span className="text-brand-600">pra todo mundo</span>
      </h1>

      {/* Subtítulo */}
      <p className="text-lg text-surface-500 max-w-xl mx-auto mb-8 leading-relaxed">
        Cadastre os boletos do mês, veja quem pagou o quê e compartilhe com a família via
        link ou QR Code.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
        <a
          href="/novo"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-base px-7 py-3.5 rounded-full transition-colors shadow-lg shadow-brand-600/20"
        >
          Criar meu grupo grátis →
        </a>
        <a
          href="#como-funciona"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-surface-200 hover:bg-surface-50 text-surface-700 font-semibold text-base px-6 py-3.5 rounded-full transition-colors"
        >
          ▷ Como funciona
        </a>
      </div>

      {/* Screenshot mockup */}
      <DashboardMockup />
    </section>
  )
}
