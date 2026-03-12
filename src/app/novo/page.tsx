'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Step = 'slides' | 'form-step1' | 'form-step2' | 'success'

const AVATAR_COLORS = [
  'bg-brand-600',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-indigo-500',
]

const SLIDES = [
  {
    emoji: '💰',
    title: 'Controle simples',
    description: 'Acompanhe todas as contas da casa em um só lugar, sem planilhas complicadas.',
  },
  {
    emoji: '👫',
    title: 'Compartilhe com quem importa',
    description: 'Marque pagamentos em tempo real. Todo mundo vê o que já foi pago.',
  },
  {
    emoji: '🔔',
    title: 'Nunca mais esqueça',
    description: 'Alertas de contas atrasadas e a vencer para você e seu grupo.',
  },
]

function Avatar({ name, index }: { name: string; index: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div
      className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
    >
      {initials || '?'}
    </div>
  )
}

export default function NovoPage() {
  const router = useRouter()

  const [slideIndex, setSlideIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const [step, setStep] = useState<Step>('slides')
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)

  function handleSlideTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleSlideTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50 && slideIndex < SLIDES.length - 1) {
      setSlideIndex(i => i + 1)
    } else if (diff < -50 && slideIndex > 0) {
      setSlideIndex(i => i - 1)
    }
    touchStartX.current = null
  }

  function addMember() {
    setMembers(prev => [...prev, ''])
  }

  function updateMember(index: number, value: string) {
    setMembers(prev => prev.map((m, i) => (i === index ? value : m)))
  }

  function removeMember(index: number) {
    if (members.length === 1) return
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleCreate() {
    const validMembers = members.map(m => m.trim()).filter(Boolean)
    if (validMembers.length === 0) return
    setLoading(true)

    const hash = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { error } = await supabase.from('households').insert({
      hash,
      name: groupName.trim() || 'NossosBoletos',
      members: validMembers,
    })

    if (error) {
      alert('Erro ao criar: ' + error.message)
      setLoading(false)
      return
    }

    setStep('success')
    setTimeout(() => {
      router.push(`/h/${hash}`)
    }, 1500)
  }

  if (step === 'slides') {
    const slide = SLIDES[slideIndex]
    const isLast = slideIndex === SLIDES.length - 1

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 select-none">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100 opacity-40 blur-3xl" />
        </div>

        <div
          className="w-full max-w-sm flex-1 flex flex-col items-center justify-center"
          onTouchStart={handleSlideTouchStart}
          onTouchEnd={handleSlideTouchEnd}
        >
          <div className="w-full text-center transition-all duration-300">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-50 text-5xl mb-8 shadow-sm">
              {slide.emoji}
            </div>
            <h1 className="font-display text-3xl font-bold text-surface-900 mb-3">
              {slide.title}
            </h1>
            <p className="text-surface-500 text-base leading-relaxed max-w-xs mx-auto">
              {slide.description}
            </p>
          </div>

          <div className="flex gap-2 mt-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slideIndex ? 'w-6 bg-brand-600' : 'w-2 bg-surface-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3 mt-8">
          {isLast ? (
            <button
              onClick={() => setStep('form-step1')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold text-base transition-colors shadow-lg shadow-brand-600/20"
            >
              Começar agora →
            </button>
          ) : (
            <>
              <button
                onClick={() => setSlideIndex(i => i + 1)}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold text-base transition-colors"
              >
                Próximo →
              </button>
              <button
                onClick={() => setStep('form-step1')}
                className="w-full py-2 text-surface-400 hover:text-surface-600 text-sm transition-colors"
              >
                Pular apresentação
              </button>
            </>
          )}

          <div className="text-center pt-2">
            <a
              href="#join"
              onClick={e => {
                e.preventDefault()
                const code = prompt('Cole o link ou código do seu grupo:')
                if (!code) return
                let hash = code.trim()
                const match = hash.match(/\/h\/([a-f0-9]+)/)
                if (match) hash = match[1]
                if (hash) router.push(`/h/${hash}`)
              }}
              className="text-xs text-surface-400 hover:text-brand-600 transition-colors underline underline-offset-2"
            >
              Já tenho um link →
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-50 text-4xl mb-6 animate-bounce">
          🎉
        </div>
        <h2 className="font-display text-2xl font-bold text-surface-900 mb-2">
          Grupo criado!
        </h2>
        <p className="text-surface-400 text-sm">Redirecionando para o seu painel...</p>
        <div className="mt-6 w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (step === 'form-step1') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100 opacity-40 blur-3xl" />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-1.5 rounded-full bg-brand-600" />
            <div className="flex-1 h-1.5 rounded-full bg-surface-200" />
          </div>

          <h2 className="font-display text-2xl font-bold text-surface-900 mb-1">
            Nome do grupo
          </h2>
          <p className="text-surface-400 text-sm mb-6">
            Como você quer chamar o controle de contas do seu grupo?
          </p>

          <input
            type="text"
            className="w-full px-4 py-3.5 rounded-2xl border border-surface-200 bg-white text-surface-800 placeholder-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition text-base"
            placeholder="NossosBoletos"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && setStep('form-step2')}
          />
          <p className="text-xs text-surface-400 mt-2">
            Deixe em branco para usar "NossosBoletos"
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setStep('form-step2')}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold text-base transition-colors"
            >
              Continuar →
            </button>
            <button
              onClick={() => setStep('slides')}
              className="w-full py-2 text-surface-400 hover:text-surface-600 text-sm transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100 opacity-40 blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-1.5 rounded-full bg-brand-600" />
          <div className="flex-1 h-1.5 rounded-full bg-brand-600" />
        </div>

        <h2 className="font-display text-2xl font-bold text-surface-900 mb-1">
          Quem faz parte?
        </h2>
        <p className="text-surface-400 text-sm mb-6">
          Adicione as pessoas que vão usar o painel. Você pode adicionar mais depois.
        </p>

        <div className="space-y-3 mb-4">
          {members.map((member, index) => (
            <div key={index} className="flex items-center gap-3">
              <Avatar name={member || String(index + 1)} index={index} />
              <input
                type="text"
                className="flex-1 px-4 py-3 rounded-2xl border border-surface-200 bg-white text-surface-800 placeholder-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition text-base"
                placeholder={index === 0 ? 'Seu nome' : `Pessoa ${index + 1}`}
                value={member}
                onChange={e => updateMember(index, e.target.value)}
                autoFocus={index === members.length - 1}
              />
              {members.length > 1 && (
                <button
                  onClick={() => removeMember(index)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-surface-300 hover:text-danger-500 hover:bg-danger-50 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addMember}
          className="w-full py-2.5 border-2 border-dashed border-surface-200 hover:border-brand-400 rounded-2xl text-sm text-surface-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Adicionar pessoa
        </button>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleCreate}
            disabled={loading || members.every(m => !m.trim())}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-base transition-colors shadow-lg shadow-brand-600/20"
          >
            {loading ? 'Criando...' : 'Criar meu painel 🎉'}
          </button>
          <button
            onClick={() => setStep('form-step1')}
            className="w-full py-2 text-surface-400 hover:text-surface-600 text-sm transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
