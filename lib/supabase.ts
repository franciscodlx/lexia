import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ENV } from '@/lib/env'

// Placeholders keep createClient from throwing at import time when .env.local
// is absent — the app boots in local-only mode and cloud calls fail per-request.
const supabaseUrl = ENV.supabaseUrl || 'https://placeholder.supabase.co'
const supabaseAnonKey = ENV.supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
