// Reads the stored JWT from localStorage and injects it as a Bearer token
// into every request. Drop-in replacement for the native fetch() function.
export default function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('ft-token')

  const headers = {
    ...(options.headers ?? {}),                        // keep any headers the caller passed
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // add the token if we have one
  }

  return fetch(url, { ...options, headers })
}

