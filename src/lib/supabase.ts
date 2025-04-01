import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add some validation and logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key is missing. Check your environment variables.');
}

console.log('Initializing Supabase client with:', { 
  url: supabaseUrl?.substring(0, 20) + '...',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

let supabaseClient;

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Provide a fallback client that will log errors but not crash the app
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase initialization failed') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: async () => ({ error: new Error('Supabase initialization failed'), data: null }),
      signInWithPassword: async () => ({ error: new Error('Supabase initialization failed'), data: null }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              single: async () => ({ data: null, error: new Error('Supabase initialization failed') })
            })
          })
        }),
        limit: () => ({
          single: async () => ({ data: null, error: new Error('Supabase initialization failed') })
        }),
        order: () => ({
          limit: async () => ({ data: null, error: new Error('Supabase initialization failed') })
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Supabase initialization failed') })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: new Error('Supabase initialization failed') })
          })
        })
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: new Error('Supabase initialization failed') })
      })
    }),
    rpc: () => ({ data: null, error: new Error('Supabase initialization failed') })
  };
}

export const supabase = supabaseClient; 