'use client'

import { supabase } from '@/lib/supabase'
import React, { useState, useEffect } from 'react'

type Employee = {
  id: string
  name: string
  initials: string
  color: string
  clocked_in: boolean
}

type Property = {
  id: string
  name: string
  timezone: string
}

const COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-teal-100 text-teal-800',
  'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800',
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

  useEffect(() => {
    loadProperty()
  }, [])

  useEffect(() => {
    if (!property) return
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { timeZone: property.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('en-US', { timeZone: property.timezone, weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [property])

  async function loadProperty() {
    const { data: prop } = await supabase
      .from('properties')
      .select('id, name, timezone')
      .eq('id', propertyId)
      .single()
  
    if (!prop) { setLoading(false); return }
    setProperty(prop)
    await loadEmployees(prop.id)
  }

  async function loadEmployees(propertyId: string) {
    setLoading(true)
    const { data: emps } = await supabase
      .from('employees')
      .select('id, name')
      .eq('property_id', propertyId)
      .eq('is_active', true)

    const { data: open } = await supabase
      .from('clock_entries')
      .select('employee_id')
      .eq('property_id', propertyId)
      .is('clock_out', null)

    const openIds = new Set((open || []).map((e: any) => e.employee_id))

    setEmployees((emps || []).map((e: any, i: number) => ({
      id: e.id,
      name: e.name,
      initials: e.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      color: COLORS[i % COLORS.length],
      clocked_in: openIds.has(e.id),
    })))
    setLoading(false)
  }

  async function handlePinComplete(fullPin: string) {
    if (!selected || !property) return

    const res = await fetch('/api/clock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: selected.id,
        property_id: property.id,
        action: selected.clocked_in ? 'out' : 'in',
        pin: fullPin,
      }),
    })

    const result = await res.json()
    if (result.success) {
      setMessage({ text: result.action === 'in' ? 'Clocked in!' : 'Clocked out!', ok: true })
      setTimeout(() => {
        setSelected(null)
        setPin('')
        setMessage(null)
        loadEmployees(property.id)
      }, 2000)
    } else {
      setMessage({ text: 'Incorrect PIN. Try again.', ok: false })
      setPin('')
    }
  }

  const handlePin = (val: string) => {
    if (pin.length >= 4) return
    const next = pin + val
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => handlePinComplete(next), 300)
    }
  }

  if (!loading && !property) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Property not found.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">InnClock</h1>
        {property && <p className="text-sm text-gray-400 mt-1">{property.name}</p>}
        <p className="text-4xl font-medium text-gray-800 mt-2">{time}</p>
        <p className="text-sm text-gray-500 mt-1">{date}</p>
      </div>

      {!selected ? (
        <div className="w-full max-w-sm">
          <p className="text-sm text-gray-500 text-center mb-4">Select your name to clock in or out</p>
          {loading ? (
            <p className="text-center text-gray-400 text-sm">Loading...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {employees.map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  className={`flex items-center gap-4 bg-white border rounded-2xl px-5 py-4 transition-all ${e.clocked_in ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${e.color}`}>
                    {e.initials}
                  </div>
                  <span className="text-gray-800 font-medium flex-1 text-left">{e.name}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${e.clocked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.clocked_in ? '● In' : 'Out'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xs text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-medium text-lg mx-auto mb-2 ${selected.color}`}>
            {selected.initials}
          </div>
          <p className="font-medium text-gray-800 mb-1">{selected.name}</p>
          <p className="text-sm text-gray-500 mb-6">
            {selected.clocked_in ? 'Enter PIN to clock out' : 'Enter PIN to clock in'}
          </p>

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} />
            ))}
          </div>

          {message && (
            <div className={`text-sm rounded-xl px-4 py-2 mb-4 ${message.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((n, i) => (
              <button key={i}
                onClick={() => n === '⌫' ? setPin(p => p.slice(0, -1)) : n !== '' ? handlePin(String(n)) : null}
                className={`h-14 rounded-2xl text-xl font-medium transition-all ${n === '' ? 'invisible' : 'bg-white border border-gray-200 text-gray-800 hover:bg-blue-50 hover:border-blue-300 active:scale-95'}`}>
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => { setSelected(null); setPin('') }}
            className="text-sm text-gray-400 hover:text-gray-600 mt-2">
            Cancel
          </button>
        </div>
      )}
    </main>
  )
}