import fetchWithAuth from './fetchWithAuth'

const BASE = `${import.meta.env.VITE_API_BASE ?? ''}/accounts`

export async function getAccounts() {
  const res = await fetchWithAuth(`${BASE}/`)
  if (!res.ok) throw new Error('Failed to fetch accounts')
  return res.json()
}

export async function getAccountByName(name) {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error('Account not found')
  return res.json()
}

export async function addAccount(account) {
  const res = await fetchWithAuth(`${BASE}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: account.type, name: account.name, balance: account.balance ?? 0, icon: account.icon ?? '', currency: account.currency ?? 'IDR' }),
  })
  if (!res.ok) throw new Error('Failed to add account')
  return res.json()
}

export async function editAccount(id, account) {
  const res = await fetchWithAuth(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: account.type, name: account.name, balance: account.balance ?? 0, icon: account.icon ?? '', currency: account.currency ?? 'IDR' }),
  })
  if (!res.ok) throw new Error('Failed to edit account')
  return res.json()
}

export async function deleteAccount(id) {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete account')
}
