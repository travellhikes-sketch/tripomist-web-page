import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://smumwkvkcfnrajamtscq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Mock implementation of Supabase Auth for zero-config testing
class MockAuth {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('mock_users') || '[]')
    this.currentUser = JSON.parse(localStorage.getItem('mock_current_user') || 'null')
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
    localStorage.setItem('mock_users', JSON.stringify(this.users))
    
    // Automatically log user in upon signup
    this.currentUser = newUser
    localStorage.setItem('mock_current_user', JSON.stringify(this.currentUser))
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
    localStorage.setItem('mock_current_user', JSON.stringify(this.currentUser))
    window.dispatchEvent(new Event('auth-state-change'))

    return { data: { user: found.user }, error: null }
  }

  async signOut() {
    await new Promise(resolve => setTimeout(resolve, 200))
    this.currentUser = null
    localStorage.removeItem('mock_current_user')
    window.dispatchEvent(new Event('auth-state-change'))
    return { error: null }
  }

  async getUser() {
    this.currentUser = JSON.parse(localStorage.getItem('mock_current_user') || 'null')
    return { data: { user: this.currentUser }, error: null }
  }

  onAuthStateChange(callback) {
    const handler = () => {
      this.currentUser = JSON.parse(localStorage.getItem('mock_current_user') || 'null')
      callback('SIGNED_IN', this.currentUser ? { user: this.currentUser } : null)
    }

    window.addEventListener('auth-state-change', handler)
    
    // Trigger initial auth state callback
    const initialUser = JSON.parse(localStorage.getItem('mock_current_user') || 'null')
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

if (!supabaseAnonKey) {
  console.warn("Supabase VITE_SUPABASE_ANON_KEY is missing. Falling back to local storage mock auth.")
  isMock = true
  const mockInstance = new MockAuth()
  supabase = {
    auth: mockInstance,
    isMock: true
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  supabase.isMock = false
}

export { supabase, isMock }
