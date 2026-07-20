import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://smumwkvkcfnrajamtscq.supabase.co'
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdW13a3ZrY2ZucmFqYW10c2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzI2NzksImV4cCI6MjA5OTE0ODY3OX0.3MQyTJFIVz1waf4FYjfwN8PY2A9W6ymBqI1JeKSptwk'

// Sanitization: Remove quotes, spaces, and any trailing /auth/v1 or /rest/v1 suffixes completely
const supabaseUrl = rawUrl
  .replace(/['"]/g, '')
  .trim()
  .split('/rest/v1')[0]
  .split('/auth/v1')[0]
  .replace(/\/$/, '');

const supabaseAnonKey = rawAnonKey
  .replace(/['"]/g, '')
  .trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
