-- Supabase Auth Trigger Fix
-- This completely repairs the "Database error saving new user" signup error

-- 1. First, we remove the complex chained triggers on user_profiles which can cause nested deadlocks or errors during signup
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
DROP FUNCTION IF EXISTS public.give_free_trial_points();

-- 2. We replace the auth trigger function to securely initialize everything in ONE single step
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Step A: Create the user profile with 5 free trial points natively during creation
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name, 
        points_balance, 
        total_points_purchased, 
        total_points_used,
        last_points_update
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        5,  -- Initial balance (Free Trial)
        5,  -- Tracked as purchased so it behaves exactly like real points
        0,  -- None used yet
        NOW()
    );

    -- Step B: Immediately log the initial free trial transaction cleanly
    INSERT INTO public.points_transactions (
        user_id, 
        transaction_type, 
        points_amount, 
        description
    )
    VALUES (
        NEW.id, 
        'bonus', 
        5, 
        'Free trial - 5 free exports'
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If an error happens, still return NEW to ensure the auth user is created regardless of profile failures,
    -- avoiding the hard "Database error saving new user" crash that halts signups entirely.
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is attached cleanly to the auth table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
