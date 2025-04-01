import { supabase } from './supabase';

// Simple function to check Supabase connection
export const testSupabaseConnection = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'Not configured';
  const keyLength = import.meta.env.VITE_SUPABASE_ANON_KEY ? 
    import.meta.env.VITE_SUPABASE_ANON_KEY.length : 
    'Not configured';
  
  console.log('===== SUPABASE CONFIG =====');
  console.log('URL:', url);
  console.log('Key length:', keyLength);
  
  // Check for SSL/TLS in the URL
  if (url && url.startsWith('http:')) {
    console.error('ERROR: Supabase URL uses HTTP protocol instead of HTTPS');
  }
  
  // This is just informational - checks will be done through API
  console.log('Supabase client initialized');
  console.log('You should check browser console for network errors');
  console.log('==== END SUPABASE CONFIG ====');
}; 