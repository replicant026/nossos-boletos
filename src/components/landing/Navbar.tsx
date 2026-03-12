'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <nav className="flex items-center justify-between px-6 md:px-16 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
          <span className="font-display text-base font-bold text-surface-900">NossosBoletos</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#como-funciona" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
            Como funciona
          </a>
          <a href="#funcionalidades" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
            Funcionalidades
          </a>
          <a href="/novo" className="text-sm text-surface-500 hover:text-surface-800 transition-colors">
            Já tenho um grupo →
          </a>
          <Link
            href="/novo"
            className="bg-surface-900 hover:bg-surface-800 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
          >
            Criar grupo grátis
          </Link>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <span
            className={`block w-5 h-0.5 bg-surface-700 rounded transition-all duration-200 ${
              menuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-surface-700 rounded transition-all duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-surface-700 rounded transition-all duration-200 ${
              menuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-100 bg-white px-6 py-4 flex flex-col gap-4">
          <a href="#como-funciona" onClick={closeMenu} className="text-sm text-surface-600 hover:text-surface-900">
            Como funciona
          </a>
          <a href="#funcionalidades" onClick={closeMenu} className="text-sm text-surface-600 hover:text-surface-900">
            Funcionalidades
          </a>
          <a href="/novo" onClick={closeMenu} className="text-sm text-surface-500 hover:text-surface-900">
            Já tenho um grupo →
          </a>
          <Link
            href="/novo"
            onClick={closeMenu}
            className="bg-surface-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full text-center"
          >
            Criar grupo grátis
          </Link>
        </div>
      )}
    </header>
  )
}
