import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface OTPVerificationProps {
  userId: string
  email: string
  onVerified: () => void
  onCancel: () => void
}

export const OTPVerification = ({ userId, email, onVerified, onCancel }: OTPVerificationProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const otpCode = newOtp.join('')
      if (otpCode.length === 6) {
        handleVerify(otpCode)
      }
    }

    setError('')
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      
      // Auto-verify
      setTimeout(() => handleVerify(pastedData), 100)
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    
    if (code.length !== 6) {
      setError('Please enter 6-digit OTP')
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setError('OTP must contain only numbers')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call verify OTP function
      const { data, error } = await supabase.rpc('verify_otp', {
        user_uuid: userId,
        otp_code_input: code
      })

      if (error) {
        throw error
      }

      if (data) {
        toast.success('Email verified successfully! 🎉')
        onVerified()
      } else {
        setAttempts(prev => prev + 1)
        setError('Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setAttempts(prev => prev + 1)
      const message = err instanceof Error ? err.message : 'Failed to verify OTP. Please try again.'
      setError(message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    setAttempts(0)

    try {
      const { data, error } = await supabase.rpc('resend_otp', {
        user_uuid: userId
      })

      if (error) throw error

      if (data) {
        toast.success('New OTP sent to your email!')
        setTimeLeft(600) // Reset timer to 10 minutes
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      toast.error('Failed to resend OTP. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const isExpired = timeLeft <= 0
  const maxAttemptsReached = attempts >= 5

  return (
    <Card className="border-2 border-blue-200 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription className="text-base">
          We've sent a 6-digit code to
        </CardDescription>
        <div className="font-semibold text-blue-600">{email}</div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* OTP Input */}
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={loading || isExpired || maxAttemptsReached}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < 5 && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                {5 - attempts} attempts remaining
              </AlertDescription>
            </Alert>
          )}

          {/* Max Attempts Reached */}
          {maxAttemptsReached && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Maximum attempts reached. Please request a new OTP.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Timer */}
        {!isExpired && !maxAttemptsReached && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Code expires in <strong>{formatTime(timeLeft)}</strong></span>
          </div>
        )}

        {/* Expired Message */}
        {isExpired && !maxAttemptsReached && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              OTP has expired. Please request a new code.
            </AlertDescription>
          </Alert>
        )}

        {/* Verify Button */}
        <Button
          onClick={() => handleVerify()}
          disabled={loading || otp.some(d => !d) || isExpired || maxAttemptsReached}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Verify Email
            </>
          )}
        </Button>

        {/* Resend OTP */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={resendLoading || (!isExpired && !maxAttemptsReached)}
            className="text-blue-600 hover:text-blue-700"
          >
            {resendLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Code
              </>
            )}
          </Button>
        </div>

        {/* Cancel Button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="text-gray-600"
          >
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Didn't receive the code? Check your spam folder.</p>
          <p>The code is valid for 10 minutes.</p>
        </div>
      </CardContent>
    </Card>
  )
}

