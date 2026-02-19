import React, { useEffect, useState, useMemo } from 'react'
import { getTransactions } from '../api/transactions'
import { getCategories } from '../api/categories'
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (val) => 'Rp ' + Number(val).toLocaleString('id-ID')
const CAT_COLORS = [
  '#f59e0b','#8b5cf6','#06b6d4','#34d399','#fb7185',
  '#38bdf8','#f97316','#ec4899','#a3e635','#e879f9',
]

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className='ft-card p-6 flex items-start gap-4'>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className='text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1'>{label}</p>
        <p className='text-xl font-bold text-slate-100 tracking-tight'>{value}</p>
        {sub && <p className='text-xs text-slate-500 mt-0.5'>{sub}</p>}
      </div>
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl'>
      <p className='text-slate-300 font-semibold mb-1'>{d.name}</p>
      <p style={{ color: d.payload.fill }}>{fmt(d.value)}</p>
      <p className='text-slate-500'>{d.payload.pct}%</p>
    </div>
  )
}

function CatPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl'>
      <p className='text-slate-300 font-semibold mb-1'>{d.name}</p>
      <p style={{ color: d.payload.fill }}>{fmt(d.value)}</p>
      <p className='text-slate-500'>{d.payload.pct}%</p>
    </div>
  )
}

function CatLegend({ data }) {
  if (!data?.length) return null
  return (
    <div className='mt-3 max-h-32 overflow-y-auto flex flex-col gap-1.5 pr-1'>
      {data.map((entry, i) => (
        <div key={i} className='flex items-center gap-2 min-w-0'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: entry.fill }} />
          <span className='text-xs text-slate-400 truncate'>{entry.name}</span>
          <span className='text-xs text-slate-500 tabular-nums ml-auto shrink-0'>{entry.pct}%</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardView() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([getTransactions(), getCategories()])
      .then(([txs, cats]) => { if (mounted) { setTransactions(txs); setCategories(cats) } })
      .catch(err => { if (mounted) setError(err.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const catName = (id) => categories.find(c => c.id === id)?.name

  // Month picker options — current + past 11 months
  const monthOptions = useMemo(() => {
    const opts = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      opts.push({ val, lbl: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` })
    }
    return opts
  }, [])

  const monthTxs = useMemo(
    () => transactions.filter(t => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  )

  const monthIncome  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount_cents, 0)
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount_cents, 0)
  const monthBalance = monthIncome - monthExpense

  const pieData = useMemo(() => {
    const total = monthIncome + monthExpense
    if (total === 0) return []
    return [
      { name: 'Income',  value: monthIncome,  fill: '#34d399', pct: Math.round(monthIncome  / total * 100) },
      { name: 'Expense', value: monthExpense, fill: '#fb7185', pct: Math.round(monthExpense / total * 100) },
    ]
  }, [monthIncome, monthExpense])

  const buildCatPie = (txs) => {
    const totals = {}
    txs.forEach(t => {
      const name = categories.find(c => c.id === t.category_id)?.name ?? 'Tanpa Kategori'
      totals[name] = (totals[name] || 0) + t.amount_cents
    })
    const total = Object.values(totals).reduce((s, v) => s + v, 0)
    if (total === 0) return []
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name, value,
        fill: CAT_COLORS[i % CAT_COLORS.length],
        pct: Math.round(value / total * 100),
      }))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const incomeCatData  = useMemo(() => buildCatPie(monthTxs.filter(t => t.type === 'income')),  [monthTxs, categories])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expenseCatData = useMemo(() => buildCatPie(monthTxs.filter(t => t.type === 'expense')), [monthTxs, categories])

  const barData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const txs = transactions.filter(t => t.date.startsWith(key))
      return {
        month:   MONTHS[d.getMonth()],
        income:  txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount_cents, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount_cents, 0),
      }
    })
  }, [transactions])

  const recent = useMemo(() =>
    [...monthTxs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 7)
  , [monthTxs])

  if (loading) return (
    <div className='flex items-center justify-center py-32'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin' />
        <p className='text-slate-500 text-sm'>Loading dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className='ft-card p-5 border-rose-700 bg-rose-900/20 text-rose-400 text-sm'>⚠ {error}</div>
  )

  return (
    <section>
      {/* Header */}
      <div className='flex items-start justify-between mb-8 flex-wrap gap-4'>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className='text-2xl sm:text-4xl font-bold text-slate-100 tracking-tight'>
            Overview
          </h1>
          <p className='text-slate-500 text-sm mt-1'>
            {monthTxs.length} transaction{monthTxs.length !== 1 ? 's' : ''} this month
          </p>
        </div>
        <select
          className='ft-input w-auto'
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        >
          {monthOptions.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
        <StatCard
          label='Monthly Income'
          value={fmt(monthIncome)}
          sub={`${monthTxs.filter(t => t.type === 'income').length} transactions`}
          color='bg-emerald-500/15 text-emerald-400'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M7 11l5-5m0 0l5 5m-5-5v12' /></svg>}
        />
        <StatCard
          label='Monthly Expenses'
          value={fmt(monthExpense)}
          sub={`${monthTxs.filter(t => t.type === 'expense').length} transactions`}
          color='bg-rose-500/15 text-rose-400'
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M17 13l-5 5m0 0l-5-5m5 5V6' /></svg>}
        />
        <StatCard
          label='Net Balance'
          value={(monthBalance < 0 ? '−' : '') + fmt(Math.abs(monthBalance))}
          sub={monthBalance >= 0 ? 'Surplus' : 'Deficit'}
          color={monthBalance >= 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-orange-500/15 text-orange-400'}
          icon={<svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>}
        />
      </div>

      {/* 3 Pie charts */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {/* Chart 1: Income vs Expense donut */}
        <div className='ft-card p-6'>
          <h2 className='text-base font-semibold text-slate-100 mb-4'>Income vs Expense</h2>
          {pieData.length === 0 ? (
            <div className='flex items-center justify-center h-44 text-slate-600 text-sm'>No data for this month.</div>
          ) : (
            <ResponsiveContainer width='100%' height={200}>
              <PieChart>
                <Pie data={pieData} cx='50%' cy='50%' innerRadius={52} outerRadius={76}
                  paddingAngle={3} dataKey='value' stroke='none'>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <ReTooltip content={<PieTooltip />} />
                <Legend formatter={val => <span className='text-slate-400 text-xs'>{val}</span>}
                  iconType='circle' iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Income by Category */}
        <div className='ft-card p-6'>
          <h2 className='text-base font-semibold text-slate-100 mb-4'>Income by Category</h2>
          {incomeCatData.length === 0 ? (
            <div className='flex items-center justify-center h-44 text-slate-600 text-sm'>No income this month.</div>
          ) : (
            <>
              <ResponsiveContainer width='100%' height={180}>
                <PieChart>
                  <Pie data={incomeCatData} cx='50%' cy='50%' innerRadius={52} outerRadius={76}
                    paddingAngle={3} dataKey='value' stroke='none'>
                    {incomeCatData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <ReTooltip content={<CatPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <CatLegend data={incomeCatData} />
            </>
          )}
        </div>

        {/* Chart 3: Expense by Category */}
        <div className='ft-card p-6'>
          <h2 className='text-base font-semibold text-slate-100 mb-4'>Expense by Category</h2>
          {expenseCatData.length === 0 ? (
            <div className='flex items-center justify-center h-44 text-slate-600 text-sm'>No expenses this month.</div>
          ) : (
            <>
              <ResponsiveContainer width='100%' height={180}>
                <PieChart>
                  <Pie data={expenseCatData} cx='50%' cy='50%' innerRadius={52} outerRadius={76}
                    paddingAngle={3} dataKey='value' stroke='none'>
                    {expenseCatData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <ReTooltip content={<CatPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <CatLegend data={expenseCatData} />
            </>
          )}
        </div>
      </div>

      {/* Recent transactions — full width */}
      <div className='ft-card overflow-hidden mb-8'>
        <div className='px-6 py-4 border-b border-slate-800'>
          <h2 className='text-base font-semibold text-slate-100'>Recent Transactions</h2>
        </div>
        {recent.length === 0 ? (
          <div className='px-6 py-12 text-center text-slate-500 text-sm'>No transactions this month.</div>
        ) : (
          <ul className='divide-y divide-slate-800'>
            {recent.map(t => (
              <li key={t.id} className='px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-slate-200 truncate'>
                      {t.note || <span className='text-slate-500 italic'>No note</span>}
                    </p>
                    {catName(t.category_id) && (
                      <p className='text-xs text-slate-500'>{catName(t.category_id)}</p>
                    )}
                  </div>
                </div>
                <div className='text-right shrink-0 ml-4'>
                  <p className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount_cents)}
                  </p>
                  <p className='text-xs text-slate-500'>{t.date}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 6-month bar chart */}
      <div className='ft-card p-6'>
        <h2 className='text-base font-semibold text-slate-100 mb-6'>6-Month Trend</h2>
        <ResponsiveContainer width='100%' height={220}>
          <BarChart data={barData} barCategoryGap='32%' barGap={3}>
            <CartesianGrid strokeDasharray='3 3' stroke='#1e293b' vertical={false} />
            <XAxis dataKey='month' tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}jt` : v >= 1e3 ? `${(v/1e3).toFixed(0)}rb` : v}
              tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={56}
            />
            <ReTooltip
              formatter={(val, name) => [fmt(val), name === 'income' ? 'Income' : 'Expense']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey='income'  fill='#34d399' radius={[4, 4, 0, 0]} name='income' />
            <Bar dataKey='expense' fill='#fb7185' radius={[4, 4, 0, 0]} name='expense' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
