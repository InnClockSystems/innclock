import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { employee_id, property_id, action } = await req.json()

  if (action === 'in') {
    const { error } = await supabase
      .from('clock_entries')
      .insert({
        employee_id,
        property_id,
        clock_in: new Date().toISOString(),
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'in' })
  }

  if (action === 'out') {
    const { error } = await supabase
      .from('clock_entries')
      .update({ clock_out: new Date().toISOString() })
      .eq('employee_id', employee_id)
      .is('clock_out', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'out' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}