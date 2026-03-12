'use client'

import { createContext, useContext, useMemo } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({
  hash,
  children,
}: {
  hash: string
  children: React.ReactNode
}) {
  const client = useMemo(
    () =>
      createClient(supabaseUrl, supabaseKey, {
        global: { headers: { 'x-household-hash': hash } },
      }),
    [hash]
  )

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseClient {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider')
  return ctx
}

/** Cria um client Supabase com o hash do household injetado no header.
 *  Use diretamente em componentes que não estão dentro do SupabaseProvider. */
export function createHouseholdClient(hash: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { 'x-household-hash': hash } },
  })
}
