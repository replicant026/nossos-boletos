'use client'

import { useState } from 'react'
import { Household } from '@/lib/types'
import { useSupabase } from '@/lib/supabase-context'
import Modal from './Modal'

interface Props {
  household: Household
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function SettingsModal({ household, open, onClose, onUpdated }: Props) {
  const supabase = useSupabase()
  const [name, setName] = useState(household.name)
  const [members, setMembers] = useState<string[]>(household.members)
  const [newMember, setNewMember] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/h/${household.hash}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function addMember() {
    if (!newMember.trim() || members.includes(newMember.trim())) return
    setMembers([...members, newMember.trim()])
    setNewMember('')
  }

  function removeMember(m: string) {
    if (members.length <= 1) return
    setMembers(members.filter(x => x !== m))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('households')
      .update({ name: name.trim(), members })
      .eq('id', household.id)

    if (error) {
      alert('Erro: ' + error.message)
      setSaving(false)
      return
    }

    onUpdated()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurações">
      <div className="space-y-5">
        {/* Share link */}
        <div>
          <label className="label">Link de acesso</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input font-mono text-sm"
              value={shareUrl}
              readOnly
            />
            <button onClick={copyLink} className="btn-secondary whitespace-nowrap">
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-surface-400 mt-1.5">
            Compartilhe este link via WhatsApp para dar acesso
          </p>
        </div>

        {/* Group name */}
        <div>
          <label className="label">Nome do grupo</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Members */}
        <div>
          <label className="label">Membros</label>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m} className="flex items-center gap-2">
                <div className="flex-1 bg-surface-50 rounded-xl px-4 py-2.5 text-sm text-surface-700">
                  {m}
                </div>
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(m)}
                    className="text-surface-400 hover:text-danger-500 text-sm transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                className="input"
                placeholder="Adicionar membro..."
                value={newMember}
                onChange={e => setNewMember(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMember()}
              />
              <button onClick={addMember} className="btn-secondary">
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </Modal>
  )
}
