'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080b0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', textDecoration: 'none' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#16a34a"/>
          <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2"/>
          <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="16" cy="16" r="1.5" fill="white"/>
        </svg>
        <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', color: 'white' }}>
          Inn<span style={{ color: '#4ade80' }}>Clock</span>
        </span>
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '6px', letterSpacing: '-0.5px' }}>Owner sign in</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>Access your property dashboard.</p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', background: loading ? 'rgba(22,163,74,0.3)' : 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(22,163,74,0.3)', letterSpacing: '-0.2px' }}>
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>Get started free</Link>
        </p>
      </div>

      <p style={{ fontSize: '11px', color: '#1e293b', marginTop: '24px' }}>
        🇺🇸 InnClock · Made in the USA
      </p>
    </main>
  )
}