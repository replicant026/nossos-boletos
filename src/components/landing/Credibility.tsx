const items = [
  { highlight: 'Grátis pra sempre', sub: 'sem planos pagos' },
  { highlight: 'Sem cadastro', sub: 'só o link' },
  { highlight: 'Acesso via QR Code', sub: 'compartilhe em segundos' },
  { highlight: 'Funciona no celular', sub: 'mobile-first' },
]

export default function Credibility() {
  return (
    <div className="bg-surface-50 border-y border-surface-100 py-8 px-6 md:px-16">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
        {items.map((item, i) => (
          <div
            key={item.highlight}
            className={`text-center ${i > 0 ? 'md:border-l md:border-surface-200' : ''}`}
          >
            <p className="font-display text-base font-bold text-surface-800">{item.highlight}</p>
            <p className="text-sm text-surface-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
