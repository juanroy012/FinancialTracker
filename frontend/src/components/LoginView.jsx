import React, { useState } from 'react'
import { login, register } from '../api/auth'

// Reusable input styled with the app's CSS variables
function AuthInput({ label, type, value, onChange, placeholder }) {
  return (
    <label className='flex flex-col gap-1.5'>
      <span className='text-sm font-medium' style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : 'username'}
        required
        className='w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all'
        style={{
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-hi)',
          color: 'var(--text)',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
        onBlur={e =>  { e.target.style.borderColor = 'var(--border-hi)' }}
      />
    </label>
  )
}

export default function LoginView({ onLogin }) {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const isLogin = mode === 'login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Call POST /auth/token — returns the JWT access_token
        const token = await login(username, password)
        localStorage.setItem('ft-token', token)        // store the token
        onLogin()                                       // tell App.jsx we're logged in
      } else {
        // Call POST /auth/register — creates the account
        await register(username, password)
        // After registering, log in automatically
        const token = await login(username, password)
        localStorage.setItem('ft-token', token)
        onLogin()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (e) => {
    e.preventDefault()
    setMode(isLogin ? 'register' : 'login')
    setError('')
    setUsername('')
    setPassword('')
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center px-4'
      style={{ background: 'var(--bg-app)' }}
    >
      <div
        className='w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6'
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Logo + title */}
        <div className='flex flex-col items-center gap-3'>
          <div
            className='w-12 h-12 rounded-xl flex items-center justify-center'
            style={{ background: 'var(--accent)' }}
          >
            <svg className='w-6 h-6' style={{ color: 'white' }} fill='currentColor' viewBox='0 0 20 20'>
              <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z' />
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z' clipRule='evenodd' />
            </svg>
          </div>
          <div className='text-center'>
            <h1
              className='text-xl font-bold tracking-tight'
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text)' }}
            >
              FinancialTracker
            </h1>
            <p className='text-sm mt-0.5' style={{ color: 'var(--text-muted)' }}>
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <AuthInput
            label='Username'
            type='text'
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder='Enter your username'
          />
          <AuthInput
            label='Password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder='Enter your password'
          />

          {/* Error message */}
          {error && (
            <p
              className='text-sm px-3 py-2 rounded-lg'
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-1'
            style={{
              background: loading ? 'var(--accent-dim)' : 'var(--accent)',
              color: loading ? 'var(--accent-text)' : 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: '1px solid transparent',
            }}
          >
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Switch mode link */}
        <p className='text-center text-sm' style={{ color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <a
            href='#'
            onClick={switchMode}
            className='font-medium'
            style={{ color: 'var(--accent-text)' }}
          >
            {isLogin ? 'Register' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  )
}

