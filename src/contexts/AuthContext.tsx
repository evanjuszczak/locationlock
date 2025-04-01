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
      return { error, success: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      return { error, success: false };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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