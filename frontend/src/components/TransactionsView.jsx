import React, { useEffect, useState, useMemo } from 'react'
import { getTransactions, addTransaction, editTransaction, deleteTransaction } from '../api/transactions'
import { getCategories } from '../api/categories'
import { getAccounts } from '../api/accounts'

const EMPTY = { type: 'expense', amount: '', date: new Date().toISOString().slice(0, 10), note: '', category_id: '', account_id: '' }

function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return (
    <svg className='w-3 h-3 text-slate-600 ml-1 inline' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4' />
    </svg>
  )
  return sortDir === 'asc'
    ? <svg className='w-3 h-3 text-amber-400 ml-1 inline' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7' /></svg>
    : <svg className='w-3 h-3 text-amber-400 ml-1 inline' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' /></svg>
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className='ft-overlay' onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className='ft-card w-full max-w-md shadow-2xl'>
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

export default function TransactionsView() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [modal, setModal] = useState(null)   // null | 'form' | 'delete'
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const refresh = () => {
    setLoading(true)
    Promise.all([getTransactions(), getCategories(), getAccounts()])
      .then(([txs, cats, accs]) => { setTransactions(txs); setCategories(cats); setAccounts(accs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setFormError(''); setModal('form') }

  const openEdit = (t) => {
    setForm({
      type: t.type,
      amount: t.amount_cents.toString(),
      date: t.date,
      note: t.note || '',
      category_id: t.category_id ?? '',
      account_id: t.account_id ?? '',
    })
    setEditId(t.id)
    setFormError('')
    setModal('form')
  }

  const openDelete = (id) => { setDeleteId(id); setModal('delete') }
  const closeModal = () => { setModal(null); setDeleteId(null); setSaving(false) }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setFormError('Enter a valid amount greater than 0.')
      return
    }
    if (!form.date) { setFormError('Date is required.'); return }

    setSaving(true)
    setFormError('')
    const payload = {
      type: form.type,
      amount_cents: Math.round(parseFloat(form.amount)),
      date: form.date,
      note: form.note || null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      account_id: form.account_id ? parseInt(form.account_id) : null,
    }
    try {
      if (editId) await editTransaction(editId, payload)
      else await addTransaction(payload)
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
      await deleteTransaction(deleteId)
      closeModal()
      refresh()
    } catch {
      setSaving(false)
    }
  }

  const catName = (id) => categories.find(c => c.id === id)?.name
  const accName = (id) => accounts.find(a => a.id === id)?.name
  const fmt = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')

  // Client-side search — matches note, category name, account name, type, date
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter(t =>
      (t.note ?? '').toLowerCase().includes(q) ||
      (catName(t.category_id) ?? '').toLowerCase().includes(q) ||
      (accName(t.account_id) ?? '').toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.date.includes(q)
    )
  }, [transactions, categories, accounts, search])

  // Client-side sort
  const displayed = useMemo(() => {
    const arr = [...searched]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortKey === 'amount') return dir * (a.amount_cents - b.amount_cents)
      if (sortKey === 'date')   return dir * a.date.localeCompare(b.date)
      if (sortKey === 'type')   return dir * a.type.localeCompare(b.type)
      return dir * (a.id - b.id)   // default: id
    })
    return arr
  }, [searched, sortKey, sortDir])

  const toggleSort = (col) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('desc') }
  }

  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [search, sortKey, sortDir])
  const totalPages = Math.ceil(displayed.length / PAGE_SIZE) || 1
  const pageItems  = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <section>
      {/* Header */}
      <div className='flex items-start justify-between mb-8'>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className='text-4xl font-bold text-slate-100 tracking-tight'>
            Transactions
          </h1>
          <p className='text-slate-500 text-sm mt-1'>
            {displayed.length}{search ? ` of ${transactions.length}` : ''} record{transactions.length !== 1 ? 's' : ''}{totalPages > 1 ? ` · p.${page}/${totalPages}` : ''}
          </p>
        </div>
        <button onClick={openAdd} className='ft-btn-primary mt-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Search bar */}
      <div className='relative mb-5'>
        <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none'
          fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z' />
        </svg>
        <input
          type='text'
          className='ft-input'
          style={{ paddingLeft: '2.25rem' }}
          placeholder='Search by note, category, account, type, or date…'
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

      {/* Table */}
      {loading ? (
        <div className='flex justify-center py-24'>
          <div className='w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin' />
        </div>
      ) : displayed.length === 0 ? (
        <div className='ft-card p-16 flex flex-col items-center gap-3 text-center'>
          <svg className='w-10 h-10 text-slate-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
          </svg>
          <p className='text-slate-400 font-medium'>{search ? 'No transactions match your search.' : 'No transactions yet'}</p>
          {!search && <p className='text-slate-600 text-sm'>Click "Add Transaction" to get started</p>}
        </div>
      ) : (
        <div className='ft-card overflow-hidden'>
          <table className='min-w-full'>
            <thead>
              <tr className='border-b border-slate-800'>
                {[['type','Type'],['amount','Amount']].map(([col, lbl]) => (
                  <th key={col}
                    className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 select-none'
                    onClick={() => toggleSort(col)}
                  >
                    {lbl}<SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                  </th>
                ))}
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500'>Category</th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500'>Account</th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500'>Note</th>
                {/* sortable date */}
                <th
                  className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 select-none'
                  onClick={() => toggleSort('date')}
                >
                  Date<SortIcon col='date' sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className='px-5 py-3' />
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-800/60'>
              {pageItems.map(t => (
                <tr key={t.id} className='hover:bg-slate-800/30 transition-colors group'>
                  <td className='px-5 py-3.5'>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      t.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {t.type === 'income' ? '↑' : '↓'} {t.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm font-semibold tabular-nums ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount_cents)}
                  </td>
                  <td className='px-5 py-3.5 text-sm text-slate-400'>
                    {catName(t.category_id) ?? <span className='text-slate-600 italic'>—</span>}
                  </td>
                  <td className='px-5 py-3.5 text-sm text-slate-400'>
                    {accName(t.account_id) ?? <span className='text-slate-600 italic'>—</span>}
                  </td>
                  <td className='px-5 py-3.5 text-sm text-slate-300 max-w-xs truncate'>
                    {t.note || <span className='text-slate-600 italic'>—</span>}
                  </td>
                  <td className='px-5 py-3.5 text-sm text-slate-500 tabular-nums'>{t.date}</td>
                  <td className='px-5 py-3.5'>
                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <button
                        onClick={() => openEdit(t)}
                        className='p-1.5 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors'
                        title='Edit'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDelete(t.id)}
                        className='p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors'
                        title='Delete'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between px-5 py-4 border-t border-slate-800'>
              <p className='text-xs text-slate-500'>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, displayed.length)} of {displayed.length}
              </p>
              <div className='flex items-center gap-1.5'>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='px-3 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 transition-colors'
                >← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) => typeof p === 'string'
                    ? <span key={`e${i}`} className='text-slate-600 text-xs px-1'>…</span>
                    : <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs font-semibold rounded-md transition-colors ${
                          p === page
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700'
                        }`}
                      >{p}</button>
                  )
                }
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='px-3 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-800 hover:bg-slate-700 transition-colors'
                >Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Transaction' : 'New Transaction'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {/* Type toggle */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Type</label>
              <div className='flex rounded-lg overflow-hidden border border-slate-700'>
                {['expense', 'income'].map(opt => (
                  <button
                    type='button'
                    key={opt}
                    onClick={() => setForm(f => ({ ...f, type: opt, category_id: '' }))}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors capitalize ${
                      form.type === opt
                        ? opt === 'income'
                          ? 'bg-emerald-500/20 text-emerald-400 border-0'
                          : 'bg-rose-500/20 text-rose-400 border-0'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt === 'income' ? '↑' : '↓'} {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Amount (Rp)</label>
              <input
                className='ft-input'
                type='number'
                placeholder='50000'
                value={form.amount}
                onChange={e => setField('amount', e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Date</label>
              <input
                className='ft-input'
                type='date'
                value={form.date}
                onChange={e => setField('date', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Category</label>
              <select
                className='ft-input'
                value={form.category_id}
                onChange={e => setField('category_id', e.target.value)}
              >
                <option value=''>— None —</option>
                {categories.filter(c => c.type === form.type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Account</label>
              <select
                className='ft-input'
                value={form.account_id}
                onChange={e => setField('account_id', e.target.value)}
              >
                <option value=''>— None —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Note</label>
              <input
                className='ft-input'
                type='text'
                placeholder='Optional description…'
                value={form.note}
                onChange={e => setField('note', e.target.value)}
              />
            </div>

            {formError && (
              <p className='text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2'>{formError}</p>
            )}

            <div className='flex gap-3 pt-1'>
              <button type='submit' disabled={saving} className='ft-btn-primary flex-1 justify-center'>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Transaction'}
              </button>
              <button type='button' onClick={closeModal} className='ft-btn-ghost'>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && (
        <Modal title='Delete Transaction' onClose={closeModal}>
          <div className='flex flex-col gap-5'>
            <p className='text-sm text-slate-300'>
              Are you sure you want to delete this transaction? This action cannot be undone.
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
