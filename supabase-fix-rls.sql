-- Fix Row Level Security (RLS) across all core database tables
-- Run this in your Supabase SQL Editor to secure your database

-- 1. USER PROFILES
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. POINTS TRANSACTIONS
ALTER TABLE IF EXISTS points_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
CREATE POLICY "Users can view own transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON points_transactions;
CREATE POLICY "Users can create own transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. POINTS PACKAGES
ALTER TABLE IF EXISTS points_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON points_packages;
CREATE POLICY "Anyone can view active packages" ON points_packages
    FOR SELECT USING (is_active = TRUE);

-- 4. OTP VERIFICATIONS
ALTER TABLE IF EXISTS otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own OTP" ON otp_verifications;
CREATE POLICY "Users can view own OTP" ON otp_verifications
    FOR SELECT USING (auth.email() = email);

DROP POLICY IF EXISTS "Users can insert own OTP" ON otp_verifications;
CREATE POLICY "Users can insert own OTP" ON otp_verifications
    FOR INSERT WITH CHECK (auth.email() = email);

DROP POLICY IF EXISTS "Users can update own OTP" ON otp_verifications;
CREATE POLICY "Users can update own OTP" ON otp_verifications
    FOR UPDATE USING (auth.email() = email);

-- Optional: If design_projects and export_history tables exist from early versions
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'design_projects') THEN
        EXECUTE 'ALTER TABLE design_projects ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own projects" ON design_projects';
        EXECUTE 'CREATE POLICY "Users can view own projects" ON design_projects FOR ALL USING (auth.uid() = user_id)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'export_history') THEN
        EXECUTE 'ALTER TABLE export_history ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own exports" ON export_history';
        EXECUTE 'CREATE POLICY "Users can view own exports" ON export_history FOR ALL USING (auth.uid() = user_id)';
    END IF;
END $$;
