import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { HomePage } from './HomePage'
import { AuthModal } from '@/components/auth/AuthModal'
import { PointsPurchase } from '@/components/points/PointsPurchase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  User,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPoints } from '@/types/points'

type OnboardingStep = 'home' | 'auth' | 'points' | 'ready'

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const { user, profile, signOut, addPoints } = useAuth()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('home')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentPoints = profile?.points_balance || 0

  // Auto-advance based on user state
  useEffect(() => {
    if (user && currentPoints > 0) {
      // User is logged in and has points, ready to design
      setCurrentStep('ready')
    } else if (user && currentPoints === 0) {
      // User is logged in but needs to buy points
      setCurrentStep('points')
    }
  }, [user, currentPoints])

  const handleGetStarted = () => {
    if (!user) {
      // Not logged in, show auth modal
      setShowAuthModal(true)
      setCurrentStep('auth')
    } else {
      // Logged in, ready to design (with free trial or purchased points)
      navigate('/design')
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // After successful auth, show ready screen with free trial
    setCurrentStep('ready')
    toast.success('Welcome! You got 5 free exports to start.')
  }

  const handlePointsPurchase = async (packageId: string) => {
    setLoading(true)
    try {
      // Simulate points purchase (replace with actual payment integration)
      const pointsMap: Record<string, number> = {
        'basic': 700,
        'professional': 2000,
        'enterprise': 0
      }

      const points = pointsMap[packageId]
      if (points > 0) {
        await addPoints(points, `Purchased ${packageId} package`)
        toast.success(`${formatPoints(points)} points added to your account!`)
        setShowPointsModal(false)
        setCurrentStep('ready')
        // Navigate to design studio after a short delay
        setTimeout(() => {
          navigate('/design')
        }, 1500)
      }
    } catch (error) {
      toast.error('Failed to add points. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipToDesign = () => {
    navigate('/design')
  }

  const handleBackToHome = () => {
    setCurrentStep('home')
    setShowAuthModal(false)
    setShowPointsModal(false)
  }

  const getProgress = () => {
    switch (currentStep) {
      case 'home': return 0
      case 'auth': return 33
      case 'points': return 66
      case 'ready': return 100
      default: return 0
    }
  }

  // Show home page if not started
  if (currentStep === 'home') {
    return (
      <div>
        <HomePage onStart={handleGetStarted} />
      </div>
    )
  }

  // Show auth modal if needed
  if (showAuthModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl tracking-tight">Welcome to GxStudio</CardTitle>
              <CardDescription className="text-lg">
                Create an account to start designing amazing jerseys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthModal
                isOpen={showAuthModal}
                onClose={handleBackToHome}
                onSuccess={handleAuthSuccess}
                defaultMode="signup"
              />
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={handleBackToHome}
                  className="text-gray-600 hover:text-black hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show points purchase if needed
  if (showPointsModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl tracking-tight">Buy Points to Get Started</CardTitle>
              <CardDescription className="text-lg">
                Choose a package to purchase points for exporting your designs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PointsPurchase
                isOpen={showPointsModal}
                onClose={handleBackToHome}
                onPurchase={handlePointsPurchase}
                currentPoints={currentPoints}
              />
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={handleBackToHome}
                  className="text-gray-600 hover:text-black hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show ready state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="border shadow-sm bg-white">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl tracking-tight">You're All Set!</CardTitle>
            <CardDescription className="text-lg">
              {currentPoints === 5 ? (
                <>
                  You have <strong className="text-black">5 FREE exports</strong> to start! Start designing now.
                </>
              ) : (
                <>
                  You have {formatPoints(currentPoints)} points. Start designing now.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500 font-medium">
                <span>Setup Progress</span>
                <span>{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2 [&>div]:bg-black" />
            </div>

            {/* Steps Completed */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 border rounded-xl">
                <CheckCircle className="w-5 h-5 text-black" />
                <span className="text-sm font-medium text-black">Account Created</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 border rounded-xl">
                <CheckCircle className="w-5 h-5 text-black" />
                <span className="text-sm font-medium text-black">
                  {currentPoints === 5 ? 'Free Trial Activated (5 exports)' : 'Points Available'}
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white border-2 border-black rounded-xl shadow-sm">
                <Sparkles className="w-5 h-5 text-black" />
                <span className="text-sm font-bold text-black">Ready to Design!</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleSkipToDesign}
                size="lg"
                className="w-full h-12 text-lg bg-black text-white hover:bg-gray-800 border border-black"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Start Designing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleBackToHome}
                className="w-full h-12 text-black border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

