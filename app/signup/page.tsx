'use client'

import { useState } from 'react'

export default function Signup() {
  const [step, setStep] = useState<'account' | 'property' | 'plan'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreateAccount() {
    if (!email || !password || !ownerName) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setStep('property')
  }

  async function handlePropertyStep() {
    if (!propertyName) { setError('Please enter your property name.'); return }
    setError('')
    setStep('plan')
  }

  async function handleSelectPlan(plan: 'starter' | 'pro') {
    setLoading(true)
    setError('')

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ownerName, propertyName, timezone, plan }),
    })

    const result = await res.json()

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">InnClock</h1>
          <p className="text-sm text-gray-500 mt-2">Set up your property in minutes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['account', 'property', 'plan'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
                ${step === s ? 'bg-gray-900 text-white' : 
                  ['account', 'property', 'plan'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {['account', 'property', 'plan'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${['account', 'property', 'plan'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          {/* Step 1 — Account */}
          {step === 'account' && (
            <>
              <h2 className="text-base font-medium text-gray-800 mb-4">Create your account</h2>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">Your full name</label>
                <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                  placeholder="Jay Patel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="mb-6">
                <label className="text-sm text-gray-600 block mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
              <button onClick={handleCreateAccount}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-all">
                Continue
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                Already have an account? <a href="/login" className="text-blue-500 hover:underline">Sign in</a>
              </p>
            </>
          )}

          {/* Step 2 — Property */}
          {step === 'property' && (
            <>
              <h2 className="text-base font-medium text-gray-800 mb-4">Your property</h2>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">Property name</label>
                <input value={propertyName} onChange={e => setPropertyName(e.target.value)}
                  placeholder="Sunset Inn"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="mb-6">
                <label className="text-sm text-gray-600 block mb-1">Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400">
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Phoenix">Arizona Time</option>
                  <option value="America/Anchorage">Alaska Time</option>
                  <option value="Pacific/Honolulu">Hawaii Time</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
              <button onClick={handlePropertyStep}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-all">
                Continue
              </button>
              <button onClick={() => setStep('account')}
                className="w-full text-gray-400 text-sm mt-3 hover:text-gray-600">
                Back
              </button>
            </>
          )}

          {/* Step 3 — Plan */}
          {step === 'plan' && (
            <>
              <h2 className="text-base font-medium text-gray-800 mb-4">Choose your plan</h2>
              <div className="flex flex-col gap-3 mb-4">
                <button onClick={() => handleSelectPlan('starter')} disabled={loading}
                  className="border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">Starter</span>
                    <span className="text-gray-900 font-semibold">$29/mo</span>
                  </div>
                  <p className="text-xs text-gray-500">Up to 15 employees · 1 property · Full timesheets</p>
                </button>
                <button onClick={() => handleSelectPlan('pro')} disabled={loading}
                  className="border-2 border-blue-400 rounded-2xl p-4 text-left hover:bg-blue-50 transition-all disabled:opacity-50 relative">
                  <div className="absolute -top-2.5 left-4">
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Most popular</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">Pro</span>
                    <span className="text-gray-900 font-semibold">$49/mo</span>
                  </div>
                  <p className="text-xs text-gray-500">Unlimited employees · 1 property · Priority support</p>
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
              {loading && <p className="text-center text-sm text-gray-400">Setting up your account...</p>}
              <button onClick={() => setStep('property')}
                className="w-full text-gray-400 text-sm mt-2 hover:text-gray-600">
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}