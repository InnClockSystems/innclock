'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

const PROPERTY_ID = '7aef13c5-d537-4600-9061-c1993fef9b2d'

type Employee = {
  id: string
  name: string
  is_active: boolean
  clocked_in: boolean
  clock_in_time: string | null
}

type ClockEntry = {
  id: string
  employee_id: string
  employee_name: string
  clock_in: string
  clock_out: string | null
  hours: number | null
}

function getPayPeriod(date: Date) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 13)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<ClockEntry[]>([])
  const [tab, setTab] = useState<'overview' | 'timesheets' | 'employees'>('overview')
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const supabase = createClient()

  const { start, end } = getPayPeriod(new Date())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)

    const { data: emps } = await supabase
      .from('employees')
      .select('id, name, is_active')
      .eq('property_id', PROPERTY_ID)

    const { data: open } = await supabase
      .from('clock_entries')
      .select('employee_id, clock_in')
      .eq('property_id', PROPERTY_ID)
      .is('clock_out', null)

    const openMap = new Map((open || []).map((e: any) => [e.employee_id, e.clock_in]))

    setEmployees((emps || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      is_active: e.is_active,
      clocked_in: openMap.has(e.id),
      clock_in_time: openMap.get(e.id) || null,
    })))

    const { data: periodEntries } = await supabase
      .from('clock_entries')
      .select('id, employee_id, clock_in, clock_out, employees(name)')
      .eq('property_id', PROPERTY_ID)
      .gte('clock_in', start.toISOString())
      .lte('clock_in', end.toISOString())
      .order('clock_in', { ascending: false })

    setEntries((periodEntries || []).map((e: any) => ({
      id: e.id,
      employee_id: e.employee_id,
      employee_name: e.employees?.name || 'Unknown',
      clock_in: e.clock_in,
      clock_out: e.clock_out,
      hours: e.clock_out
        ? Math.round(((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000) * 100) / 100
        : null,
    })))

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function addEmployee() {
    if (!newName.trim()) { setAddMsg('Please enter a name.'); return }
    if (!/^\d{4}$/.test(newPin)) { setAddMsg('PIN must be exactly 4 digits.'); return }

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), pin: newPin, property_id: PROPERTY_ID }),
    })
    const result = await res.json()
    if (result.success) {
      setNewName('')
      setNewPin('')
      setAddMsg('Employee added!')
      loadData()
      setTimeout(() => setAddMsg(''), 3000)
    } else {
      setAddMsg('Something went wrong.')
    }
  }

  async function toggleEmployee(id: string, active: boolean) {
    await supabase.from('employees').update({ is_active: !active }).eq('id', id)
    loadData()
  }

  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const clockedInCount = employees.filter(e => e.clocked_in).length

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">InnClock</h1>
            <p className="text-sm text-gray-500 mt-1">Sunset Inn — Owner Dashboard</p>
          </div>
          <button onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl px-4 py-2">
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-2xl p-1 w-fit">
          {(['overview', 'timesheets', 'employees'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Currently clocked in</p>
                    <p className="text-3xl font-semibold text-gray-900">{clockedInCount}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total employees</p>
                    <p className="text-3xl font-semibold text-gray-900">{employees.filter(e => e.is_active).length}</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Hours this period</p>
                    <p className="text-3xl font-semibold text-gray-900">{totalHours.toFixed(1)}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">Employee status</h2>
                  <div className="flex flex-col gap-3">
                    {employees.filter(e => e.is_active).map(e => (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${e.clocked_in ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-800">{e.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {e.clocked_in ? `In since ${formatTime(e.clock_in_time!)}` : 'Not clocked in'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TIMESHEETS TAB */}
            {tab === 'timesheets' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-700">Pay period</h2>
                  <span className="text-xs text-gray-500">
                    {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {employees.filter(e => e.is_active).map(emp => {
                  const empEntries = entries.filter(e => e.employee_id === emp.id)
                  const empTotal = empEntries.reduce((s, e) => s + (e.hours || 0), 0)
                  return (
                    <div key={emp.id} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{emp.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{empTotal.toFixed(2)} hrs</span>
                      </div>
                      {empEntries.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-2">No entries this period</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {empEntries.map(e => (
                            <div key={e.id} className="flex items-center gap-3 text-xs text-gray-500 pl-2">
                              <span className="w-24">{formatDate(e.clock_in)}</span>
                              <span className="text-green-600">▶ {formatTime(e.clock_in)}</span>
                              <span className="text-red-500">◼ {e.clock_out ? formatTime(e.clock_out) : '—'}</span>
                              <span className="ml-auto font-medium text-gray-700">{e.hours ? `${e.hours}h` : 'Active'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-b border-gray-100 mt-3" />
                    </div>
                  )
                })}

                <div className="flex justify-between pt-2">
                  <span className="text-sm font-medium text-gray-700">Total hours</span>
                  <span className="text-sm font-semibold text-gray-900">{totalHours.toFixed(2)} hrs</span>
                </div>
              </div>
            )}

            {/* EMPLOYEES TAB */}
            {tab === 'employees' && (
              <div>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">Add employee</h2>
                  <div className="flex gap-3 mb-3">
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="Full name"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
                    <input value={newPin} onChange={e => setNewPin(e.target.value)}
                      placeholder="4-digit PIN" maxLength={4}
                      className="w-32 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  {addMsg && (
                    <p className={`text-xs mb-3 ${addMsg.includes('added') ? 'text-green-600' : 'text-red-500'}`}>{addMsg}</p>
                  )}
                  <button onClick={addEmployee}
                    className="bg-gray-900 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-gray-700 transition-all">
                    Add employee
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h2 className="text-sm font-medium text-gray-700 mb-4">All employees</h2>
                  <div className="flex flex-col gap-3">
                    {employees.map(e => (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${e.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`text-sm ${e.is_active ? 'text-gray-800' : 'text-gray-400'}`}>{e.name}</span>
                        </div>
                        <button onClick={() => toggleEmployee(e.id, e.is_active)}
                          className={`text-xs px-3 py-1 rounded-full border transition-all ${e.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {e.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}