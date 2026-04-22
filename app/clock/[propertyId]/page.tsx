'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = {
  id: string
  name: string
  initials: string
  color: { bg: string; border: string; text: string }
  clocked_in: boolean
  department: string
}

type Property = {
  id: string
  name: string
  timezone: string
}

const COLORS = [
  { bg: 'rgba(22,163,74,0.15)', border: 'rgba(22,163,74,0.4)', text: '#4ade80' },
  { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#c084fc' },
  { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24' },
  { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)', text: '#f472b6' },
]

export default function ClockInPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = React.use(params)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [property, setProperty] = useState<Property | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selected, setSelected] = useState<Employee | null>(null)
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDept, setActiveDept] = useState<string>('all')

  useEffect(() => { loadProperty() }, [])

  useEffect(() => {
    if (!property) return
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { timeZone: property.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('en-US', { timeZone: property.timezone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [property])

  useEffect(() => {
    if (!selected) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handlePin(e.key)
      if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      if (e.key === 'Escape') { setSelected(null); setPin('') }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, pin])

  async function loadProperty() {
    const { data: prop } = await supabase.from('properties').select('id, name, timezone').eq('id', propertyId).single()
    if (!prop) { setLoading(false); return }
    setProperty(prop)
    await loadEmployees(prop.id)
  }

  async function loadEmployees(propertyId: string) {
    setLoading(true)
    const { data: emps } = await supabase.from('employees').select('id, name, department').eq('property_id', propertyId).eq('is_active', true)
    const { data: open } = await supabase.from('clock_entries').select('employee_id').eq('property_id', propertyId).is('clock_out', null)
    const openIds = new Set((open || []).map((e: any) => e.employee_id))
    setEmployees((emps || []).map((e: any, i: number) => ({
      id: e.id,
      name: e.name,
      department: e.department || 'Front Desk / Reception',
      initials: e.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      color: COLORS[i % COLORS.length],
      clocked_in: openIds.has(e.id),
    })))
    setLoading(false)
  }

  async function handlePinComplete(fullPin: string) {
    if (!selected || !property) return
    const res = await fetch('/api/clock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: selected.id, property_id: property.id, action: selected.clocked_in ? 'out' : 'in', pin: fullPin }),
    })
    const result = await res.json()
    if (result.success) {
      const clockTime = new Date(result.time).toLocaleTimeString('en-US', {
        timeZone: property.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      setMessage({ text: result.action === 'in' ? `Clocked in at ${clockTime}` : `Clocked out at ${clockTime}`, ok: true })
      setTimeout(() => { setSelected(null); setPin(''); setMessage(null); loadEmployees(property.id) }, 2500)
    } else {
      setMessage({ text: result.error || 'Something went wrong.', ok: false })
      setPin('')
    }
  }

  const handlePin = (val: string) => {
    if (pin.length >= 4) return
    const next = pin + val
    setPin(next)
    if (next.length === 4) setTimeout(() => handlePinComplete(next), 300)
  }

  const depts = ['All', ...Array.from(new Set(employees.map(e => e.department))).sort()]
  const filteredEmployees = activeDept === 'all' ? employees : employees.filter(e => e.department === activeDept)

  if (!loading && !property) {
    return (
      <main style={{ minHeight: '100vh', background: '#080b0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#475569', fontSize: '14px' }}>Property not found.</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080b0e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#f0f4f8' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#16a34a"/>
            <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2"/>
            <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="1.5" fill="white"/>
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Inn<span style={{ color: '#4ade80' }}>Clock</span>
          </span>
        </div>
        {property && <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>{property.name}</div>}
        <div style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: 'white', fontVariantNumeric: 'tabular-nums' }}>{time}</div>
        <div style={{ fontSize: '14px', color: '#475569', marginTop: '8px' }}>{date}</div>
      </div>

      {!selected ? (
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
            Select your name to clock in or out
          </p>

          {/* Department tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {depts.map(dept => (
              <button key={dept} onClick={() => setActiveDept(dept === 'All' ? 'all' : dept)}
                style={{ padding: '7px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: (dept === 'All' && activeDept === 'all') || activeDept === dept ? '#16a34a' : 'rgba(255,255,255,0.05)',
                  color: (dept === 'All' && activeDept === 'all') || activeDept === dept ? 'white' : '#64748b',
                  boxShadow: (dept === 'All' && activeDept === 'all') || activeDept === dept ? '0 0 10px rgba(22,163,74,0.3)' : 'none',
                }}>
                {dept}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#334155', fontSize: '14px' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredEmployees.map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', background: e.clocked_in ? e.color.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${e.clocked_in ? e.color.border : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: e.color.bg, border: `1.5px solid ${e.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: e.color.text, flexShrink: 0 }}>
                    {e.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>{e.name}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{e.department}</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: e.clocked_in ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)', color: e.clocked_in ? '#4ade80' : '#475569', border: `1px solid ${e.clocked_in ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                    {e.clocked_in ? '● In' : 'Out'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: selected.color.bg, border: `2px solid ${selected.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: selected.color.text, margin: '0 auto 12px' }}>
            {selected.initials}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selected.name}</div>
          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '28px' }}>
            {selected.clocked_in ? 'Enter PIN to clock out' : 'Enter PIN to clock in'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', transition: 'all 0.15s', background: i < pin.length ? '#16a34a' : 'rgba(255,255,255,0.08)', border: `2px solid ${i < pin.length ? '#4ade80' : 'rgba(255,255,255,0.15)'}`, boxShadow: i < pin.length ? '0 0 8px rgba(74,222,128,0.5)' : 'none' }}/>
            ))}
          </div>

          {message && (
            <div style={{ background: message.ok ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.ok ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', padding: '10px 16px', fontSize: '14px', color: message.ok ? '#4ade80' : '#fca5a5', marginBottom: '20px' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((n, i) => (
              <button key={i}
                onClick={() => n === '⌫' ? setPin(p => p.slice(0, -1)) : n !== '' ? handlePin(String(n)) : null}
                style={{ height: '60px', borderRadius: '12px', fontSize: '20px', fontWeight: 600, cursor: n === '' ? 'default' : 'pointer', border: 'none', transition: 'all 0.1s', visibility: n === '' ? 'hidden' : 'visible', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => { setSelected(null); setPin('') }}
            style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
            ← Cancel
          </button>
        </div>
      )}
    </main>
  )
}