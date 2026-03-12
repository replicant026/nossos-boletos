const features = [
  {
    icon: '👥',
    title: 'Controle por membro',
    description: 'Veja quanto cada pessoa pagou e o saldo de cada um no mês.',
  },
  {
    icon: '📅',
    title: 'Histórico completo',
    description: 'Acesse os pagamentos de qualquer mês do ano passado.',
  },
  {
    icon: '🔔',
    title: 'Alertas de vencimento',
    description: 'Contas atrasadas ficam em destaque — ninguém esquece mais.',
  },
  {
    icon: '📱',
    title: 'Funciona no celular',
    description: 'Interface adaptada para mobile com gestos de swipe.',
  },
  {
    icon: '🔒',
    title: 'Sem senha, sem cadastro',
    description: 'O acesso é protegido pelo link único do seu grupo.',
  },
  {
    icon: '📊',
    title: 'Gráficos e resumos',
    description: 'Quanto foi gasto por categoria e quem mais contribuiu.',
  },
]

export default function Features() {
  return (
    <section id="funcionalidades" className="py-20 px-6 md:px-16 bg-surface-50 border-t border-surface-100">
      <div className="text-center mb-12">
        <span className="text-brand-600 text-sm font-bold uppercase tracking-widest">
          Funcionalidades
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-black text-surface-900 mt-3 mb-3 tracking-tight">
          Tudo que sua casa precisa
        </h2>
        <p className="text-surface-500 text-base max-w-sm mx-auto leading-relaxed">
          Simples de usar, mas com tudo que importa.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <div
            key={f.title}
            className="bg-white border border-surface-100 rounded-2xl p-5"
          >
            <div className="text-2xl mb-3">{f.icon}</div>
            <h4 className="font-display text-sm font-bold text-surface-800 mb-1">{f.title}</h4>
            <p className="text-sm text-surface-500 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
