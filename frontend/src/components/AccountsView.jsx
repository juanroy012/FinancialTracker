import React, { useEffect, useState, useMemo } from 'react'
import { getAccounts, addAccount, editAccount, deleteAccount } from '../api/accounts'

const EMPTY = { type: 'bank', name: '', balance: '' }

const TYPE_STYLES = {
  bank:     { ring: 'bg-sky-500/15 text-sky-400',       label: 'Bank' },
  ewallet:  { ring: 'bg-violet-500/15 text-violet-400', label: 'E-Wallet' },
}



const fmt = (val) => {
  if (typeof val !== 'number') return '—'
  return 'Rp ' + val.toLocaleString('id-ID')
}

function BankIcon() {
  return (
    <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11' />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 10h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm0 0V8a2 2 0 012-2h14a2 2 0 012 2v2M16 14h.01' />
    </svg>
  )
}

function AccountLogoTile({ type }) {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.bank
  return (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.ring}`}>
      {type === 'bank' ? <BankIcon /> : <WalletIcon />}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className='ft-overlay' onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className='ft-card w-full max-w-sm shadow-2xl'>
        <div className='px-6 py-4 border-b border-slate-800 flex items-center justify-between'>
          <h3 className='text-base font-semibold text-slate-100'>{title}</h3>
          <button onClick={onClose} className='text-slate-500 hover:text-slate-300 transition-colors'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
        <div className='px-6 py-5'>{children}</div>
      </div>
    </div>
  )
}

export default function AccountsView() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)   // null | 'form' | 'delete'
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  const refresh = () => {
    setLoading(true)
    getAccounts()
      .then(data => setAccounts(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  // Client-side search — filters by name or type
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    )
  }, [accounts, search])

  const openAdd    = () => { setForm(EMPTY); setEditId(null); setFormError(''); setModal('form') }
  const openEdit   = (a) => { setForm({ type: a.type, name: a.name, balance: a.balance.toString() }); setEditId(a.id); setFormError(''); setModal('form') }
  const openDelete = (id) => { setDeleteId(id); setModal('delete') }
  const closeModal = () => { setModal(null); setDeleteId(null); setSaving(false) }
  const setField   = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = form.name.trim()
    if (!trimmed) { setFormError('Account name cannot be empty.'); return }
    const balanceCents = Math.round(parseFloat(form.balance || 0))
    if (isNaN(balanceCents)) { setFormError('Enter a valid balance.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editId) await editAccount(editId, { type: form.type, name: trimmed, balance: balanceCents })
      else        await addAccount({ type: form.type, name: trimmed, balance: balanceCents })
      closeModal()
      refresh()
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteAccount(deleteId)
      closeModal()
      refresh()
    } catch {
      setSaving(false)
    }
  }

  return (
    <section>
      {/* Header */}
      <div className='flex items-start justify-between mb-8'>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className='text-4xl font-bold text-slate-100 tracking-tight'>
            Accounts
          </h1>
          <p className='text-slate-500 text-sm mt-1'>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className='ft-btn-primary mt-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
          </svg>
          Add Account
        </button>
      </div>

      {/* Search bar */}
      <div className='relative mb-6'>
        <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none'
          fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z' />
        </svg>
        <input
          type='text'
          className='ft-input'
          style={{ paddingLeft: '2.25rem' }}
          placeholder='Search by name or type…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className='flex justify-center py-24'>
          <div className='w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='ft-card p-16 flex flex-col items-center gap-3 text-center'>
          <svg className='w-10 h-10 text-slate-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11' />
          </svg>
          <p className='text-slate-400 font-medium'>
            {search ? 'No accounts match your search.' : 'No accounts yet.'}
          </p>
          {!search && <p className='text-slate-600 text-sm'>Click "Add Account" to get started.</p>}
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filtered.map(a => {
            const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.bank
            return (
              <div
                key={a.id}
                className='ft-card p-5 flex items-center justify-between group hover:border-slate-700 transition-colors'
              >
                <div className='flex items-center gap-4'>
                  <AccountLogoTile type={a.type} />
                  <div>
                    <p className='text-sm font-semibold text-slate-100'>{a.name}</p>
                    <p className={`text-sm font-medium mt-1 ${
                      a.balance > 0 ? 'text-emerald-400' : a.balance < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>{fmt(a.balance)}</p>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-2 ${style.ring}`}>
                      {style.label}
                    </span>
                  </div>
                </div>

                {/* Row actions */}
                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <button
                    onClick={() => openEdit(a)}
                    className='p-1.5 rounded-md text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors'
                    title='Edit'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDelete(a.id)}
                    className='p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors'
                    title='Delete'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Account' : 'New Account'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {/* Type toggle */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Type</label>
              <div className='flex rounded-lg overflow-hidden border border-slate-700'>
                {[
                  { value: 'bank',    label: 'Bank',     icon: <BankIcon /> },
                  { value: 'ewallet', label: 'E-Wallet', icon: <WalletIcon /> },
                ].map(opt => (
                  <button
                    type='button'
                    key={opt.value}
                    onClick={() => setField('type', opt.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                      form.type === opt.value
                        ? opt.value === 'bank'
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'bg-violet-500/20 text-violet-400'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Account Name</label>
              <input
                className='ft-input'
                type='text'
                placeholder='e.g. Chase Savings, GCash…'
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Balance */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>
                {editId ? 'Balance (Rp)' : 'Starting Balance (Rp)'}
              </label>
              <input
                className='ft-input'
                type='number'
                placeholder='0'
                value={form.balance}
                onChange={e => setField('balance', e.target.value)}
              />
            </div>

            {formError && (
              <p className='text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2'>
                {formError}
              </p>
            )}

            <div className='flex gap-3 pt-1'>
              <button type='submit' disabled={saving} className='ft-btn-primary flex-1 justify-center'>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Account'}
              </button>
              <button type='button' onClick={closeModal} className='ft-btn-ghost'>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <Modal title='Delete Account' onClose={closeModal}>
          <div className='flex flex-col gap-5'>
            <p className='text-sm text-slate-300'>
              Are you sure you want to delete this account? This action cannot be undone.
            </p>
            <div className='flex gap-3'>
              <button onClick={handleDelete} disabled={saving} className='ft-btn-danger flex-1 justify-center'>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={closeModal} className='ft-btn-ghost flex-1 justify-center'>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
