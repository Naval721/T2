-- OTP Verification System for Email Confirmation
-- Run this AFTER running the main supabase-schema-points.sql

-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user_id ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_otp_code ON otp_verifications(otp_code);

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own OTP" ON otp_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP" ON otp_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP" ON otp_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to generate OTP
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS VARCHAR(6) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create OTP verification
CREATE OR REPLACE FUNCTION public.create_otp_verification(
    user_uuid UUID,
    user_email TEXT
)
RETURNS VARCHAR(6) AS $$
DECLARE
    otp_code VARCHAR(6);
    expires_at TIMESTAMPTZ;
BEGIN
    -- Generate 6-digit OTP
    otp_code := public.generate_otp();
    
    -- Set expiration to 10 minutes from now
    expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Insert OTP verification record
    INSERT INTO otp_verifications (user_id, email, otp_code, expires_at)
    VALUES (user_uuid, user_email, otp_code, expires_at)
    ON CONFLICT (user_id) DO UPDATE SET
        otp_code = EXCLUDED.otp_code,
        expires_at = EXCLUDED.expires_at,
        verified = FALSE,
        attempts = 0,
        created_at = NOW();
    
    RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
    user_uuid UUID,
    otp_code_input VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
    otp_record RECORD;
BEGIN
    -- Get the most recent OTP for the user
    SELECT * INTO otp_record
    FROM otp_verifications
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if OTP exists
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if already verified
    IF otp_record.verified THEN
        RETURN FALSE;
    END IF;
    
    -- Check if expired
    IF otp_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Check if max attempts exceeded (5 attempts)
    IF otp_record.attempts >= 5 THEN
        RETURN FALSE;
    END IF;
    
    -- Increment attempts
    UPDATE otp_verifications
    SET attempts = attempts + 1
    WHERE id = otp_record.id;
    
    -- Check if OTP matches
    IF otp_record.otp_code = otp_code_input THEN
        -- Mark as verified
        UPDATE otp_verifications
        SET verified = TRUE
        WHERE id = otp_record.id;
        
        -- Update user email confirmation in auth.users
        UPDATE auth.users
        SET email_confirmed_at = NOW()
        WHERE id = user_uuid;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend OTP
CREATE OR REPLACE FUNCTION public.resend_otp(
    user_uuid UUID
)
RETURNS VARCHAR(6) AS $$
DECLARE
    user_email TEXT;
    otp_code VARCHAR(6);
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Create new OTP
    otp_code := public.create_otp_verification(user_uuid, user_email);
    
    RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if OTP is expired
CREATE OR REPLACE FUNCTION public.is_otp_expired(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    otp_record RECORD;
BEGIN
    SELECT * INTO otp_record
    FROM otp_verifications
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;
    
    RETURN otp_record.expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON otp_verifications TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

