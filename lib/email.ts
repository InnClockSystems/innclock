import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail({
  ownerName,
  ownerEmail,
  propertyName,
  kioskUrl,
}: {
  ownerName: string
  ownerEmail: string
  propertyName: string
  kioskUrl: string
}) {
  await resend.emails.send({
    from: 'InnClock <onboarding@resend.dev>',
    to: ownerEmail,
    subject: `Welcome to InnClock — ${propertyName} is ready`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Welcome to InnClock</h1>
        <p style="color: #666; margin-bottom: 32px;">Hi ${ownerName}, your property is set up and ready to go.</p>

        <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Your property</p>
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 24px;">${propertyName}</p>

          <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Your clock-in kiosk URL</p>
          <p style="font-size: 13px; margin-bottom: 4px;">Bookmark this on your front desk tablet so employees can clock in:</p>
          <a href="${kioskUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; margin-top: 8px;">
            Open kiosk
          </a>
        </div>

        <div style="margin-bottom: 32px;">
          <p style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Getting started</p>
          <ol style="color: #444; font-size: 13px; line-height: 2;">
            <li>Go to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #2563eb;">owner dashboard</a></li>
            <li>Click Employees and add your staff with their names and PINs</li>
            <li>Bookmark the kiosk URL on your front desk tablet</li>
            <li>Employees tap their name and enter their PIN to clock in</li>
          </ol>
        </div>

        <p style="font-size: 12px; color: #999;">
          Questions? Reply to this email and we'll help you get set up.<br/>
          — The InnClock team
        </p>
      </div>
    `,
  })
}