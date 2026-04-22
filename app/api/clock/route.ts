import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { employee_id, property_id, action, pin } = await req.json()

  if (!employee_id || !property_id || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Get employee and verify PIN
  const { data: employee, error: empError } = await supabaseAdmin
    .from('employees')
    .select('id, pin_hash, is_active, property_id')
    .eq('id', employee_id)
    .single()

  if (empError || !employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  // Make sure employee belongs to this property
  if (employee.property_id !== property_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!employee.is_active) {
    return NextResponse.json({ error: 'Employee is inactive' }, { status: 403 })
  }

  // Check PIN attempt lockout
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
  .from('pin_attempts')
  .select('*', { count: 'exact', head: true })
  .eq('employee_id', employee_id)
  .eq('success', false)
  .gte('attempted_at', fifteenMinutesAgo)

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: 'Too many wrong attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  // Verify PIN
  const pinValid = await bcrypt.compare(pin, employee.pin_hash)

  // Record attempt
  await supabaseAdmin.from('pin_attempts').insert({
    employee_id,
    success: pinValid,
    attempted_at: new Date().toISOString(),
  })

  if (!pinValid) {
    const remaining = 5 - ((count ?? 0) + 1)
    return NextResponse.json({
      error: remaining > 0 ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'Too many wrong attempts. Try again in 15 minutes.'
    }, { status: 401 })
  }

  // Clear failed attempts on success
  await supabaseAdmin.from('pin_attempts').delete()
    .eq('employee_id', employee_id).eq('success', false)

  const now = new Date().toISOString()

  if (action === 'in') {
    // Check if already clocked in
    const { data: existing } = await supabaseAdmin
      .from('clock_entries')
      .select('id')
      .eq('employee_id', employee_id)
      .is('clock_out', null)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('clock_entries').insert({
      employee_id, property_id, clock_in: now,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      property_id, action: 'clock_in',
      performed_by: employee_id,
      details: { employee_id, time: now },
    })

    return NextResponse.json({ success: true, action: 'in', time: now })
  }

  if (action === 'out') {
    const { error } = await supabaseAdmin
      .from('clock_entries')
      .update({ clock_out: now })
      .eq('employee_id', employee_id)
      .is('clock_out', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      property_id, action: 'clock_out',
      performed_by: employee_id,
      details: { employee_id, time: now },
    })

    return NextResponse.json({ success: true, action: 'out', time: now })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}