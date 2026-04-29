// Email service for sending OTP codes
// This is a placeholder - integrate with your email service (SendGrid, AWS SES, etc.)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendOTPEmail = async (email: string, otpCode: string): Promise<boolean> => {
  try {
    // TODO: Replace with your actual email service
    // Examples: SendGrid, AWS SES, Resend, Postmark, etc.

    const emailOptions: EmailOptions = {
      to: email,
      subject: 'Verify Your Email - GxDrip',
      html: generateOTPEmailHTML(otpCode),
      text: generateOTPEmailText(otpCode)
    }

    // Example with fetch API (replace with your email service)
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailOptions)
    })

    return response.ok
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

const generateOTPEmailHTML = (otpCode: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">GxDrip</h1>
        <p style="color: white; margin: 10px 0 0 0;">Email Verification</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        
        <p>Thank you for signing up with GxDrip! To complete your registration, please verify your email address using the code below:</p>
        
        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
            ${otpCode}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This code will expire in <strong>10 minutes</strong>.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          © 2025 GxDrip. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `
}

const generateOTPEmailText = (otpCode: string): string => {
  return `
Verify Your Email - GxDrip

Thank you for signing up with GxDrip!

Your verification code is: ${otpCode}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.

© 2025 GxDrip. All rights reserved.
  `
}

// Alternative: Use Supabase Email Templates
export const sendOTPEmailViaSupabase = async (email: string, otpCode: string): Promise<boolean> => {
  try {
    // Supabase handles email sending automatically via their auth system
    // Just need to trigger the email confirmation
    const { error } = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otpCode })
    })

    return !error
  } catch (error) {
    console.error('Error sending email via Supabase:', error)
    return false
  }
}

