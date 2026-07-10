import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://smumwkvkcfnrajamtscq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Safe storage helper supporting localStorage -> sessionStorage -> window.name fallbacks
let storageType = 'local'
if (typeof window !== 'undefined') {
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
  } catch (e) {
    try {
      const testKey = '__storage_test__'
      window.sessionStorage.setItem(testKey, testKey)
      window.sessionStorage.removeItem(testKey)
      storageType = 'session'
    } catch (e2) {
      storageType = 'name'
    }
  }
}

const safeStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null
    if (storageType === 'local') {
      try { const val = window.localStorage.getItem(key); if (val !== null) return val; } catch (e) {}
    }
    try { const val = window.sessionStorage.getItem(key); if (val !== null) return val; } catch (e) {}
    try {
      const data = JSON.parse(window.name || '{}')
      return data[key] || null
    } catch(e) {
      return null
    }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return
    if (storageType === 'local') {
      try { window.localStorage.setItem(key, value); } catch (e) {}
    }
    try { window.sessionStorage.setItem(key, value); } catch (e) {}
    try {
      const data = JSON.parse(window.name || '{}')
      data[key] = value
      window.name = JSON.stringify(data)
    } catch(e) {}
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return
    if (storageType === 'local') {
      try { window.localStorage.removeItem(key); } catch (e) {}
    }
    try { window.sessionStorage.removeItem(key); } catch (e) {}
    try {
      const data = JSON.parse(window.name || '{}')
      delete data[key]
      window.name = JSON.stringify(data)
    } catch(e) {}
  }
}

// Mock implementation of Supabase Auth for zero-config testing
class MockAuth {
  constructor() {
    this.users = JSON.parse(safeStorage.getItem('mock_users') || '[]')
    this.currentUser = JSON.parse(safeStorage.getItem('mock_current_user') || 'null')
  }

  async signUp({ email, password, options }) {
    // Artificial latency to simulate a network request
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!email || !password) {
      return { error: { message: "Email and password are required." } }
    }
    if (this.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: { message: "User with this email already exists." } }
    }

    const fullName = options?.data?.full_name || email.split('@')[0]
    const newUser = {
      id: Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      user_metadata: { full_name: fullName }
    }

    this.users.push({ email: email.toLowerCase(), password, user: newUser })
    safeStorage.setItem('mock_users', JSON.stringify(this.users))
    
    // Automatically log user in upon signup
    this.currentUser = newUser
    safeStorage.setItem('mock_current_user', JSON.stringify(this.currentUser))
    window.dispatchEvent(new Event('auth-state-change'))

    return { data: { user: newUser }, error: null }
  }

  async signInWithPassword({ email, password }) {
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!email || !password) {
      return { error: { message: "Email and password are required." } }
    }

    const found = this.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!found) {
      return { error: { message: "Invalid email or password." } }
    }

    this.currentUser = found.user
    safeStorage.setItem('mock_current_user', JSON.stringify(this.currentUser))
    window.dispatchEvent(new Event('auth-state-change'))

    return { data: { user: found.user }, error: null }
  }

  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 200))
    this.currentUser = null
    safeStorage.removeItem('mock_current_user')
    window.dispatchEvent(new Event('auth-state-change'))
    return { error: null }
  }

  async getUser() {
    this.currentUser = JSON.parse(safeStorage.getItem('mock_current_user') || 'null')
    return { data: { user: this.currentUser }, error: null }
  }

  onAuthStateChange(callback) {
    const handler = () => {
      this.currentUser = JSON.parse(safeStorage.getItem('mock_current_user') || 'null')
      callback('SIGNED_IN', this.currentUser ? { user: this.currentUser } : null)
    }

    window.addEventListener('auth-state-change', handler)
    
    // Trigger initial auth state callback
    const initialUser = JSON.parse(safeStorage.getItem('mock_current_user') || 'null')
    callback('INITIAL_SESSION', initialUser ? { user: initialUser } : null)

    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('auth-state-change', handler)
        }
      }
    }
  }
}

let supabase
let isMock = false

const forceMock = safeStorage.getItem('use_mock_auth') === 'true'

if (!supabaseAnonKey || forceMock) {
  if (forceMock) {
    console.log("Mock Mode forced by user.")
  } else {
    console.warn("Supabase VITE_SUPABASE_ANON_KEY is missing. Falling back to local storage mock auth.")
  }
  isMock = true
  const mockInstance = new MockAuth()
  supabase = {
    auth: mockInstance,
    isMock: true
  }
} else {
  const clientOptions = {
    auth: {
      storage: safeStorage,
      persistSession: storageType === 'local',
      detectSessionInUrl: true
    }
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  supabase.isMock = false
}

export { supabase, isMock, safeStorage }
