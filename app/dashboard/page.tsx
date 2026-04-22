'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

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
  edited_at?: string
  edited_by_email?: string
  edit_reason?: string
  edit_count?: number
  original_clock_in?: string
  original_clock_out?: string
  deleted_at?: string
  deleted_by_email?: string
  delete_reason?: string
  edit_history?: EditRecord[]
}

type EditRecord = {
  id: string
  edited_at: string
  edited_by_email: string
  edit_reason: string
  previous_clock_in: string
  previous_clock_out: string | null
  new_clock_in: string
  new_clock_out: string | null
}

type Property = {
  id: string
  name: string
  timezone: string
  pay_period_start_day: number
  pay_period_length: number
  trial_ends_at: string
  subscription_status: string
}

function getPayPeriod(date: Date, startDay: number = 1, length: number = 14) {
  const d = new Date(date)
  const currentDay = d.getDay()
  let diff = currentDay - startDay
  if (diff < 0) diff += 7
  const periodStart = new Date(d)
  periodStart.setDate(d.getDate() - diff)
  periodStart.setHours(0, 0, 0, 0)
  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodStart.getDate() + length - 1)
  periodEnd.setHours(23, 59, 59, 999)
  return { start: periodStart, end: periodEnd }
}

function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const [property, setProperty] = useState<Property | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<ClockEntry[]>([])
  const [newDept, setNewDept] = useState('Front Desk / Reception')
  const [tab, setTab] = useState<'overview' | 'timesheets' | 'employees' | 'settings'>('overview')
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const [welcome, setWelcome] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [payStartDay, setPayStartDay] = useState(1)
  const [payLength, setPayLength] = useState(14)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [lockedEmployees, setLockedEmployees] = useState<Set<string>>(new Set())
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editClockIn, setEditClockIn] = useState('')
  const [editClockOut, setEditClockOut] = useState('')
  const [editReason, setEditReason] = useState('')
  const [editMsg, setEditMsg] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekEntries, setWeekEntries] = useState<ClockEntry[]>([])
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteMsg, setDeleteMsg] = useState('')
  const supabase = createClient()

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const monday = new Date()
    const day = monday.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + diff + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('welcome') === 'true') {
        setWelcome(true)
        setTimeout(() => setWelcome(false), 5000)
      }
    }
    loadProperty()
  }, [])

  useEffect(() => {
    if (property) loadWeekEntries(property, weekDays)
  }, [weekOffset, property])

  async function loadProperty() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: prop } = await supabase.from('properties')
      .select('id, name, timezone, pay_period_start_day, pay_period_length, trial_ends_at, subscription_status')
      .eq('owner_email', user.email).single()
    if (!prop) { setLoading(false); return }
    setProperty(prop)
    setPayStartDay(prop.pay_period_start_day ?? 1)
    setPayLength(prop.pay_period_length ?? 14)
    await loadData(prop)
  }

  async function loadData(prop: Property) {
    const { start, end } = getPayPeriod(new Date(), prop.pay_period_start_day ?? 1, prop.pay_period_length ?? 14)
    const { data: emps } = await supabase.from('employees').select('id, name, is_active').eq('property_id', prop.id)
    const { data: open } = await supabase.from('clock_entries').select('employee_id, clock_in').eq('property_id', prop.id).is('clock_out', null)
    const openMap = new Map((open || []).map((e: any) => [e.employee_id, e.clock_in]))
    const mappedEmps = (emps || []).map((e: any) => ({
      id: e.id, name: e.name, is_active: e.is_active,
      clocked_in: openMap.has(e.id), clock_in_time: openMap.get(e.id) || null,
    }))
    setEmployees(mappedEmps)
    await checkLockedEmployees(mappedEmps)

    const { data: periodData } = await supabase.from('clock_entries')
      .select('id, employee_id, clock_in, clock_out, edited_at, edited_by_email, edit_reason, edit_count, original_clock_in, original_clock_out, deleted_at, deleted_by_email, delete_reason, employees(name)')
      .eq('property_id', prop.id)
      .gte('clock_in', start.toISOString())
      .lte('clock_in', end.toISOString())
      .order('clock_in', { ascending: true })

    setEntries((periodData || []).map((e: any) => ({
      id: e.id, employee_id: e.employee_id, employee_name: e.employees?.name || 'Unknown',
      clock_in: e.clock_in, clock_out: e.clock_out,
      edited_at: e.edited_at, edited_by_email: e.edited_by_email, edit_reason: e.edit_reason,
      edit_count: e.edit_count || 0,
      original_clock_in: e.original_clock_in, original_clock_out: e.original_clock_out,
      deleted_at: e.deleted_at, deleted_by_email: e.deleted_by_email, delete_reason: e.delete_reason,
      hours: e.clock_out ? Math.round(((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000) * 100) / 100 : null,
    })))
    setLoading(false)
    await loadWeekEntries(prop, weekDays)
  }

  async function loadWeekEntries(prop: Property, days: Date[]) {
    const start = days[0]
    const end = new Date(days[6])
    end.setHours(23, 59, 59, 999)
    const { data } = await supabase.from('clock_entries')
      .select('id, employee_id, clock_in, clock_out, edited_at, edited_by_email, edit_reason, edit_count, original_clock_in, original_clock_out, deleted_at, deleted_by_email, delete_reason, employees(name)')
      .eq('property_id', prop.id)
      .gte('clock_in', start.toISOString())
      .lte('clock_in', end.toISOString())
      .order('clock_in', { ascending: true })

    const rawEntries = data || []
    const entryIds = rawEntries.map((e: any) => e.id)
    let editHistoryMap: Record<string, EditRecord[]> = {}

    if (entryIds.length > 0) {
      const { data: edits } = await supabase
        .from('clock_entry_edits').select('*')
        .in('clock_entry_id', entryIds)
        .order('edited_at', { ascending: true })
      ;(edits || []).forEach((edit: any) => {
        if (!editHistoryMap[edit.clock_entry_id]) editHistoryMap[edit.clock_entry_id] = []
        editHistoryMap[edit.clock_entry_id].push(edit)
      })
    }

    setWeekEntries(rawEntries.map((e: any) => ({
      id: e.id, employee_id: e.employee_id, employee_name: e.employees?.name || 'Unknown',
      clock_in: e.clock_in, clock_out: e.clock_out,
      edited_at: e.edited_at, edited_by_email: e.edited_by_email, edit_reason: e.edit_reason,
      edit_count: e.edit_count || 0, original_clock_in: e.original_clock_in, original_clock_out: e.original_clock_out,
      deleted_at: e.deleted_at, deleted_by_email: e.deleted_by_email, delete_reason: e.delete_reason,
      edit_history: editHistoryMap[e.id] || [],
      hours: e.clock_out ? Math.round(((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000) * 100) / 100 : null,
    })))
  }

  async function checkLockedEmployees(emps: Employee[]) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const locked = new Set<string>()
    for (const emp of emps) {
      const { count } = await supabase.from('pin_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', emp.id).eq('success', false)
        .gte('attempted_at', fifteenMinutesAgo)
      if ((count ?? 0) >= 5) locked.add(emp.id)
    }
    setLockedEmployees(locked)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function addEmployee() {
    if (!property) return
    if (!newName.trim()) { setAddMsg('Please enter a name.'); return }
    if (!/^\d{4}$/.test(newPin)) { setAddMsg('PIN must be exactly 4 digits.'); return }
    const res = await fetch('/api/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), pin: newPin, property_id: property.id, department: newDept }),
    })
    const result = await res.json()
    if (result.success) {
      setNewName(''); setNewPin(''); setAddMsg('Employee added!'); setNewDept('Front Desk / Reception')
      loadData(property); setTimeout(() => setAddMsg(''), 3000)
    } else { setAddMsg('Something went wrong.') }
  }

  async function toggleEmployee(id: string, active: boolean) {
    await supabase.from('employees').update({ is_active: !active }).eq('id', id)
    if (property) loadData(property)
  }

  async function unlockEmployee(id: string) {
    const res = await fetch('/api/unlock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: id }),
    })
    const result = await res.json()
    if (result.success) {
      setAddMsg('Employee unlocked!')
      setTimeout(() => setAddMsg(''), 3000)
      if (property) loadData(property)
    }
  }

  async function savePayPeriodSettings() {
    if (!property) return
    const { error } = await supabase.from('properties')
      .update({ pay_period_start_day: payStartDay, pay_period_length: payLength })
      .eq('id', property.id)
    if (!error) {
      const updated = { ...property, pay_period_start_day: payStartDay, pay_period_length: payLength }
      setProperty(updated)
      setSettingsMsg('Settings saved!')
      loadData(updated)
      setTimeout(() => setSettingsMsg(''), 3000)
    } else { setSettingsMsg('Something went wrong.') }
  }

  async function saveTimeEdit(entryId: string) {
    if (!editReason.trim()) { setEditMsg('Please enter a reason for the edit.'); return }
    if (!property) return
    const { data: { user } } = await supabase.auth.getUser()
    const entry = weekEntries.find(e => e.id === entryId) || entries.find(e => e.id === entryId)
    if (!entry) return
    const newClockIn = new Date(editClockIn).toISOString()
    const newClockOut = editClockOut ? new Date(editClockOut).toISOString() : null

    await supabase.from('clock_entry_edits').insert({
      clock_entry_id: entryId, property_id: property.id,
      edited_by_email: user?.email || 'owner', edit_reason: editReason,
      previous_clock_in: entry.clock_in, previous_clock_out: entry.clock_out,
      new_clock_in: newClockIn, new_clock_out: newClockOut,
      edited_at: new Date().toISOString(),
    })

    const { error } = await supabase.from('clock_entries').update({
      clock_in: newClockIn, clock_out: newClockOut,
      edited_at: new Date().toISOString(), edited_by_email: user?.email,
      edit_reason: editReason,
      original_clock_in: entry.original_clock_in || entry.clock_in,
      original_clock_out: entry.original_clock_out || entry.clock_out,
      edit_count: (entry.edit_count || 0) + 1,
    }).eq('id', entryId)

    if (error) { setEditMsg('Something went wrong.'); return }

    await supabase.from('audit_log').insert({
      property_id: property.id, action: 'time_edit',
      performed_by: user?.email || 'owner',
      details: { entry_id: entryId, previous_in: entry.clock_in, previous_out: entry.clock_out, new_in: newClockIn, new_out: newClockOut, reason: editReason }
    })

    setEditingEntry(null); setEditReason(''); setEditMsg('')
    loadWeekEntries(property, weekDays)
  }

  async function deleteTimeEntry(entryId: string) {
    if (!deleteReason.trim()) { setDeleteMsg('Please enter a reason.'); return }
    if (!property) return
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clock_entries').update({
      deleted_at: new Date().toISOString(),
      deleted_by_email: user?.email,
      delete_reason: deleteReason,
    }).eq('id', entryId)
    if (error) { setDeleteMsg('Something went wrong.'); return }
    await supabase.from('audit_log').insert({
      property_id: property.id, action: 'time_delete',
      performed_by: user?.email || 'owner',
      details: { entry_id: entryId, reason: deleteReason }
    })
    setDeletingEntry(null); setDeleteReason(''); setDeleteMsg('')
    loadWeekEntries(property, weekDays)
  }

  async function exportPayroll() {
    if (!property) return
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      const { start, end } = getPayPeriod(new Date(), property.pay_period_start_day ?? 1, property.pay_period_length ?? 14)
      doc.setFontSize(18)
      doc.text('InnClock — Payroll Report', 14, 20)
      doc.setFontSize(11); doc.setTextColor(100)
      doc.text(property.name, 14, 30)
      doc.text(`Pay period: ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 14, 38)
      const rows: any[] = []
      employees.filter(e => e.is_active).forEach(emp => {
        const empEntries = entries.filter(e => e.employee_id === emp.id)
        const empTotal = empEntries.reduce((s, e) => s + (e.hours || 0), 0)
        if (empEntries.length === 0) { rows.push([emp.name, '—', '—', '—', '—', '0.00 hrs', '']); return }
        empEntries.forEach((entry, i) => {
          let notes = ''
          if (entry.deleted_at) {
            notes = `DELETED — ${entry.delete_reason}`
          } else if (entry.edited_at) {
            notes = `Edited ${entry.edit_count || 1}x\nOriginal: ${entry.original_clock_in ? formatTime(entry.original_clock_in, tz) : '?'} → ${entry.original_clock_out ? formatTime(entry.original_clock_out, tz) : '?'}\nReason: ${entry.edit_reason}`
          }
          rows.push([
            i === 0 ? emp.name : '',
            formatDate(entry.clock_in, tz),
            entry.deleted_at ? 'DELETED' : formatTime(entry.clock_in, tz),
            entry.deleted_at ? '—' : (entry.clock_out ? formatTime(entry.clock_out, tz) : 'Active'),
            entry.deleted_at ? '—' : (entry.hours ? `${entry.hours}h` : '—'),
            i === empEntries.length - 1 ? `${empTotal.toFixed(2)} hrs` : '',
            notes,
          ])
        })
      })
      autoTable(doc, {
        head: [['Employee', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Total', 'Notes']],
        body: rows, startY: 48,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 163, 74] },
        columnStyles: { 6: { cellWidth: 50, textColor: [220, 53, 69], fontStyle: 'italic' } }
      })
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(11); doc.setTextColor(0)
      doc.text(`Total hours all employees: ${totalHours.toFixed(2)} hrs`, 14, finalY)
      const editedCount = entries.filter(e => e.edited_at && !e.deleted_at).length
      const deletedCount = entries.filter(e => e.deleted_at).length
      if (editedCount > 0 || deletedCount > 0) {
        doc.setFontSize(9); doc.setTextColor(220, 53, 69)
        const notes = []
        if (editedCount > 0) notes.push(`${editedCount} entr${editedCount === 1 ? 'y was' : 'ies were'} manually edited by management`)
        if (deletedCount > 0) notes.push(`${deletedCount} entr${deletedCount === 1 ? 'y was' : 'ies were'} deleted by management`)
        doc.text(`* ${notes.join('. ')}. Full details noted above.`, 14, finalY + 8)
      }
      doc.save(`${property.name.replace(/ /g, '_')}_payroll_${start.toISOString().slice(0, 10)}.pdf`)
    } catch (err) { alert('Could not export PDF. Please try again.') }
    setExporting(false)
  }

  const { start, end } = getPayPeriod(new Date(), property?.pay_period_start_day ?? 1, property?.pay_period_length ?? 14)
  const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const clockedInCount = employees.filter(e => e.clocked_in).length
  const tz = property?.timezone || 'America/Chicago'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' as const }
  const selectStyle = { width: '100%', background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'white', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }

  const toLocal = (iso: string) => {
    const d = new Date(iso)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080b0e', color: '#f0f4f8' }}>

      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,11,14,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#16a34a"/>
            <circle cx="16" cy="16" r="9" stroke="white" strokeWidth="2"/>
            <path d="M16 10v6l4 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="1.5" fill="white"/>
          </svg>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>Inn<span style={{ color: '#4ade80' }}>Clock</span></span>
            {property && <span style={{ fontSize: '12px', color: '#475569', marginLeft: '10px' }}>{property.name}</span>}
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>
          Sign out
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {welcome && (
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Welcome to InnClock! Your property is set up and ready to go.
          </div>
        )}

        {property && property.subscription_status === 'trial' && (() => {
          const daysLeft = Math.ceil((new Date(property.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const isExpired = daysLeft <= 0
          const isUrgent = daysLeft <= 3
          return (
            <div style={{ background: isExpired ? 'rgba(239,68,68,0.1)' : isUrgent ? 'rgba(245,158,11,0.1)' : 'rgba(22,163,74,0.05)', border: `1px solid ${isExpired ? 'rgba(239,68,68,0.3)' : isUrgent ? 'rgba(245,158,11,0.3)' : 'rgba(22,163,74,0.2)'}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{isExpired ? '⚠️' : isUrgent ? '⏰' : '🎉'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isExpired ? '#f87171' : isUrgent ? '#fbbf24' : '#4ade80' }}>
                    {isExpired ? 'Your free trial has expired' : `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    {isExpired ? 'Subscribe to keep using InnClock' : 'Subscribe anytime to keep your data and continue uninterrupted'}
                  </div>
                </div>
              </div>
              <a href="/signup" style={{ background: isExpired ? '#ef4444' : '#16a34a', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {isExpired ? 'Subscribe now' : 'Upgrade →'}
              </a>
            </div>
          )
        })()}

        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {(['overview', 'timesheets', 'employees', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', textTransform: 'capitalize',
                background: tab === t ? '#16a34a' : 'transparent',
                color: tab === t ? 'white' : '#64748b',
                boxShadow: tab === t ? '0 0 12px rgba(22,163,74,0.3)' : 'none',
              }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#475569', padding: '60px', fontSize: '14px' }}>Loading your property...</div>
        ) : !property ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '12px' }}>No property found for your account.</p>
            <a href="/signup" style={{ color: '#4ade80', fontSize: '14px' }}>Set up a property →</a>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Clocked in now', value: clockedInCount, color: '#4ade80' },
                    { label: 'Total employees', value: employees.filter(e => e.is_active).length, color: '#f0f4f8' },
                    { label: 'Hours this period', value: totalHours.toFixed(1), color: '#f0f4f8' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#4ade80', marginBottom: '4px' }}>Your clock-in kiosk URL</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>Bookmark this on your front desk tablet</div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <code style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof window !== 'undefined' ? `${window.location.origin}/clock/${property.id}` : ''}
                    </code>
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/clock/${property.id}`)}
                      style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {employees.filter(e => e.is_active).map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.clocked_in ? '#4ade80' : '#374151', boxShadow: e.clocked_in ? '0 0 6px #4ade80' : 'none' }}/>
                          <span style={{ fontSize: '14px', color: '#e2e8f0' }}>{e.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: e.clocked_in ? '#4ade80' : '#475569' }}>
                          {e.clocked_in ? `In since ${formatTime(e.clock_in_time!, tz)}` : 'Not clocked in'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TIMESHEETS */}
            {tab === 'timesheets' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setWeekOffset(w => w - 1)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                      ← Prev
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                        {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {weekOffset === 0 && <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>Current week</div>}
                    </div>
                    <button onClick={() => setWeekOffset(w => w + 1)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                      Next →
                    </button>
                  </div>
                  <button onClick={exportPayroll} disabled={exporting}
                    style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1 }}>
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', color: '#475569', fontWeight: 600, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', minWidth: '140px' }}>
                          Employee
                        </th>
                        {weekDays.map((day, i) => {
                          const isToday = day.toDateString() === new Date().toDateString()
                          return (
                            <th key={i} style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: 600, background: isToday ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.04)', minWidth: '130px' }}>
                              <div style={{ color: isToday ? '#4ade80' : '#475569' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</div>
                              <div style={{ color: isToday ? '#4ade80' : '#64748b', fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{day.getDate()}</div>
                            </th>
                          )
                        })}
                        <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '12px', color: '#475569', fontWeight: 600, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', borderLeft: '1px solid rgba(255,255,255,0.06)', minWidth: '70px' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.filter(e => e.is_active).map((emp, rowIdx) => {
                        const empWeekEntries = weekEntries.filter(e => e.employee_id === emp.id)
                        const weekTotal = empWeekEntries.filter(e => !e.deleted_at).reduce((s, e) => s + (e.hours || 0), 0)
                        const isOvertime = weekTotal > 40
                        return (
                          <tr key={emp.id} style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{emp.name}</div>
                              <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>{(emp as any).department || ''}</div>
                            </td>
                            {weekDays.map((day, i) => {
                              const dayEntries = empWeekEntries.filter(e => new Date(e.clock_in).toDateString() === day.toDateString())
                              const isEdited = dayEntries.some(e => e.edited_at && !e.deleted_at)
                              const isToday = day.toDateString() === new Date().toDateString()
                              return (
                                <td key={i} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '1px solid rgba(255,255,255,0.04)', textAlign: 'left', verticalAlign: 'top', background: isEdited ? 'rgba(239,68,68,0.05)' : isToday ? 'rgba(22,163,74,0.03)' : 'transparent' }}>
                                  {dayEntries.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#1e293b', fontSize: '12px', paddingTop: '8px' }}>—</div>
                                  ) : dayEntries.map(e => (
                                    <div key={e.id} style={{ marginBottom: dayEntries.length > 1 ? '8px' : 0 }}>
                                      {e.deleted_at ? (
                                        <div style={{ padding: '4px 6px', background: 'rgba(239,68,68,0.05)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.15)' }}>
                                          <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>TIME DELETED</div>
                                          <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>{e.delete_reason}</div>
                                        </div>
                                      ) : e.edit_history && e.edit_history.length > 0 ? (
                                        <div>
                                          {/* Original — red */}
                                          <div style={{ padding: '3px 6px', background: 'rgba(239,68,68,0.06)', borderRadius: '4px', borderLeft: '2px solid #f87171', marginBottom: '3px' }}>
                                            <div style={{ fontSize: '9px', color: '#f87171', fontWeight: 700, marginBottom: '1px' }}>ORIGINAL</div>
                                            <div style={{ fontSize: '11px', color: '#f87171' }}>
                                              {formatTime(e.edit_history[0].previous_clock_in, tz)} → {e.edit_history[0].previous_clock_out ? formatTime(e.edit_history[0].previous_clock_out, tz) : '—'}
                                            </div>
                                          </div>
                                          {/* Middle edits — red */}
                                          {e.edit_history.slice(0, -1).map((edit, idx) => (
                                            <div key={edit.id} style={{ padding: '3px 6px', background: 'rgba(239,68,68,0.06)', borderRadius: '4px', borderLeft: '2px solid #f87171', marginBottom: '3px' }}>
                                              <div style={{ fontSize: '9px', color: '#f87171', fontWeight: 700, marginBottom: '1px' }}>EDIT {idx + 1}</div>
                                              <div style={{ fontSize: '11px', color: '#f87171' }}>
                                                {formatTime(edit.new_clock_in, tz)} → {edit.new_clock_out ? formatTime(edit.new_clock_out, tz) : '—'}
                                              </div>
                                              <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', marginTop: '1px' }}>{edit.edit_reason}</div>
                                            </div>
                                          ))}
                                          {/* Current — green */}
                                          <div style={{ padding: '3px 6px', background: 'rgba(22,163,74,0.06)', borderRadius: '4px', borderLeft: '2px solid #4ade80', marginBottom: '3px' }}>
                                            <div style={{ fontSize: '9px', color: '#4ade80', fontWeight: 700, marginBottom: '1px' }}>CURRENT</div>
                                            <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>
                                              {formatTime(e.clock_in, tz)} → {e.clock_out ? formatTime(e.clock_out, tz) : '🟢'}
                                            </div>
                                            <div style={{ fontSize: '9px', color: '#475569', fontStyle: 'italic', marginTop: '1px' }}>
                                              {e.edit_history[e.edit_history.length - 1].edit_reason}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{e.hours ? `${e.hours}h` : 'Active'}</div>
                                          </div>
                                        </div>
                                      ) : (
                                        /* No edits — green */
                                        <div style={{ padding: '3px 6px', background: 'rgba(22,163,74,0.06)', borderRadius: '4px', borderLeft: '2px solid #4ade80', marginBottom: '3px' }}>
                                          <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>
                                            {formatTime(e.clock_in, tz)} → {e.clock_out ? formatTime(e.clock_out, tz) : '🟢 Active'}
                                          </div>
                                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{e.hours ? `${e.hours}h` : 'Active'}</div>
                                        </div>
                                      )}
                                      {!e.deleted_at && (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                          <button onClick={() => { setEditingEntry(e.id); setEditMsg(''); setEditClockIn(toLocal(e.clock_in)); setEditClockOut(e.clock_out ? toLocal(e.clock_out) : ''); setEditReason('') }}
                                            style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>
                                            Edit
                                          </button>
                                          <button onClick={() => setDeletingEntry(e.id)}
                                            style={{ flex: 1, background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}>
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </td>
                              )
                            })}
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', verticalAlign: 'top' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: isOvertime ? '#f87171' : '#4ade80' }}>{weekTotal.toFixed(1)}h</div>
                              {isOvertime && <div style={{ fontSize: '9px', color: '#f87171', fontWeight: 700, marginTop: '2px' }}>OT</div>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)' }}>Total</td>
                        {weekDays.map((day, i) => {
                          const dayTotal = weekEntries.filter(e => !e.deleted_at && new Date(e.clock_in).toDateString() === day.toDateString()).reduce((s, e) => s + (e.hours || 0), 0)
                          return (
                            <td key={i} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                              {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '—'}
                            </td>
                          )
                        })}
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#4ade80', borderTop: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                          {weekEntries.filter(e => !e.deleted_at).reduce((s, e) => s + (e.hours || 0), 0).toFixed(1)}h
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Edit modal */}
                {editingEntry && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', margin: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Edit time entry</div>
                      <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '20px' }}>This edit will be flagged and logged permanently.</div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>CLOCK IN</label>
                          <input type="datetime-local" value={editClockIn} onChange={e => setEditClockIn(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'white', outline: 'none', boxSizing: 'border-box' as const }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>CLOCK OUT</label>
                          <input type="datetime-local" value={editClockOut} onChange={e => setEditClockOut(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'white', outline: 'none', boxSizing: 'border-box' as const }} />
                        </div>
                      </div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>REASON FOR EDIT (REQUIRED)</label>
                      <input placeholder="e.g. Employee forgot to clock out" value={editReason} onChange={e => setEditReason(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'white', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' as const }} />
                      {editMsg && <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{editMsg}</div>}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => saveTimeEdit(editingEntry)}
                          style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                          Save edit
                        </button>
                        <button onClick={() => { setEditingEntry(null); setEditReason(''); setEditMsg('') }}
                          style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '8px', padding: '11px', fontSize: '13px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete modal */}
                {deletingEntry && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#0f1419', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', margin: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Delete time entry</div>
                      <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '20px' }}>This will be permanently flagged as deleted. The record is kept for audit purposes.</div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>REASON FOR DELETION (REQUIRED)</label>
                      <input placeholder="e.g. Duplicate entry, employee error" value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: 'white', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' as const }} />
                      {deleteMsg && <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '12px' }}>{deleteMsg}</div>}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => deleteTimeEntry(deletingEntry)}
                          style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                          Confirm delete
                        </button>
                        <button onClick={() => { setDeletingEntry(null); setDeleteReason(''); setDeleteMsg('') }}
                          style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '8px', padding: '11px', fontSize: '13px', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EMPLOYEES */}
            {tab === 'employees' && (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add employee</div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" style={{ ...inputStyle, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="4-digit PIN" maxLength={4} style={{ ...inputStyle, width: '130px', flex: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <select value={newDept} onChange={e => setNewDept(e.target.value)}
                      style={{ width: '100%', background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'white', outline: 'none', cursor: 'pointer' }}>
                      <option value="Front Desk / Reception">Front Desk / Reception</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Maintenance / Engineering">Maintenance / Engineering</option>
                      <option value="Management">Management</option>
                      <option value="Laundry">Laundry</option>
                      <option value="Kitchen / Food Service">Kitchen / Food Service</option>
                      <option value="Security">Security</option>
                      <option value="Valet / Parking">Valet / Parking</option>
                      <option value="Spa / Fitness">Spa / Fitness</option>
                    </select>
                  </div>
                  {addMsg && <div style={{ fontSize: '12px', marginBottom: '12px', color: addMsg.includes('added') || addMsg.includes('unlocked') ? '#4ade80' : '#f87171' }}>{addMsg}</div>}
                  <button onClick={addEmployee} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Add employee
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All employees</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {employees.map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: e.is_active ? '#4ade80' : '#374151' }}/>
                          <div>
                            <div style={{ fontSize: '14px', color: e.is_active ? '#e2e8f0' : '#475569' }}>{e.name}</div>
                            <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>{(e as any).department || 'Front Desk / Reception'}</div>
                          </div>
                          {lockedEmployees.has(e.id) && (
                            <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
                              🔒 Locked
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {lockedEmployees.has(e.id) && (
                            <button onClick={() => unlockEmployee(e.id)}
                              style={{ background: 'transparent', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                              Unlock
                            </button>
                          )}
                          <button onClick={() => toggleEmployee(e.id, e.is_active)}
                            style={{ background: 'transparent', border: `1px solid ${e.is_active ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`, color: e.is_active ? '#f87171' : '#4ade80', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                            {e.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {tab === 'settings' && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pay period settings</div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.3px' }}>PAY PERIOD STARTS ON</label>
                  <select value={payStartDay} onChange={e => setPayStartDay(Number(e.target.value))} style={selectStyle}>
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.3px' }}>PAY PERIOD LENGTH</label>
                  <select value={payLength} onChange={e => setPayLength(Number(e.target.value))} style={selectStyle}>
                    <option value={7}>7 days (weekly)</option>
                    <option value={14}>14 days (bi-weekly)</option>
                  </select>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>Current pay period preview</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>
                    {(() => {
                      const { start, end } = getPayPeriod(new Date(), payStartDay, payLength)
                      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    })()}
                  </div>
                </div>
                {settingsMsg && <div style={{ fontSize: '13px', color: settingsMsg.includes('saved') ? '#4ade80' : '#f87171', marginBottom: '12px' }}>{settingsMsg}</div>}
                <button onClick={savePayPeriodSettings}
                  style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 12px rgba(22,163,74,0.3)' }}>
                  Save settings
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}