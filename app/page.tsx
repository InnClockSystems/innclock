'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress === 1) clearInterval(timer)
        }, 16)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: '#080b0e', color: '#f0f4f8' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,11,14,0.95)', backdropFilter: 'blur(20px)' }}
        className="flex items-center justify-between px-8 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#16a34a"/>
            <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2"/>
            <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="1.5" fill="white"/>
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Inn<span style={{ color: '#4ade80' }}>Clock</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}
            className="hover:text-white transition-colors px-3 py-2">
            Sign in
          </Link>
          <Link href="/signup"
            style={{ fontSize: '13px', background: '#16a34a', color: 'white', fontWeight: 600, padding: '8px 18px', borderRadius: '10px', letterSpacing: '-0.2px' }}
            className="hover:opacity-90 transition-opacity">
            Get started free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-8 py-28 text-center">
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(22,163,74,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        <div className="relative max-w-4xl mx-auto">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '100px', padding: '6px 14px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }}/>
            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600, letterSpacing: '0.5px' }}>BUILT FOR U.S. HOTEL OPERATORS</span>
          </div>

          <h1 style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: '24px' }}>
            The smarter time clock<br/>
            <span style={{ background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 50%, #15803d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              for hotel operators
            </span>
          </h1>

          <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            PIN clock-in, live timesheets, and one-click payroll export. From budget motels to boutique hotels — across all 50 states.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', padding: '14px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', boxShadow: '0 0 30px rgba(22,163,74,0.4)' }}
              className="hover:opacity-90 transition-all">
              Start free trial
            </Link>
            <Link href="/login"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '14px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 600 }}
              className="hover:bg-white/10 transition-all">
              Sign in to dashboard
            </Link>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '20px' }}>No credit card required · $30/mo per property · 🇺🇸 Made in the USA</p>

          {/* Mock dashboard preview */}
          <div style={{ marginTop: '60px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', maxWidth: '680px', margin: '60px auto 0' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}/>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}/>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[['Clocked In', '4', '#4ade80'], ['Total Staff', '12', '#94a3b8'], ['Hours Today', '18.5', '#94a3b8']].map(([label, val, col]) => (
                <div key={label as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: col as string }}>{val}</div>
                </div>
              ))}
            </div>
            {[['Maria Lopez', '8:02 AM', true], ['James Wright', '8:15 AM', true], ['Sandra Kim', '9:30 AM', true], ['Robert Chen', '--', false]].map(([name, time, active]) => (
              <div key={name as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: active ? '#4ade80' : '#374151', boxShadow: active ? '0 0 6px #4ade80' : 'none' }}/>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{name as string}</span>
                </div>
                <span style={{ fontSize: '12px', color: active ? '#4ade80' : '#475569' }}>
                  {active ? `In since ${time}` : 'Not clocked in'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand bar */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '20px 32px' }}>
        <div className="max-w-5xl mx-auto">
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Compatible with all major hotel brands</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {['Wyndham', 'IHG', 'Choice Hotels', 'Best Western', 'Marriott', 'Hilton', 'Hyatt', 'Independent'].map(brand => (
              <span key={brand} style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '100px' }}
                className="hover:border-green-800 hover:text-green-400 transition-all cursor-default">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '80px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { n: 50, suffix: ' states', label: 'Nationwide coverage' },
            { n: 30, suffix: '/mo', label: 'Flat monthly rate' },
            { n: 10, suffix: ' min', label: 'To get set up' },
          ].map(({ n, suffix, label }) => (
            <div key={label}>
              <div style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px', background: 'linear-gradient(135deg, #4ade80, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                <AnimatedCounter end={n} />{suffix}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — 6 cards */}
      <section style={{ padding: '100px 32px' }}>
        <div className="max-w-5xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px' }}>Everything a hotel operator needs</h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>No training required. No IT department. Just sign up and go.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { icon: '🕐', title: 'PIN clock-in', desc: 'Employees tap their name and enter a 4-digit PIN. 5 seconds. Works on any tablet, phone, or computer.' },
              { icon: '📋', title: 'Live timesheets', desc: 'See who\'s clocked in right now. Every pay period automatically calculated. No spreadsheets needed.' },
              { icon: '📄', title: 'PDF payroll export', desc: 'One-click payroll report every pay period. Hand it straight to your accountant or payroll processor.' },
              { icon: '🔒', title: 'Tamper-proof', desc: 'Server-set timestamps mean no employee can alter their time. Full immutable audit trail included.' },
              { icon: '👥', title: 'Unlimited staff', desc: 'Add every housekeeper, front desk agent, and maintenance worker. No per-seat fees. Ever.' },
              { icon: '📱', title: 'Any device', desc: 'iPad at the front desk. Laptop in the back office. Phone on the go. No app to install.' },
            ].map(f => (
              <div key={f.title}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px' }}
                className="hover:border-green-900 hover:bg-green-950/20 transition-all group">
                <div style={{ fontSize: '28px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* How it works */}
<section style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(16,185,129,0.1) 50%, rgba(22,163,74,0.15) 100%)', border: '1px solid rgba(74,222,128,0.2)', borderLeft: 'none', borderRight: 'none', padding: '80px 32px' }}>
  <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>
  <div className="max-w-4xl mx-auto">
    <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', textAlign: 'center', marginBottom: '12px', color: 'white' }}>Up and running in 10 minutes</h2>
    <p style={{ textAlign: 'center', color: '#86efac', marginBottom: '56px', fontSize: '15px' }}>No IT. No installation. No training manual.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
      {[
        { n: '01', t: 'Sign up', d: 'Create your account and enter your property name and timezone.' },
        { n: '02', t: 'Add your staff', d: 'Add each employee with their name and a secure 4-digit PIN.' },
        { n: '03', t: 'Go live', d: 'Bookmark the kiosk URL on your front desk tablet. You\'re done.' },
      ].map(s => (
        <div key={s.n} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(74,222,128,0.9)', marginBottom: '8px', letterSpacing: '-2px' }}>{s.n}</div> 
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{s.t}</h3>
          <p style={{ fontSize: '13px', color: '#86efac', lineHeight: 1.7 }}>{s.d}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Pricing */}
      <section style={{ padding: '100px 32px' }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '12px' }}>Simple pricing</h2>
            <p style={{ color: '#64748b' }}>One flat rate per property. No per-employee fees. No contracts.</p>
          </div>
          <div style={{ maxWidth: '360px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(22,163,74,0.4)', borderRadius: '20px', padding: '40px', textAlign: 'center', boxShadow: '0 0 60px rgba(22,163,74,0.1)' }}>
              <div style={{ display: 'inline-block', background: 'rgba(22,163,74,0.2)', color: '#4ade80', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '100px', letterSpacing: '1px', marginBottom: '20px', border: '1px solid rgba(22,163,74,0.3)' }}>
                EVERYTHING INCLUDED
              </div>
              <div style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, background: 'linear-gradient(135deg, #4ade80, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                $30
              </div>
              <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '32px' }}>per property / per month</div>
              <ul style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Unlimited employees', 'PIN clock-in kiosk', 'Live timesheets', 'PDF payroll export', 'Tamper-proof audit log', 'Cancel anytime'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                style={{ display: 'block', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, boxShadow: '0 0 20px rgba(22,163,74,0.3)', letterSpacing: '-0.2px' }}
                className="hover:opacity-90 transition-all">
                Start free trial →
              </Link>
              <p style={{ fontSize: '11px', color: '#475569', marginTop: '12px' }}>No credit card required to start</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', marginBottom: '16px' }}>
          Ready to modernize<br/>your hotel's payroll?
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>Join hotel operators across all 50 states running smarter with InnClock.</p>
        <Link href="/signup"
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', padding: '16px 36px', borderRadius: '14px', fontSize: '15px', fontWeight: 700, boxShadow: '0 0 40px rgba(22,163,74,0.3)', letterSpacing: '-0.3px' }}
          className="hover:opacity-90 transition-all">
          Get started for $30/mo →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 32px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#16a34a"/>
              <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2"/>
              <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Inn<span style={{ color: '#4ade80' }}>Clock</span></span>
            <span style={{ fontSize: '11px', color: '#334155' }}>· 🇺🇸 Made in the USA</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="/login" style={{ fontSize: '13px', color: '#475569' }} className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" style={{ fontSize: '13px', color: '#475569' }} className="hover:text-white transition-colors">Sign up</Link>
          </div>
          <span style={{ fontSize: '11px', color: '#334155' }}>© 2026 InnClock Systems. All rights reserved.</span>
        </div>
      </footer>

    </main>
  )
}