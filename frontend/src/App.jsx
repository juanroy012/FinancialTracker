import React, { useEffect, useState } from 'react'
import DashboardView from './components/DashboardView'
import CategoriesView from './components/CategoriesView'
import TransactionsView from './components/TransactionsView'
import AccountsView from './components/AccountsView'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: (
    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6' />
    </svg>
  )},
  { href: '/transactions', label: 'Transactions', icon: (
    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
    </svg>
  )},
  { href: '/categories', label: 'Categories', icon: (
    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
    </svg>
  )},
  { href: '/accounts', label: 'Accounts', icon: (
    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11' />
    </svg>
  )},
]

function ThemeToggle({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className='w-8 h-8 rounded-lg flex items-center justify-center transition-colors'
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {dark ? (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
          <circle cx='12' cy='12' r='5'/>
          <line x1='12' y1='1'  x2='12' y2='3'/>
          <line x1='12' y1='21' x2='12' y2='23'/>
          <line x1='4.22' y1='4.22'  x2='5.64' y2='5.64'/>
          <line x1='18.36' y1='18.36' x2='19.78' y2='19.78'/>
          <line x1='1' y1='12' x2='3' y2='12'/>
          <line x1='21' y1='12' x2='23' y2='12'/>
          <line x1='4.22' y1='19.78' x2='5.64' y2='18.36'/>
          <line x1='18.36' y1='5.64' x2='19.78' y2='4.22'/>
        </svg>
      ) : (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'/>
        </svg>
      )}
    </button>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [dark, setDark] = useState(() => localStorage.getItem('ft-dark') !== 'false')

  const toggleDark = () => {
    const next = !dark
    document.documentElement.classList.toggle('light', !next)
    localStorage.setItem('ft-dark', String(next))
    setDark(next)
  }

  useEffect(() => {
    const isDark = localStorage.getItem('ft-dark') !== 'false'
    document.documentElement.classList.toggle('light', !isDark)
    setDark(isDark)
  }, [])

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to) => (e) => {
    e.preventDefault()
    window.history.pushState({}, '', to)
    setPath(to)
  }

  let View = <DashboardView />
  if (path === '/categories')        View = <CategoriesView />
  else if (path === '/transactions') View = <TransactionsView />
  else if (path === '/accounts')     View = <AccountsView />

  return (
    <div className='min-h-screen' style={{ background: 'var(--bg-app)' }}>
      <header className='sticky top-0 z-40' style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className='max-w-6xl mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg flex items-center justify-center' style={{ background: 'var(--accent)' }}>
              <svg className='w-4 h-4' style={{ color: 'white' }} fill='currentColor' viewBox='0 0 20 20'>
                <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z' />
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z' clipRule='evenodd' />
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text)' }}
              className='font-bold text-lg tracking-tight'>
              FinancialTracker
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <nav className='flex items-center gap-1'>
              {NAV_ITEMS.map(({ href, label, icon }) => {
                const active = path === href
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={navigate(href)}
                    className='flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150'
                    style={active ? {
                      background: 'var(--accent-dim)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent-ring)',
                    } : {
                      color: 'var(--text-muted)',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-surface-2)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = '' } }}
                  >
                    {icon}
                    {label}
                  </a>
                )
              })}
            </nav>
            <div className='w-px h-5 mx-1' style={{ background: 'var(--border-hi)' }} />
            <ThemeToggle dark={dark} toggle={toggleDark} />
          </div>
        </div>
      </header>
      <main className='max-w-6xl mx-auto px-6 py-10'>
        {View}
      </main>
    </div>
  )
}

export default App