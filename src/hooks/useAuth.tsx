import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, UserProfile, SECURITY_CONFIG } from '@/lib/supabase'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null, needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
  checkPointsBalance: (pointsNeeded: number) => boolean
  deductPoints: (points: number, description: string) => Promise<{ success: boolean; error?: any }>
  addPoints: (points: number, description: string) => Promise<{ success: boolean; error?: any }>
  hasEnoughPoints: boolean
  currentPoints: number
  isPremium: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      logger.warn('Supabase not configured - running in demo mode')
      setLoading(false)
      return
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session?.user) {
        setLoading(false)
      }
    })

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 3. Keep profile strictly synced with the active user
  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchUserProfile(user.id)
    }
  }, [user?.id])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logger.error('Error fetching profile:', error)
        // Create profile if it doesn't exist
        await createUserProfile(userId)
      } else {
        setProfile(data)
      }
    } catch (error) {
      logger.error('Error in fetchUserProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        points_balance: 5, // Free trial: 5 free exports
        total_points_purchased: 5,
        total_points_used: 0
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ id: userId, ...newProfile }])
        .select()
        .single()

      if (error) {
        logger.error('Error creating profile:', error)
      } else {
        setProfile(data)
        // Create free trial transaction
        await supabase
          .from('points_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'bonus',
            points_amount: 5,
            description: 'Free trial - 5 free exports'
          })
      }
    } catch (error) {
      logger.error('Error in createUserProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        toast.error('Please fill in all fields')
        return { error: { message: 'Missing required fields' } as AuthError }
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long')
        return { error: { message: 'Password too short' } as AuthError }
      }

      if (!email.includes('@')) {
        toast.error('Please enter a valid email address')
        return { error: { message: 'Invalid email format' } as AuthError }
      }

      // Demo Mode Fallback if Supabase missing
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const fakeUserId = 'demo-user-' + Date.now();
        setUser({ id: fakeUserId, email, user_metadata: { full_name: fullName } } as unknown as User);
        setProfile({
          id: fakeUserId,
          email,
          full_name: fullName,
          points_balance: 50,
          total_points_purchased: 50,
          total_points_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserProfile);
        toast.success('Demo mode account created! 50 test points granted.')
        return { error: null, needsEmailConfirmation: false }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        logger.error('Sign up error:', error)
        toast.error(error.message)
        return { error }
      }

      let needsEmailConfirmation = false;
      if (data.user && !data.user.email_confirmed_at) {
        needsEmailConfirmation = true;
        toast.success('Account created! Please check your email to confirm your account.')
      } else {
        toast.success('Account created successfully!')
      }

      return { error: null, needsEmailConfirmation }
    } catch (error) {
      logger.error('Unexpected sign up error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        toast.error('Please fill in all fields')
        return { error: { message: 'Missing required fields' } as AuthError }
      }

      if (!email.includes('@')) {
        toast.error('Please enter a valid email address')
        return { error: { message: 'Invalid email format' } as AuthError }
      }

      // Demo Mode Fallback
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        const fakeUserId = 'demo-user-' + Date.now();
        setUser({ id: fakeUserId, email, user_metadata: { full_name: 'Demo User' } } as unknown as User);
        setProfile({
          id: fakeUserId,
          email,
          full_name: 'Demo User',
          points_balance: 50,
          total_points_purchased: 50,
          total_points_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserProfile);
        toast.success('Signed in using Demo Mode!');
        return { error: null }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error('Sign in error:', error)
        toast.error(error.message)
        return { error }
      }

      toast.success('Welcome back!')
      return { error: null }
    } catch (error) {
      logger.error('Unexpected sign in error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setUser(null)
        setProfile(null)
        toast.success('Signed out (Demo Mode)')
        return;
      }

      const { error } = await supabase.auth.signOut()

      // Always clear local state on sign out attempt
      setUser(null)
      setProfile(null)

      if (error) {
        // Log the error but don't prevent user from experiencing a sign-out locally
        logger.warn('Sign out warning:', error.message)
        toast.success('Signed out successfully')
      } else {
        toast.success('Signed out successfully')
      }
    } catch (error) {
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update profile')
        return { error }
      }

      setProfile(data)
      toast.success('Profile updated successfully')
      return { error: null }
    } catch (error) {
      toast.error('An unexpected error occurred')
      return { error }
    }
  }

  const checkPointsBalance = (pointsNeeded: number): boolean => {
    if (!profile) return false
    return profile.points_balance >= pointsNeeded
  }

  const deductPoints = async (points: number, description: string): Promise<{ success: boolean; error?: any }> => {
    if (!user || !profile) {
      return { success: false, error: 'Not authenticated' }
    }

    if (profile.points_balance < points) {
      return { success: false, error: 'Insufficient points' }
    }

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: profile.points_balance - points,
          total_points_used: profile.total_points_used + points,
          last_points_update: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        logger.error('Error deducting points:', updateError)
        return { success: false, error: updateError }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'usage',
          points_amount: -points,
          description
        })

      if (transactionError) {
        logger.error('Error creating transaction:', transactionError)
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        points_balance: prev.points_balance - points,
        total_points_used: prev.total_points_used + points
      } : null)

      return { success: true }
    } catch (error) {
      logger.error('Error in deductPoints:', error)
      return { success: false, error }
    }
  }

  const addPoints = async (points: number, description: string): Promise<{ success: boolean; error?: any }> => {
    if (!user || !profile) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: profile.points_balance + points,
          total_points_purchased: profile.total_points_purchased + points,
          last_points_update: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        logger.error('Error adding points:', updateError)
        return { success: false, error: updateError }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'purchase',
          points_amount: points,
          description
        })

      if (transactionError) {
        logger.error('Error creating transaction:', transactionError)
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        points_balance: prev.points_balance + points,
        total_points_purchased: prev.total_points_purchased + points
      } : null)

      return { success: true }
    } catch (error) {
      logger.error('Error in addPoints:', error)
      return { success: false, error }
    }
  }

  const hasEnoughPoints = profile ? profile.points_balance > 0 : false
  const currentPoints = profile?.points_balance || 0
  const isPremium = profile ? profile.total_points_purchased > 100 : false // Premium if user has purchased more than 100 points total

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkPointsBalance,
    deductPoints,
    addPoints,
    hasEnoughPoints,
    currentPoints,
    isPremium
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}