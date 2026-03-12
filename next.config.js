/** @type {import('next').NextConfig} */

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : 'mkrjpkqczjhgeyxhemwq.supabase.co'

const securityHeaders = [
  // Content-Security-Policy é gerado dinamicamente pelo middleware (src/middleware.ts)
  // com um nonce por request — sem 'unsafe-inline' em script-src.

  // #13 — MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // #14 — Clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // #15 — Referrer leakage
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Bônus: força HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Bônus: desativa permissões de browser desnecessárias
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
