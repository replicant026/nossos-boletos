'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSupabase } from '@/lib/supabase-context'
import { Household } from '@/lib/types'

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then(mod => mod.QRCodeSVG),
  { ssr: false }
)

interface Props {
  household: Household
  onUpdated: (updatedHousehold: Household) => void
}

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 55%)`
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const bg = nameToColor(name)

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold font-display flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

export default function TabGrupo({ household, onUpdated }: Props) {
  const supabase = useSupabase()
  const [name, setName] = useState(household.name)
  const [editingName, setEditingName] = useState(false)
  const [members, setMembers] = useState<string[]>(household.members)
  const [newMember, setNewMember] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resettingHash, setResettingHash] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/h/${household.hash}`
      : `/h/${household.hash}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Acesse nossos boletos: ${shareUrl}`
  )}`

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingName])

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === household.name) {
      setName(household.name)
      setEditingName(false)
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('households')
      .update({ name: trimmed })
      .eq('id', household.id)
      .select()
      .single()

    setSaving(false)
    setEditingName(false)

    if (!error && data) {
      onUpdated(data as Household)
    }
  }

  async function saveMembers(updatedMembers: string[]) {
    setSaving(true)
    const { data, error } = await supabase
      .from('households')
      .update({ members: updatedMembers })
      .eq('id', household.id)
      .select()
      .single()

    setSaving(false)

    if (!error && data) {
      onUpdated(data as Household)
    }
  }

  function addMember() {
    const trimmed = newMember.trim()
    if (!trimmed || members.includes(trimmed)) return
    const updated = [...members, trimmed]
    setMembers(updated)
    setNewMember('')
    saveMembers(updated)
  }

  function removeMember(m: string) {
    if (members.length <= 1) return
    const updated = members.filter(x => x !== m)
    setMembers(updated)
    saveMembers(updated)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function resetHash() {
    const ok = window.confirm(
      'Redefinir o link de acesso? O link atual deixará de funcionar. Todos os membros precisarão do novo link.'
    )
    if (!ok) return

    setResettingHash(true)

    const arr = new Uint8Array(12)
    crypto.getRandomValues(arr)
    const newHash = Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const { data, error } = await supabase
      .from('households')
      .update({ hash: newHash })
      .eq('id', household.id)
      .select()
      .single()

    setResettingHash(false)

    if (!error && data) {
      window.location.href = `${window.location.origin}/h/${newHash}`
    }
  }

  const createdAt = new Date(household.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24">

      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') { setName(household.name); setEditingName(false) }
              }}
              disabled={saving}
              className="font-display text-xl font-bold text-surface-800 bg-transparent border-b-2 border-brand-400 outline-none flex-1 pb-0.5"
            />
          ) : (
            <button
              className="font-display text-xl font-bold text-surface-800 hover:text-brand-600 transition-colors text-left"
              onClick={() => setEditingName(true)}
              title="Clique para editar o nome"
            >
              {household.name}
            </button>
          )}
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="text-surface-300 hover:text-surface-500 transition-colors text-sm"
              title="Editar nome"
            >
              ✏️
            </button>
          )}
        </div>
        <p className="text-sm text-surface-400 mt-0.5">
          {members.length} {members.length === 1 ? 'membro' : 'membros'} · criado em {createdAt}
        </p>
      </div>

      {/* 2 colunas no desktop */}
      <div className="md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-[1fr_1fr_auto] space-y-5 md:space-y-0">

        {/* Coluna 1: compartilhar */}
        <div className="bg-white border border-surface-100 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
            Compartilhar acesso
          </h2>

          <div className="bg-surface-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-surface-400 mb-0.5">Link de acesso</p>
            <p className="text-sm font-mono text-surface-700 break-all leading-relaxed">
              {shareUrl}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <span>📲</span>
              <span>Compartilhar via WhatsApp</span>
            </a>
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 border border-surface-200 hover:bg-surface-50 text-surface-700 text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar link'}</span>
            </button>
          </div>

          <div className="flex flex-col items-center pt-2">
            <p className="text-xs text-surface-400 mb-3">Ou escaneie o QR Code</p>
            <div className="p-3 bg-white border border-surface-100 rounded-xl shadow-sm">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          </div>
        </div>

        {/* Coluna 2: membros */}
        <div className="bg-white border border-surface-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide mb-4">
            Membros
          </h2>

          <div className="space-y-2 mb-3">
            {members.map(m => (
              <div key={m} className="flex items-center gap-3">
                <Avatar name={m} />
                <span className="flex-1 text-sm text-surface-700 font-medium">{m}</span>
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(m)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
                    title={`Remover ${m}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-xl border border-surface-200 bg-white text-surface-800 placeholder-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition text-sm"
              placeholder="Nome do novo membro..."
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
            />
            <button
              onClick={addMember}
              disabled={!newMember.trim() || saving}
              className="px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {/* Zona de perigo — linha completa */}
        <div className="md:col-span-2 lg:col-span-3 border border-red-100 rounded-2xl overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-100">
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
              Zona de perigo
            </h2>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-surface-800 mb-1">
              Redefinir link de acesso
            </p>
            <p className="text-xs text-surface-500 mb-3">
              Gera um novo link e invalida o atual. Use se o link foi compartilhado com alguém
              que não deveria ter acesso. Todos os membros precisarão do novo link.
            </p>
            <button
              onClick={resetHash}
              disabled={resettingHash}
              className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {resettingHash ? 'Redefinindo...' : '🔄 Redefinir link de acesso'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
