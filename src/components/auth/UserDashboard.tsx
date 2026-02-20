import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { PointsPurchase } from '@/components/points/PointsPurchase'
import {
  User,
  Crown,
  Download,
  Calendar,
  Settings,
  LogOut,
  Sparkles,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  Gift
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPoints, formatCurrency, calculateExportsPossible } from '@/types/points'

interface UserDashboardProps {
  onClose: () => void
}

export const UserDashboard = ({ onClose }: UserDashboardProps) => {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    onClose()
    setLoading(false)
  }

  const currentPoints = profile?.points_balance || 0
  const totalPurchased = profile?.total_points_purchased || 0
  const totalUsed = profile?.total_points_used || 0

  const exportsPossible = calculateExportsPossible(currentPoints)

  const handlePurchasePoints = async (packageId: string) => {
    // This will be handled by the useAuth hook
    toast.info('Points purchase coming soon!')
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{profile.full_name || 'User'}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
              </div>
            </div>
            <Badge className="bg-black text-white hover:bg-gray-800">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>{formatPoints(currentPoints)} points</span>
              </div>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Free Trial Banner */}
      {currentPoints === 5 && (
        <Alert className="bg-gray-50 border-gray-200">
          <Gift className="h-5 w-5 text-black" />
          <AlertDescription>
            <p className="font-semibold text-black mb-1">Free Trial Active!</p>
            <p className="text-gray-600 text-sm">
              You have 5 free exports to try our platform. Buy more points to continue after your trial!
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Points Balance */}
      <Card className="border shadow-sm bg-gray-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-black" />
            <span>Points Balance</span>
            {currentPoints === 5 && (
              <Badge variant="outline" className="ml-2 bg-white text-black border-gray-200">
                <Gift className="w-3 h-3 mr-1" />
                Free Trial
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Your current points and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-white rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 mb-2 font-medium">Available Points</p>
            <p className="text-5xl font-bold text-black">{formatPoints(currentPoints)}</p>
            {currentPoints === 5 && (
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Free trial - 5 free exports
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Total Purchased</p>
              <p className="text-xl font-bold text-black">{formatPoints(totalPurchased)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Total Used</p>
              <p className="text-xl font-bold text-black">{formatPoints(totalUsed)}</p>
            </div>
          </div>

          <Button
            onClick={() => setShowPurchaseDialog(true)}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy More Points
          </Button>
        </CardContent>
      </Card>

      {/* What You Can Export */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>What You Can Export</span>
          </CardTitle>
          <CardDescription>
            Based on your current points balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1 font-medium">Front Images</p>
              <p className="text-2xl font-bold text-black">{exportsPossible.frontOnly}</p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1 font-medium">Back Images</p>
              <p className="text-2xl font-bold text-black">{exportsPossible.backOnly}</p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1 font-medium">Full Jerseys</p>
              <p className="text-2xl font-bold text-black">{exportsPossible.fullJersey}</p>
            </div>
            <div className="bg-gray-50 border p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1 font-medium">With Collar</p>
              <p className="text-2xl font-bold text-black">{exportsPossible.fullJerseyWithCollar}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point Costs Info */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Point Costs</CardTitle>
          <CardDescription>How many points each export costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">
              <span className="text-sm font-medium">Front Image</span>
              <Badge variant="outline" className="font-bold bg-white text-black border-gray-200">1 point</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">
              <span className="text-sm font-medium">Back Image</span>
              <Badge variant="outline" className="font-bold bg-white text-black border-gray-200">2 points</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">
              <span className="text-sm font-medium">Per Sleeve</span>
              <Badge variant="outline" className="font-bold bg-white text-black border-gray-200">1 point</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-xl">
              <span className="text-sm font-medium">Collar</span>
              <Badge variant="outline" className="font-bold bg-white text-black border-gray-200">1 point</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-black/10 rounded-xl">
              <span className="text-sm font-semibold text-black">Full Jersey (F+B+2S)</span>
              <Badge className="font-bold bg-black text-white">4 points</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-black/10 rounded-xl">
              <span className="text-sm font-semibold text-black">Full Jersey with Collar</span>
              <Badge className="font-bold bg-black text-white">5 points</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Your Features</CardTitle>
          <CardDescription>All features available with points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High-Quality Exports (300 DPI)</span>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Individual Sleeve Export</span>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secure Cloud Storage</span>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">No Watermarks</span>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Points Never Expire</span>
              <CheckCircle className="w-4 h-4 text-black" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-gray-100" />

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start border-gray-200 hover:bg-gray-50"
          onClick={() => toast.info('Settings coming soon!')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start text-red-600 border-red-100 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
          disabled={loading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>

      {/* Points Purchase Dialog */}
      <PointsPurchase
        isOpen={showPurchaseDialog}
        onClose={() => setShowPurchaseDialog(false)}
        onPurchase={handlePurchasePoints}
        currentPoints={currentPoints}
      />
    </div>
  )
}
