'use client'

import { createClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'

export default function TokenGetter() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token)
        setUser(session.user)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setToken(session.access_token)
        setUser(session.user)
      } else {
        setToken(null)
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      alert('Token copied to clipboard!')
    }
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">🔐 Authentication Required</h1>
        <p className="text-gray-600 mb-4">Please log in to get your authentication token.</p>
        <a href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Go to Login
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔑 Authentication Token</h1>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ You are logged in!</h2>
        <p className="text-green-700">User: {user.email}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Your Authentication Token:</h3>
        <div className="bg-white border rounded p-3 mb-3">
          <code className="text-sm break-all">{token}</code>
        </div>
        <button 
          onClick={copyToken}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📋 Copy Token
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📝 Instructions:</h3>
        <ol className="text-blue-700 list-decimal list-inside space-y-1">
          <li>Click "Copy Token" above</li>
          <li>Open the API Tester (api-tester.html)</li>
          <li>Paste the token in the "Authentication Token" field</li>
          <li>Click "Test Authentication" to verify</li>
          <li>Start testing your APIs!</li>
        </ol>
      </div>
    </div>
  )
}
