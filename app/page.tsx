import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-semibold text-gray-900">InnClock</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-all">
            Sign in
          </Link>
          <Link href="/signup" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Built for hotels
        </div>
        <h1 className="text-5xl font-semibold text-gray-900 leading-tight mb-6">
          The simplest way to track<br />hotel staff hours
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          Employees clock in with a PIN. Owners see timesheets instantly.
          No paper. No confusion. No expensive software.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup"
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-all">
            Start free trial
          </Link>
          <Link href="/login"
            className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            Sign in to dashboard
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">No credit card required to start · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1d4ed8" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">PIN clock-in</h3>
            <p className="text-sm text-gray-500">Employees tap their name and enter a 4-digit PIN. Takes 5 seconds. Works on any tablet or computer.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#15803d" strokeWidth="2">
                <path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Live timesheets</h3>
            <p className="text-sm text-gray-500">See who's clocked in right now. Pull up any pay period. Hours are calculated automatically.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Payroll ready</h3>
            <p className="text-sm text-gray-500">Download a clean timesheet report every pay period. Hand it straight to your payroll processor.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-4">Simple pricing</h2>
          <p className="text-gray-500 text-center mb-12">One price per property. No per-employee fees. No surprises.</p>

          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-medium text-gray-900 mb-1">Starter</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-semibold text-gray-900">$29</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <ul className="text-sm text-gray-500 space-y-2 mb-6">
                <li>✓ Up to 15 employees</li>
                <li>✓ 1 property</li>
                <li>✓ Full timesheets</li>
                <li>✓ PIN clock-in kiosk</li>
              </ul>
              <Link href="/signup"
                className="block text-center border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-all">
                Get started
              </Link>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-white">Pro</h3>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Popular</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-semibold text-white">$49</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <ul className="text-sm text-gray-400 space-y-2 mb-6">
                <li>✓ Unlimited employees</li>
                <li>✓ 1 property</li>
                <li>✓ Full timesheets</li>
                <li>✓ PIN clock-in kiosk</li>
                <li>✓ Priority support</li>
              </ul>
              <Link href="/signup"
                className="block text-center bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-400">© 2026 InnClock. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-400 hover:text-gray-600">Sign up</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}