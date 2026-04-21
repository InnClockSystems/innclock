'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">InnClock</h1>
          <p className="text-sm text-gray-500 mt-2">Owner portal — sign in to continue</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-600 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-2 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </main>
  )
}