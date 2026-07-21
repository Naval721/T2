-- Jersey Designer Pro - Points/Credits System Database Schema
-- Run this in your Supabase SQL editor

-- Drop dependent views first
DROP VIEW IF EXISTS user_dashboard_data CASCADE;
DROP VIEW IF EXISTS user_points_dashboard CASCADE;

-- Update user_profiles table to use points instead of subscription
ALTER TABLE user_profiles 
  DROP COLUMN IF EXISTS subscription_tier,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_expires_at,
  DROP COLUMN IF EXISTS usage_count,
  DROP COLUMN IF EXISTS max_exports_per_month;

-- Add points columns
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS points_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_purchased INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_points_update TIMESTAMPTZ DEFAULT NOW();

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    points_amount INTEGER NOT NULL, -- positive for purchase/bonus, negative for usage
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create points_packages table
CREATE TABLE IF NOT EXISTS points_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id TEXT NOT NULL UNIQUE, -- 'basic', 'professional', 'enterprise'
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    points INTEGER NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default points packages
INSERT INTO points_packages (package_id, name, description, price, points, bonus_points) VALUES
('basic', 'Basic Package', 'Perfect for small projects', 1000.00, 700, 0),
('professional', 'Professional Package', 'Best value for designers', 2500.00, 2000, 200),
('enterprise', 'Enterprise Package', 'Custom pricing for large teams', 0.00, 0, 0)
ON CONFLICT (package_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points_balance ON user_profiles(points_balance);

-- Create function to add points to user account
CREATE OR REPLACE FUNCTION public.add_points_to_user(
    user_uuid UUID,
    points_to_add INTEGER,
    transaction_description TEXT,
    transaction_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update user profile
    UPDATE user_profiles 
    SET 
        points_balance = points_balance + points_to_add,
        total_points_purchased = total_points_purchased + points_to_add,
        last_points_update = NOW()
    WHERE id = user_uuid;
    
    -- Create transaction record
    INSERT INTO points_transactions (user_id, transaction_type, points_amount, description, metadata)
    VALUES (user_uuid, 'purchase', points_to_add, transaction_description, transaction_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deduct points from user account
CREATE OR REPLACE FUNCTION public.deduct_points_from_user(
    user_uuid UUID,
    points_to_deduct INTEGER,
    transaction_description TEXT,
    transaction_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT points_balance INTO current_balance FROM user_profiles WHERE id = user_uuid;
    
    -- Check if user has enough points
    IF current_balance < points_to_deduct THEN
        RETURN FALSE;
    END IF;
    
    -- Update user profile
    UPDATE user_profiles 
    SET 
        points_balance = points_balance - points_to_deduct,
        total_points_used = total_points_used + points_to_deduct,
        last_points_update = NOW()
    WHERE id = user_uuid;
    
    -- Create transaction record
    INSERT INTO points_transactions (user_id, transaction_type, points_amount, description, metadata)
    VALUES (user_uuid, 'usage', -points_to_deduct, transaction_description, transaction_metadata);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has enough points
CREATE OR REPLACE FUNCTION public.check_points_balance(
    user_uuid UUID,
    points_needed INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT points_balance INTO current_balance FROM user_profiles WHERE id = user_uuid;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN current_balance >= points_needed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user points summary
CREATE OR REPLACE FUNCTION public.get_user_points_summary(user_uuid UUID)
RETURNS TABLE (
    balance INTEGER,
    total_purchased INTEGER,
    total_used INTEGER,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.points_balance,
        up.total_points_purchased,
        up.total_points_used,
        up.last_points_update
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user transaction history
CREATE OR REPLACE FUNCTION public.get_user_transactions(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    transaction_type TEXT,
    points_amount INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.transaction_type,
        pt.points_amount,
        pt.description,
        pt.created_at
    FROM points_transactions pt
    WHERE pt.user_id = user_uuid
    ORDER BY pt.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for points_transactions
CREATE POLICY "Users can view own transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for points_packages
CREATE POLICY "Anyone can view active packages" ON points_packages
    FOR SELECT USING (is_active = TRUE);

-- Update the handle_new_user function to initialize points
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, points_balance, total_points_purchased, total_points_used)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        0,
        0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create view for user points dashboard
CREATE OR REPLACE VIEW user_points_dashboard WITH (security_invoker = on) AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.points_balance,
    up.total_points_purchased,
    up.total_points_used,
    up.last_points_update,
    COUNT(pt.id) as total_transactions,
    MAX(pt.created_at) as last_transaction_date
FROM user_profiles up
LEFT JOIN points_transactions pt ON up.id = pt.user_id
GROUP BY up.id, up.email, up.full_name, up.points_balance, 
         up.total_points_purchased, up.total_points_used, up.last_points_update;

-- Grant access to the view
GRANT SELECT ON user_points_dashboard TO authenticated;

-- Recreate user_dashboard_data view with new schema
CREATE OR REPLACE VIEW user_dashboard_data WITH (security_invoker = on) AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.points_balance,
    up.total_points_purchased,
    up.total_points_used,
    up.created_at,
    COUNT(dp.id) as total_projects,
    COUNT(eh.id) as total_exports,
    MAX(eh.created_at) as last_export_date
FROM user_profiles up
LEFT JOIN design_projects dp ON up.id = dp.user_id
LEFT JOIN export_history eh ON up.id = eh.user_id
GROUP BY up.id, up.email, up.full_name, up.points_balance, 
         up.total_points_purchased, up.total_points_used, up.created_at;

-- Grant access to the view
GRANT SELECT ON user_dashboard_data TO authenticated;

