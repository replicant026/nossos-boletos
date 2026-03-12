function LogoIcon() {
  return (
    <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
        <rect x="4" y="2" width="12" height="16" rx="2.5" fill="white" opacity="0.9" />
        <line x1="6.5" y1="7" x2="13.5" y2="7" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6.5" y1="10" x2="11" y2="10" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15" cy="15" r="4.5" fill="#16a34a" />
        <path d="M13.2 15l1.3 1.3 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-surface-900 py-12 px-6 md:px-16">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LogoIcon />
            <span className="font-display text-base font-bold text-white">NossosBoletos</span>
          </div>
          <p className="text-sm text-surface-500 max-w-xs leading-relaxed">
            Controle de contas compartilhado para famílias e repúblicas.
          </p>
          <p className="text-xs text-surface-600 mt-4">
            © {new Date().getFullYear()} NossosBoletos · Feito com ♥ no Brasil
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-surface-600 uppercase tracking-wider mb-1">Links</p>
          <a href="#como-funciona" className="text-sm text-surface-500 hover:text-white transition-colors">
            Como funciona
          </a>
          <a href="#funcionalidades" className="text-sm text-surface-500 hover:text-white transition-colors">
            Funcionalidades
          </a>
          <a href="/novo" className="text-sm text-surface-500 hover:text-white transition-colors">
            Criar grupo
          </a>
        </div>
      </div>
    </footer>
  )
}
