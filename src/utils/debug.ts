// Environment variable validation utility (silent for security)
export const checkEnvironment = () => {
  const isUrlSet = !!import.meta.env.VITE_SUPABASE_URL;
  const isKeySet = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!isUrlSet || !isKeySet) {
    if (import.meta.env.DEV) {
      console.error('Environment check: Required variables missing.');
    }
    return false;
  }
  
  return true;
};

// Run on import quietly in dev mode
if (import.meta.env.DEV) {
  checkEnvironment();
}


