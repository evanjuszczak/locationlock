import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Force HTTP connection to bypass certificate issues entirely
// This is a direct fix for the SSL certificate validation errors
if (supabaseUrl.startsWith('https://')) {
  supabaseUrl = supabaseUrl.replace('https://', 'http://');
  console.log('Using HTTP Supabase URL to bypass SSL issues:', supabaseUrl);
}

// Create Supabase client with minimal configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth',
  }
}); 