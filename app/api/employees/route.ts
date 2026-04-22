import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, pin, property_id, department } = await req.json()
  if (!name || !pin || !property_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const pin_hash = await bcrypt.hash(pin, 10)
  const { error } = await supabase.from('employees').insert({
    name, pin_hash, property_id,
    department: department || 'Front Desk / Reception'
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}