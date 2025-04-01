import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, username: string) => Promise<{
    error: any;
    success: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: any;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Helper to handle auth errors and provide meaningful messages
const handleAuthError = (error: any) => {
  // Log the original error
  console.error('Auth error:', error);
  
  // Check if this is a certificate or network error
  if (
    error.message?.includes('SSL') ||
    error.message?.includes('certificate') ||
    error.message?.includes('ERR_CERT_AUTHORITY_INVALID') ||
    error.message?.includes('Failed to fetch')
  ) {
    return {
      message: 'Unable to connect securely to the authentication service. This may be caused by network issues or browser settings.',
      original: error
    };
  }
  
  // Return original error if not a certificate issue
  return error;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create a timeout to ensure we don't block indefinitely if Supabase auth is broken
    const authTimeout = setTimeout(() => {
      console.warn('Auth initialization timed out - treating as not authenticated');
      setLoading(false);
    }, 5000); // 5 seconds timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Auth session initialized', { hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(error => {
        console.error('Error getting auth session:', error);
      })
      .finally(() => {
        setLoading(false);
        clearTimeout(authTimeout);
      });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed', { event: _event, hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      const processedError = handleAuthError(error);
      return { error: processedError, success: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // First, attempt to clear any existing sessions
      // This can help in cases where a previous session has certificate issues
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('Error during pre-login sign out:', signOutError);
        // Continue with sign in attempt even if sign out fails
      }

      // Now attempt sign in
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Sign in error (caught):', error);
      
      // Specialized error handling
      const processedError = handleAuthError(error);
      return { error: processedError, success: false };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Still clear local session state even if API call fails
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 