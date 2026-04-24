// Debug utility to check environment variables
export const checkEnvironment = () => {
  console.log('🔍 Environment Check:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('Mode:', import.meta.env.MODE);
  console.log('Base URL:', import.meta.env.BASE_URL);
  
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ CRITICAL: Environment variables are missing!');
    console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel environment variables.');
    return false;
  }
  
  console.log('✅ All environment variables are set correctly!');
  return true;
};

// Run on import but only log in development
if (import.meta.env.MODE === 'development') {
  checkEnvironment();
}

