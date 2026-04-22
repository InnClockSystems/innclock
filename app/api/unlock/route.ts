import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { employee_id } = await req.json()
  if (!employee_id) return NextResponse.json({ error: 'Missing employee_id' }, { status: 400 })
  
  await supabaseAdmin
    .from('pin_attempts')
    .delete()
    .eq('employee_id', employee_id)
    .eq('success', false)

  return NextResponse.json({ success: true })
}