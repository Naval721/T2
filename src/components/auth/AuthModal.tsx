import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export const AuthModal = ({ isOpen, onClose, defaultMode = 'signin', onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'check_email'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { signIn, signUp } = useAuth()

  useEffect(() => {
    if (isOpen) {
      resetForm()
      setMode(defaultMode)
    }
  }, [isOpen, defaultMode])

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address'
    return ''
  }

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const validateName = (name: string) => {
    if (!name) return 'Name is required'
    if (name.length < 2) return 'Name must be at least 2 characters'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { [key: string]: string } = {}
    newErrors.email = validateEmail(email)
    newErrors.password = validatePassword(password)
    if (mode === 'signup') {
      newErrors.fullName = validateName(fullName)
    }

    const hasErrors = Object.values(newErrors).some(error => error !== '')
    setErrors(newErrors)

    if (hasErrors) {
      toast.error('Please fix the errors below')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (!error) {
          resetForm()
          if (onSuccess) onSuccess()
          else onClose()
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp(email, password, fullName)
        if (!error) {
          if (needsEmailConfirmation) {
            setMode('check_email')
          } else {
            resetForm()
            if (onSuccess) onSuccess()
            else onClose()
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setShowPassword(false)
    setErrors({})
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black text-center">
            {mode === 'check_email' ? 'Check your email' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'check_email' ? (
          <div className="text-center space-y-4 py-8">
            <Mail className="w-16 h-16 text-black mx-auto mb-4" />
            <p className="text-gray-600 text-base">
              We've sent a confirmation link to <strong>{email}</strong>.
              Please check your email and click the link to activate your GxDrip account.
            </p>
            <Button
              onClick={onClose}
              className="mt-6 w-full h-11 bg-black text-white hover:bg-gray-800"
            >
              Close
            </Button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-black hover:underline mt-2"
              onClick={() => { setMode('signin'); resetForm() }}
            >
              Wrong email? Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-black">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 border-2 border-gray-300 focus:border-black"
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <Alert className="border-black bg-gray-50 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.fullName}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-2 border-gray-300 focus:border-black"
                    required
                  />
                </div>
                {errors.email && (
                  <Alert className="border-black bg-gray-50 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{errors.email}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-black">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-2 border-gray-300 focus:border-black"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-9 w-9 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <Alert className="border-black bg-gray-50 py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{errors.password}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-black text-white hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  mode === 'signin' ? 'Sign in' : 'Create account'
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="font-semibold text-black hover:underline"
                  onClick={switchMode}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {mode === 'signup' && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Start with 5 free exports. No credit card required.
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
