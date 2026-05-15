'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next) {
    setMode(next)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      router.refresh()
      router.push('/dashboard')
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      setMessage('Account created! Check your email for a confirmation link, then sign in.')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 15,
    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
    outline: 'none', boxSizing: 'border-box',
    color: '#1C1C1E', backgroundColor: 'white',
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F2F2F7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 14,
        border: '0.5px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        padding: '40px 36px', width: '100%', maxWidth: 400,
      }}>
        {/* Route90 badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: '#4F46E5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 18,
            marginBottom: 12,
          }}>
            R90
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', margin: 0 }}>
            Route90 Invoicer
          </h1>
          <p style={{ fontSize: 14, color: '#8E8E93', margin: '6px 0 0' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#FFF0F0', border: '1px solid #FFCDD2',
            borderRadius: 8, padding: '10px 14px',
            color: '#D32F2F', fontSize: 14, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div style={{
            backgroundColor: '#F0FFF4', border: '1px solid #C6F6D5',
            borderRadius: 8, padding: '10px 14px',
            color: '#276749', fontSize: 14, marginBottom: 20,
          }}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3C3C43', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@route90.ca"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3C3C43', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3C3C43', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              backgroundColor: loading ? '#A5B4FC' : '#4F46E5',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '13px', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              width: '100%',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign in' : 'Create account')
            }
          </button>
        </form>

        {/* Toggle */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#8E8E93', marginTop: 24, marginBottom: 0 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#4F46E5', fontWeight: 500, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
