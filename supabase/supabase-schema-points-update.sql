-- Add Free Trial Feature to Existing Schema
-- Run this AFTER running the main supabase-schema-points.sql

-- Create function to give free trial points to new users
CREATE OR REPLACE FUNCTION public.give_free_trial_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Give 5 free points to new users
    UPDATE user_profiles 
    SET 
        points_balance = 5,
        total_points_purchased = 5,
        last_points_update = NOW()
    WHERE id = NEW.id;
    
    -- Create transaction record for free trial
    INSERT INTO points_transactions (user_id, transaction_type, points_amount, description)
    VALUES (NEW.id, 'bonus', 5, 'Free trial - 5 free exports');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for free trial points
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.give_free_trial_points();

-- Update existing users to have 5 free points (if they have 0)
UPDATE user_profiles 
SET 
    points_balance = 5,
    total_points_purchased = 5,
    last_points_update = NOW()
WHERE points_balance = 0 AND total_points_purchased = 0;

-- Add free trial transaction for existing users
INSERT INTO points_transactions (user_id, transaction_type, points_amount, description)
SELECT 
    id,
    'bonus',
    5,
    'Free trial - 5 free exports'
FROM user_profiles
WHERE points_balance = 5 AND total_points_purchased = 5
ON CONFLICT DO NOTHING;

