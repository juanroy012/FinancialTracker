import React, { useState } from 'react'
import { CURRENCIES } from '../utils/currency'

// Version is pulled from package.json at build time via Vite's import.meta.env
const VERSION = __APP_VERSION__

const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-03-05',
    entries: [
      { type: 'added',   text: 'Multi-currency support — 15 currencies per account' },
      { type: 'added',   text: 'Live exchange rates via frankfurter.app (ECB data, cached 1 h)' },
      { type: 'added',   text: 'Display currency picker in navbar, persisted across sessions' },
      { type: 'added',   text: 'Total account balance panel on Dashboard & Accounts page' },
      { type: 'added',   text: 'Seeder script for demo data (admin / admin)' },
      { type: 'added',   text: 'Themed scrollbars matching dark / light mode' },
      { type: 'added',   text: 'GitHub Actions CI — pytest runs on every push' },
      { type: 'fixed',   text: 'Python 3.14 bcrypt crash — replaced passlib with direct bcrypt' },
      { type: 'fixed',   text: 'Logout button missing from desktop navbar' },
      { type: 'fixed',   text: '"Tanpa Kategori" → "Uncategorized"' },
      { type: 'fixed',   text: 'Non-IDR amounts incorrectly divided by 100' },
      { type: 'changed', text: 'Per-user data isolation — accounts, categories & transactions scoped by user_id' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-19',
    entries: [
      { type: 'added', text: 'JWT authentication — register, login, logout' },
      { type: 'added', text: 'Dashboard with charts (donut, bar, category pie)' },
      { type: 'added', text: 'Transactions — CRUD, search, sort, pagination' },
      { type: 'added', text: 'Categories with type, icon, and colour' },
      { type: 'added', text: 'Accounts (bank & e-wallet) with auto balance tracking' },
      { type: 'added', text: 'Dark / light theme toggle' },
      { type: 'added', text: 'SQLite with WAL mode and auto-migrations' },
      { type: 'added', text: 'Docker multi-stage build + Fly.io deployment' },
      { type: 'added', text: 'pytest test suite (28 tests)' },
    ],
  },
]

const TYPE_STYLES = {
  added:   { dot: 'bg-emerald-400', label: 'Added',   text: 'text-emerald-400' },
  fixed:   { dot: 'bg-sky-400',     label: 'Fixed',   text: 'text-sky-400'     },
  changed: { dot: 'bg-amber-400',   label: 'Changed', text: 'text-amber-400'   },
  removed: { dot: 'bg-rose-400',    label: 'Removed', text: 'text-rose-400'    },
}

export default function VersionBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => setOpen(true)}
        className='text-xs font-mono tabular-nums px-2 py-0.5 rounded-full transition-colors'
        style={{
          color: 'var(--text-faint)',
          border: '1px solid var(--border-hi)',
          background: 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border-hi)' }}
        title='View patch notes'
      >
        v{VERSION}
      </button>

      {/* Modal */}
      {open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className='ft-card w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]'>
            {/* Header */}
            <div className='px-6 py-4 flex items-center justify-between border-b'
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className='text-base font-semibold' style={{ color: 'var(--text)' }}>
                  Patch Notes
                </h2>
                <p className='text-xs mt-0.5' style={{ color: 'var(--text-faint)' }}>
                  FinancialTracker — current version: v{VERSION}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ color: 'var(--text-muted)' }}
                className='hover:text-slate-300 transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className='overflow-y-auto ft-scrollbar px-6 py-5 flex flex-col gap-6'>
              {CHANGELOG.map(release => (
                <div key={release.version}>
                  <div className='flex items-center gap-3 mb-3'>
                    <span className='text-sm font-bold font-mono' style={{ color: 'var(--accent)' }}>
                      v{release.version}
                    </span>
                    <span className='text-xs' style={{ color: 'var(--text-faint)' }}>
                      {release.date}
                    </span>
                    {release.version === VERSION && (
                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)' }}>
                        current
                      </span>
                    )}
                  </div>
                  <ul className='flex flex-col gap-1.5'>
                    {release.entries.map((e, i) => {
                      const s = TYPE_STYLES[e.type] ?? TYPE_STYLES.added
                      return (
                        <li key={i} className='flex items-start gap-2.5 text-sm'>
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                          <span>
                            <span className={`font-semibold text-xs uppercase tracking-wide mr-1.5 ${s.text}`}>
                              {s.label}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>{e.text}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='px-6 py-3 border-t flex items-center justify-between'
              style={{ borderColor: 'var(--border)' }}>
              <span className='text-xs' style={{ color: 'var(--text-faint)' }}>
                See CHANGELOG.md for full history
              </span>
              <button onClick={() => setOpen(false)} className='ft-btn-ghost text-xs px-3 py-1.5'>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

