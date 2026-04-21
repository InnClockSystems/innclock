import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Stripe from 'stripe'
import { sendWelcomeEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { email, password, ownerName, propertyName, timezone } = await req.json()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { data: property, error: propError } = await supabaseAdmin
    .from('properties')
    .insert({
      name: propertyName,
      owner_email: email,
      owner_name: ownerName,
      timezone,
      subscription_status: 'trial',
    })
    .select()
    .single()

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 })
  }

  const priceId = process.env.STRIPE_PRICE_ID

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { property_id: property.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?welcome=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
  })

  const kioskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/clock/${property.id}`
await sendWelcomeEmail({
  ownerName,
  ownerEmail: email,
  propertyName,
  kioskUrl,
})

  return NextResponse.json({ checkoutUrl: session.url })
}