import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from './AuthModal'
import { UserDashboard } from './UserDashboard'
import {
  Crown,
  Lock,
  Star,
  Rocket,
  Lock as LockIcon,
  Download,
  CheckCircle,
  Users,
  Award,
  ShoppingCart,
  AlertTriangle,
  LogIn
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useState } from 'react'

interface PremiumGateProps {
  children: React.ReactNode
  feature: string
  description?: string
}

export const PremiumGate = ({ children, feature, description }: PremiumGateProps) => {
  const { user, profile, hasEnoughPoints, currentPoints, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserDashboard, setShowUserDashboard] = useState(false)

  // While auth/profile is loading, show a neutral loading state — never a false lockout
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono uppercase tracking-widest text-gray-500">Loading account...</p>
        </div>
      </div>
    )
  }

  // If user has points, show the content
  if (user && hasEnoughPoints) {
    return <>{children}</>
  }

  // If user is logged in but has no points
  if (user && !hasEnoughPoints) {
    return (
      <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center border-4 border-black">
            <AlertTriangle className="w-10 h-10 stroke-[3]" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">
            Points Required
          </h2>
          <p className="text-lg font-medium text-gray-500 max-w-md mx-auto">
            Access to high-resolution export requires credits. Top up your account to continue.
          </p>
        </div>

        {profile && (
          <div className="inline-block px-6 py-3 border-2 border-black bg-gray-50 font-mono text-sm font-bold uppercase tracking-widest">
            Current Balance: {currentPoints} PTS
          </div>
        )}

        <div className="space-y-4 max-w-xs mx-auto pt-4">
          <Button
            onClick={() => setShowUserDashboard(true)}
            className="w-full h-14 bg-black text-white hover:bg-gray-800 border-2 border-black font-bold uppercase tracking-widest text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Get Points
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowUserDashboard(true)}
            className="w-full h-12 bg-white text-black border-2 border-black hover:bg-gray-100 font-bold uppercase tracking-widest"
          >
            My Account
          </Button>
        </div>

        <Dialog open={showUserDashboard} onOpenChange={setShowUserDashboard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <UserDashboard onClose={() => setShowUserDashboard(false)} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // If user is not logged in
  return (
    <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-4px] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
      <div className="p-10 text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-black text-white flex items-center justify-center border-4 border-black relative group">
            <div className="absolute inset-0 bg-white border-2 border-black translate-x-1 translate-y-1 z-0"></div>
            <Lock className="w-12 h-12 stroke-[3] relative z-10" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
            Authentication<br />Required
          </h2>
          <div className="w-24 h-2 bg-black mx-auto"></div>
          <p className="text-xl font-medium text-gray-600 max-w-lg mx-auto leading-relaxed">
            {description || `Sign in to access ${feature} and manage your professional design portfolio.`}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y-4 border-black border-dashed my-8">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Premium Assets</h3>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto">
              <LockIcon className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Secure Storage</h3>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 border-2 border-black flex items-center justify-center mx-auto">
              <Rocket className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-bold uppercase tracking-wider text-sm">Fast Export</h3>
          </div>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full h-16 bg-black text-white hover:bg-gray-800 border-4 border-black font-black uppercase tracking-widest text-xl shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-y-[-2px] transition-all"
          >
            <LogIn className="w-6 h-6 mr-3" />
            Enter Studio
          </Button>

          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Join the creative network
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
