import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in a development environment
const isDevelopment = !import.meta.env.PROD || window.location.hostname === 'localhost';

// Create custom fetch function to handle SSL certificate issues
const customFetch = (...args: Parameters<typeof fetch>) => {
  console.log('Supabase request to:', args[0]);
  
  // Add this line to troubleshoot the exact URL being requested
  console.log('Using Supabase URL:', supabaseUrl);
  
  return fetch(...args).catch(err => {
    if (err.message && (
      err.message.includes('certificate') || 
      err.message.includes('SSL') || 
      err.message.includes('self signed'))
    ) {
      console.warn('SSL Certificate error when connecting to Supabase. This is likely due to browser security settings.');
      // Add a more user-friendly error that includes the actual error message
      throw new Error(`Supabase connection failed: ${err.message}. Try opening the app in Chrome or Firefox.`);
    }
    throw err;
  });
};

// Create Supabase client with enhanced SSL handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth',
  },
  global: {
    fetch: customFetch,
  },
}); 