const STORAGE_KEY = 'blinkcareProviderSession'

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export function saveSession(session) {
  if (!isBrowser() || !session?.token) return
  try {
    const payload = {
      token: session.token,
      userData: session.userData || null,
      savedAt: Date.now()
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

export function loadSession() {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to load session:', error)
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearSession() {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

