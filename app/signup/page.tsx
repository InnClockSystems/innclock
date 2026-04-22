'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Signup() {
  const [step, setStep] = useState<'account' | 'property' | 'plan'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreateAccount() {
    if (!email || !password || !ownerName) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setStep('property')
  }

  async function handlePropertyStep() {
    if (!propertyName) { setError('Please enter your property name.'); return }
    setError('')
    setStep('plan')
  }

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ownerName, propertyName, timezone }),
    })
    const result = await res.json()
    if (result.error) { setError(result.error); setLoading(false); return }
    if (result.checkoutUrl) window.location.href = result.checkoutUrl
  }

  const steps = ['account', 'property', 'plan']
  const currentIndex = steps.indexOf(step)

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

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
              background: currentIndex > i ? '#16a34a' : currentIndex === i ? '#16a34a' : 'rgba(255,255,255,0.06)',
              color: currentIndex >= i ? 'white' : '#475569',
              border: currentIndex === i ? '2px solid #4ade80' : '2px solid transparent',
              boxShadow: currentIndex === i ? '0 0 12px rgba(74,222,128,0.4)' : 'none',
            }}>
              {currentIndex > i ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : i + 1}
            </div>
            {i < 2 && (
              <div style={{ width: '32px', height: '1px', background: currentIndex > i ? '#16a34a' : 'rgba(255,255,255,0.1)' }}/>
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>

        {/* Step 1 — Account */}
        {step === 'account' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '6px', letterSpacing: '-0.5px' }}>Create your account</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Get started in minutes. No credit card required.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>FULL NAME</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                placeholder="Jane Doe"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>{error}</div>}

            <button onClick={handleCreateAccount}
              style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(22,163,74,0.3)', letterSpacing: '-0.2px' }}>
              Continue →
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginTop: '16px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        )}

        {/* Step 2 — Property */}
        {step === 'property' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '6px', letterSpacing: '-0.5px' }}>Your property</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Tell us about your hotel or property.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>PROPERTY NAME</label>
              <input value={propertyName} onChange={e => setPropertyName(e.target.value)}
                placeholder="Sunset Inn"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.3px' }}>TIMEZONE</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)}
                style={{ width: '100%', background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Phoenix">Arizona Time</option>
                <option value="America/Anchorage">Alaska Time</option>
                <option value="Pacific/Honolulu">Hawaii Time</option>
              </select>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>{error}</div>}

            <button onClick={handlePropertyStep}
              style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(22,163,74,0.3)', marginBottom: '12px' }}>
              Continue →
            </button>
            <button onClick={() => { setStep('account'); setError('') }}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
              ← Back
            </button>
          </>
        )}

        {/* Step 3 — Plan */}
        {step === 'plan' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '6px', letterSpacing: '-0.5px' }}>Start your subscription</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Everything included. Cancel anytime.</p>

            <div style={{ border: '1px solid rgba(22,163,74,0.4)', borderRadius: '14px', padding: '20px', marginBottom: '20px', background: 'rgba(22,163,74,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>InnClock</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#4ade80', letterSpacing: '-1px' }}>$30</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Unlimited employees', 'PIN clock-in kiosk', 'Live timesheets', 'PDF payroll export', 'Tamper-proof logs', 'Cancel anytime'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>{error}</div>}
            {loading && <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>Setting up your account...</div>}

            <button onClick={handleSubscribe} disabled={loading}
              style={{ width: '100%', background: loading ? 'rgba(22,163,74,0.3)' : 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(22,163,74,0.3)', marginBottom: '12px' }}>
              {loading ? 'Setting up...' : 'Subscribe for $30/mo →'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#334155', marginBottom: '12px' }}>
              Secure payment via Stripe · Cancel anytime
            </p>

            <button onClick={() => { setStep('property'); setError('') }}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </main>
  )
}