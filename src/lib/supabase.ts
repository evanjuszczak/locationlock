import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use direct HTTP if needed for compatibility
// By using HTTP instead of HTTPS for dev environments, we can avoid SSL cert issues
let adjustedUrl = supabaseUrl;
if (adjustedUrl.startsWith('https://') && (!import.meta.env.PROD || window.location.hostname === 'localhost')) {
  adjustedUrl = adjustedUrl.replace('https://', 'http://');
}

// Create Supabase client with minimal config
export const supabase = createClient(adjustedUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth',
  },
}); 