import fetchWithAuth from './fetchWithAuth'

const BASE = `${import.meta.env.VITE_API_BASE ?? ''}/auth`

// Sends username + password as form data (required by OAuth2PasswordRequestForm).
// Returns the access_token string, or throws on bad credentials.
export async function login(username, password) {
  const body = new URLSearchParams({ username, password })

  const res = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (res.status === 401) throw new Error('Incorrect username or password')
  if (!res.ok) throw new Error('Login failed')

  const data = await res.json()
  return data.access_token
}

// Registers a new account. Returns the created user object.
export async function register(username, password) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (res.status === 400) throw new Error('Username already taken')
  if (!res.ok) throw new Error('Registration failed')

  return res.json()
}

// Notifies the backend of logout, then wipes the token from localStorage.
export async function logout() {
  try {
    await fetchWithAuth(`${BASE}/logout`, { method: 'POST' })
  } finally {
    // Always remove the token locally, even if the request somehow fails
    localStorage.removeItem('ft-token')
  }
}

