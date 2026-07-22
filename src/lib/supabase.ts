import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Warn but don't crash — useAuth has demo-mode fallbacks when these are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[GxDrip] Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Running in demo mode.'
  )
}

// Use real values or dummy placeholders so createClient never throws
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

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

import type { JerseyImages, PlayerData } from '@/pages/Index'

export interface DesignProject {
  id: string
  user_id: string
  project_name: string
  jersey_images: JerseyImages
  player_data: PlayerData[]
  created_at: string
  updated_at: string
  is_public: boolean
}

// Security and rate limiting — frozen so console tampering cannot relax limits
export const SECURITY_CONFIG = Object.freeze({
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW:        60 * 1000,   // 1 minute sliding window
  MAX_REQUESTS_PER_WINDOW:  60           // max points API calls per window
})
