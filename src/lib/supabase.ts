import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with custom fetch implementation to handle SSL errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
  global: {
    fetch: (...args) => {
      // Add a custom fetch function to handle SSL issues more gracefully
      return fetch(...args).catch(err => {
        // Log SSL certificate errors
        if (
          err.message?.includes('SSL') ||
          err.message?.includes('certificate') ||
          err.message?.includes('ERR_CERT_AUTHORITY_INVALID')
        ) {
          console.error('SSL Certificate Error when connecting to Supabase:', err.message);
          console.info('This might be caused by network issues or proxy interceptions');
          
          // You may consider setting a custom error that can be handled better by the UI
          throw new Error(
            'Unable to connect securely to the authentication service. This may be caused by network issues or browser settings.'
          );
        }
        throw err;
      });
    },
  },
}); 