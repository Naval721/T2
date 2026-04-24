import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Always throw error if missing, even in development, to prevent silent failures
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  points_balance: number
  total_points_purchased: number
  total_points_used: number
  last_points_update?: string
  created_at: string
  updated_at: string
}

export interface DesignProject {
  id: string
  user_id: string
  project_name: string
  jersey_images: any
  player_data: any
  created_at: string
  updated_at: string
  is_public: boolean
}

// Security and rate limiting
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 10
}
