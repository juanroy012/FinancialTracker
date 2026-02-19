import React, { useEffect, useState } from 'react'
import { getCategories, addCategory, editCategory, deleteCategory } from '../api/categories'

const CAT_COLORS = {
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   hex: '#f59e0b' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  hex: '#8b5cf6' },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    hex: '#06b6d4' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', hex: '#10b981' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-400',    hex: '#fb7185' },
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-400',     hex: '#38bdf8' },
  orange:  { bg: 'bg-orange-500/15',  text: 'text-orange-400',  hex: '#f97316' },
  pink:    { bg: 'bg-pink-500/15',    text: 'text-pink-400',    hex: '#ec4899' },
  lime:    { bg: 'bg-lime-500/15',    text: 'text-lime-400',    hex: '#84cc16' },
  purple:  { bg: 'bg-purple-500/15',  text: 'text-purple-400',  hex: '#a855f7' },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-400',    hex: '#14b8a6' },
  indigo:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  hex: '#6366f1' },
  slate:   { bg: 'bg-slate-500/15',   text: 'text-slate-400',   hex: '#64748b' },
}
const COLOR_KEYS = Object.keys(CAT_COLORS)

const CAT_ICONS = [
  '🍽️','🚌','🛒','🎭','💡','📚','💊','💅','📈','📦','💼','🎁',
  '💰','💳','🏗️','🚗','✈️','✏️','🎮','☕','🏋️','🎵','📷','🐕',
  '🌱','⚡','🔧','💎','🛍️','🎪','🌍','💻','📱','🍕','🚀','🌺',
]

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

export default function CategoriesView() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)   // null | 'form' | 'delete'
  const [name, setName] = useState('')
  const [catType, setCatType] = useState('expense')
  const [catIcon, setCatIcon] = useState('')
  const [catColor, setCatColor] = useState('amber')
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const refresh = () => {
    setLoading(true)
    getCategories()
      .then(data => setCategories(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const openAdd  = () => { setName(''); setCatType('expense'); setCatIcon(''); setCatColor('amber'); setEditId(null); setFormError(''); setModal('form') }
  const openEdit = (c) => { setName(c.name); setCatType(c.type || 'expense'); setCatIcon(c.icon || ''); setCatColor(c.color || 'amber'); setEditId(c.id); setFormError(''); setModal('form') }
  const openDelete = (id) => { setDeleteId(id); setModal('delete') }
  const closeModal = () => { setModal(null); setDeleteId(null); setSaving(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setFormError('Category name cannot be empty.'); return }
    setSaving(true)
    setFormError('')
    try {
      if (editId) await editCategory(editId, { name: trimmed, type: catType, icon: catIcon, color: catColor })
      else await addCategory({ name: trimmed, type: catType, icon: catIcon, color: catColor })
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
      await deleteCategory(deleteId)
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
            Categories
          </h1>
          <p className='text-slate-500 text-sm mt-1'>{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className='ft-btn-primary mt-1'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
          </svg>
          Add Category
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className='flex justify-center py-24'>
          <div className='w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin' />
        </div>
      ) : categories.length === 0 ? (
        <div className='ft-card p-16 flex flex-col items-center gap-3 text-center'>
          <svg className='w-10 h-10 text-slate-700' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
          </svg>
          <p className='text-slate-400 font-medium'>No categories yet</p>
          <p className='text-slate-600 text-sm'>Click "Add Category" to get started</p>
        </div>
      ) : (
        <>
          {[{ label: 'Income Categories', color: 'text-emerald-500', items: categories.filter(c => (c.type || 'expense') === 'income') },
            { label: 'Expense Categories', color: 'text-rose-500',    items: categories.filter(c => (c.type || 'expense') === 'expense') },
          ].map(({ label, color, items }) => items.length === 0 ? null : (
            <div key={label} className='mb-8'>
              <h2 className={`text-xs font-semibold uppercase tracking-widest mb-3 ${color}`}>{label}</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {items.map((c, i) => {
                  const colorKey = c.color || COLOR_KEYS[i % COLOR_KEYS.length]
                  const cs = CAT_COLORS[colorKey] || CAT_COLORS.amber
                  return (
                    <div
                      key={c.id}
                      className='ft-card p-5 flex items-center justify-between group hover:border-slate-700 transition-colors'
                    >
                      <div className='flex items-center gap-4'>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cs.bg}`}>
                          {c.icon
                            ? <span className='text-xl leading-none'>{c.icon}</span>
                            : <span className={`font-bold text-lg ${cs.text}`}>{c.name.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <p className='text-sm font-semibold text-slate-100'>{c.name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            (c.type || 'expense') === 'income'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {c.type || 'expense'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          onClick={() => openEdit(c)}
                          className='p-1.5 rounded-md text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors'
                          title='Edit'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDelete(c.id)}
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
            </div>
          ))}
        </>
      )}

      {/* Add / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Category' : 'New Category'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {/* Type toggle */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Type</label>
              <div className='flex rounded-lg overflow-hidden border border-slate-700'>
                {['expense', 'income'].map(opt => (
                  <button
                    type='button'
                    key={opt}
                    onClick={() => setCatType(opt)}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors capitalize ${
                      catType === opt
                        ? opt === 'income'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt === 'income' ? '↑' : '↓'} {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Icon</label>
              <div className='grid grid-cols-9 gap-1.5 p-3 rounded-lg bg-slate-900/50 border border-slate-800'>
                <button type='button' onClick={() => setCatIcon('')}
                  className={`h-8 rounded text-xs font-semibold transition-colors ${
                    catIcon === '' ? 'bg-amber-500/20 ring-1 ring-amber-500 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}>
                  A
                </button>
                {CAT_ICONS.map((emoji, i) => (
                  <button type='button' key={i} onClick={() => setCatIcon(emoji)}
                    className={`h-8 rounded text-lg leading-none transition-all ${
                      catIcon === emoji ? 'bg-amber-500/20 ring-1 ring-amber-500 scale-110' : 'hover:bg-slate-800'
                    }`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>Color</label>
              <div className='flex flex-wrap gap-2'>
                {Object.entries(CAT_COLORS).map(([key, cs]) => (
                  <button type='button' key={key} onClick={() => setCatColor(key)}
                    title={key}
                    className={`w-7 h-7 rounded-full transition-all ${
                      catColor === key ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: cs.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Category Name */}
            <div>
              <label className='block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2'>
                Category Name
              </label>
              <input
                className='ft-input'
                type='text'
                placeholder='e.g. Groceries, Rent, Salary…'
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            {formError && (
              <p className='text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2'>{formError}</p>
            )}

            <div className='flex gap-3 pt-1'>
              <button type='submit' disabled={saving} className='ft-btn-primary flex-1 justify-center'>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Category'}
              </button>
              <button type='button' onClick={closeModal} className='ft-btn-ghost'>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && (
        <Modal title='Delete Category' onClose={closeModal}>
          <div className='flex flex-col gap-5'>
            <p className='text-sm text-slate-300'>
              Deleting this category will not remove associated transactions, but they will no longer be linked to a category.
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
