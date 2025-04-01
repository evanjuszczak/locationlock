import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect if we're using HTTPS but the Supabase endpoint is HTTP
const isSecureMismatch = 
  typeof window !== 'undefined' && 
  window.location.protocol === 'https:' && 
  supabaseUrl.startsWith('http:');

// Log warning if there's a security protocol mismatch
if (isSecureMismatch) {
  console.warn('Security warning: Your app is running on HTTPS but Supabase URL is using HTTP.');
}

// Create Supabase client with custom fetch implementation to handle SSL errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'locationlock-auth-storage',
    // Use more lenient flow type for problematic connections
    flowType: 'implicit',
  },
  global: {
    fetch: (...args) => {
      // Add a custom fetch function to handle SSL issues more gracefully
      const [url, options] = args;
      
      // If the URL contains '/auth/', add retry logic with exponential backoff
      const isAuthRequest = typeof url === 'string' && url.includes('/auth/');
      
      // Only apply special handling for auth requests
      if (isAuthRequest) {
        return new Promise((resolve, reject) => {
          // First attempt
          standardFetch();

          function standardFetch(attempt = 1, maxAttempts = 3) {
            console.log(`Attempting fetch to Supabase auth (attempt ${attempt}/${maxAttempts})...`);
            
            // Apply exponential backoff for retries
            const backoffTime = attempt > 1 ? Math.min(Math.pow(2, attempt - 1) * 500, 5000) : 0;
            
            setTimeout(() => {
              fetch(url, {
                ...options,
                // Force no-cache for auth requests to avoid cached SSL errors
                cache: 'no-cache',
                headers: {
                  ...options?.headers,
                  'Cache-Control': 'no-cache', 
                  'Pragma': 'no-cache'
                }
              })
              .then(resolve)
              .catch(err => {
                // Handle SSL certificate errors specifically
                if (
                  err.message?.includes('SSL') ||
                  err.message?.includes('certificate') ||
                  err.message?.includes('ERR_CERT_AUTHORITY_INVALID')
                ) {
                  console.error(`SSL Certificate Error (attempt ${attempt}/${maxAttempts}):`, err.message);
                  
                  if (attempt < maxAttempts) {
                    console.log(`Retrying in ${backoffTime}ms...`);
                    standardFetch(attempt + 1, maxAttempts);
                  } else {
                    console.error('All SSL retry attempts failed');
                    reject(new Error(
                      'Unable to connect securely to the authentication service after multiple attempts. ' +
                      'This may be caused by network issues or browser security settings.'
                    ));
                  }
                } else {
                  // For non-SSL errors, just reject normally
                  reject(err);
                }
              });
            }, backoffTime);
          }
        });
      }
      
      // For non-auth requests, use standard fetch with simple error handling
      return fetch(...args).catch(err => {
        // Log SSL certificate errors
        if (
          err.message?.includes('SSL') ||
          err.message?.includes('certificate') ||
          err.message?.includes('ERR_CERT_AUTHORITY_INVALID')
        ) {
          console.error('SSL Certificate Error when connecting to Supabase:', err.message);
          console.info('This might be caused by network issues or proxy interceptions');
          
          throw new Error(
            'Unable to connect securely to the service. This may be caused by network issues or browser settings.'
          );
        }
        throw err;
      });
    },
  },
}); 