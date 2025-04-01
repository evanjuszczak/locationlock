import React, { useState } from 'react';
import { X, User, Mail, Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onLoginSuccess?: () => void | Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'login',
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError(null);
    setIsNetworkError(false);
    setSuccessMessage(null);
  };

  const handleModeSwitch = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsNetworkError(false);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { success, error } = await signUp(email, password, username);
        if (success) {
          setSuccessMessage('Account created successfully! Please check your email for verification.');
        } else {
          // Check if this is a network/SSL error
          const isNetworkProblem = 
            error.message?.includes('network') || 
            error.message?.includes('connect') ||
            error.message?.includes('SSL') ||
            error.message?.includes('certificate');
          
          setIsNetworkError(isNetworkProblem);
          setError(error.message || 'An error occurred during sign up.');
        }
      } else {
        const { success, error } = await signIn(email, password);
        if (success) {
          if (onLoginSuccess) {
            console.log("Login successful, calling success callback before closing modal");
            try {
              await Promise.resolve(onLoginSuccess());
              console.log("Login success callback completed");
            } catch (callbackError) {
              console.error("Error in login success callback:", callbackError);
            }
          }
          
          onClose();
        } else {
          // Check if this is a network/SSL error
          const isNetworkProblem = 
            error.message?.includes('network') || 
            error.message?.includes('connect') ||
            error.message?.includes('SSL') ||
            error.message?.includes('certificate');
          
          setIsNetworkError(isNetworkProblem);
          setError(error.message || 'Invalid email or password.');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        // Detect network or SSL errors
        if (
          err.message.includes('network') ||
          err.message.includes('connect') ||
          err.message.includes('SSL') ||
          err.message.includes('certificate')
        ) {
          setIsNetworkError(true);
          setError('Connection issue: Unable to connect securely to the authentication service. This may be due to network settings or a browser security configuration.');
        } else {
          setError(err.message || 'An unexpected error occurred.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to retry login after clearing cached session
  const handleRetry = async () => {
    setError(null);
    setIsNetworkError(false);
    setLoading(true);
    
    try {
      // Force clear localStorage auth data which might be causing issues
      localStorage.removeItem('supabase.auth.token');
      
      // Additional attempt to clear potential bad session data
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        // Ignore errors from this attempt
        console.warn('Error during manual session clear, continuing with login attempt');
      }
      
      // Now try the login again with fresh session
      if (mode === 'login') {
        const { success, error } = await signIn(email, password);
        if (success) {
          if (onLoginSuccess) {
            await Promise.resolve(onLoginSuccess());
          }
          onClose();
        } else {
          setError(error.message || 'Login failed after retry. Please try again later.');
        }
      } else {
        const { success, error } = await signUp(email, password, username);
        if (success) {
          setSuccessMessage('Account created successfully! Please check your email for verification.');
        } else {
          setError(error.message || 'Registration failed after retry. Please try again later.');
        }
      }
    } catch (err) {
      setError('Failed to complete authentication. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-neo-card rounded-neo shadow-neo w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neo-muted hover:text-neo-text"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-neo-text mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-neo-muted mb-4">
            {mode === 'login' 
              ? 'Sign in to save your scores and see your stats' 
              : 'Join LocationLock to track your progress and compete on the leaderboard'}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-neo-text text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-neo-muted" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-2 bg-neo-bg border border-neo-border rounded text-neo-text focus:border-neo-accent"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          {/* Password Field */}
          <div className="mb-4">
            <label className="block text-neo-text text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-neo-muted" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-2 bg-neo-bg border border-neo-border rounded text-neo-text focus:border-neo-accent"
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                required
                minLength={6}
              />
            </div>
          </div>
          
          {/* Username Field (Sign Up Only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-neo-text text-sm font-medium mb-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-neo-muted" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 p-2 bg-neo-bg border border-neo-border rounded text-neo-text focus:border-neo-accent"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm">
              <p>{error}</p>
              
              {/* Show retry button for network errors */}
              {isNetworkError && (
                <div className="mt-2">
                  <p className="mb-2 text-xs">This might be caused by a SSL certificate issue or network problem.</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs mt-1"
                  >
                    <RefreshCw size={12} className="animate-spin" />
                    Retry with Clean Session
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm">
              {successMessage}
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-neo-accent text-white py-2 px-4 rounded-lg font-medium
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90'} transition-all`}
          >
            {loading 
              ? 'Processing...' 
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          
          {/* Mode Switch */}
          <div className="mt-4 text-center text-sm">
            <span className="text-neo-muted">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-neo-accent hover:underline focus:outline-none"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 