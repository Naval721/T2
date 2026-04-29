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
  Paintbrush,
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
  const [displayProgress, setDisplayProgress] = useState(0)

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
    // Enterprise is a custom/contact plan — no direct points to add
    if (packageId === 'enterprise') {
      toast.info('For enterprise pricing, please contact us.')
      navigate('/contact')
      return
    }

    setLoading(true)
    try {
      const pointsMap: Record<string, number> = {
        'basic': 700,
        'professional': 2000,
      }

      const points = pointsMap[packageId]
      if (points && points > 0) {
        await addPoints(points, `Purchased ${packageId} package`)
        toast.success(`${formatPoints(points)} points added to your account!`)
        setShowPointsModal(false)
        setCurrentStep('ready')
        setTimeout(() => {
          navigate('/design')
        }, 1500)
      } else {
        toast.error('Unknown package selected.')
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
  // Smooth progress bar animation
  useEffect(() => {
    let target = 0
    if (currentStep === 'home') target = 0
    if (currentStep === 'auth') target = 33
    if (currentStep === 'points') target = 66
    if (currentStep === 'ready') target = 100

    const timer = setTimeout(() => setDisplayProgress(target), 50)
    return () => clearTimeout(timer)
  }, [currentStep])

  const handleBackToHome = () => {
    setCurrentStep('home')
    setShowAuthModal(false)
    setShowPointsModal(false)
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
              <CardTitle className="text-3xl tracking-tight">Welcome to GxDrip</CardTitle>
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-6 border-b border-gray-100">
            <div className="mx-auto w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl transform transition-transform hover:scale-110 hover:rotate-3 duration-300">
              <CheckCircle className="w-10 h-10 text-white animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
              You're All Set!
            </CardTitle>
            <CardDescription className="text-lg">
              {currentPoints === 5 ? (
                <>
                  You have <strong className="text-black inline-block px-2 py-0.5 bg-gray-100 rounded-md">5 FREE exports</strong> to start! Start designing now.
                </>
              ) : (
                <>
                  You have <strong className="text-black inline-block px-2 py-0.5 bg-gray-100 rounded-md">{formatPoints(currentPoints)} points</strong>. Start designing now.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {/* Steps Completed */}
            <div className="space-y-3">
              <div className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-base font-semibold text-gray-700">Account Created</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>

              <div className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-base font-semibold text-gray-700">
                    {currentPoints === 5 ? 'Free Trial Activated' : 'Points Available'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {currentPoints === 5 ? '5 Exports' : `${formatPoints(currentPoints)} pts`}
                </span>
              </div>

              <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl shadow-lg ring-4 ring-gray-100 transform transition-all hover:-translate-y-1 hover:shadow-2xl cursor-default">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Paintbrush className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">Ready to Design!</span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Start Now</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 pt-4">
              <Button
                onClick={handleSkipToDesign}
                size="lg"
                className="w-full h-14 text-lg font-bold bg-black text-white hover:bg-gray-900 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative group"
                disabled={loading}
              >
                {/* Shine effect overlay */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Initializing Studio...
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <span>Enter Design Studio</span>
                    <ArrowRight className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={handleBackToHome}
                className="w-full h-12 text-gray-500 hover:text-black hover:bg-gray-100 font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Wait, back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

