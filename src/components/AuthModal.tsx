import React, { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleModeSwitch = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { success, error } = await signUp(email, password, username);
        if (success) {
          setSuccessMessage('Account created successfully! Please login with the credentials you used to continue.');
        } else {
          // Check if it's an SSL certificate error
          const errorMessage = error?.message || 'An error occurred during sign up.';
          if (
            errorMessage.includes('certificate') || 
            errorMessage.includes('SSL') || 
            errorMessage.includes('secure') ||
            error?.code === 'ERR_CERT_AUTHORITY_INVALID'
          ) {
            setError(
              'SSL Certificate Error: Your browser is not accepting our security certificate. ' +
              'Try using a different browser, device, or network. ' +
              'You can still play the game without logging in.'
            );
          } else {
            setError(errorMessage);
          }
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
          // Check if it's an SSL certificate error
          const errorMessage = error?.message || 'Invalid email or password.';
          if (
            errorMessage.includes('certificate') || 
            errorMessage.includes('SSL') || 
            errorMessage.includes('secure') ||
            error?.code === 'ERR_CERT_AUTHORITY_INVALID'
          ) {
            setError(
              'SSL Certificate Error: Your browser is not accepting our security certificate. ' +
              'Try using a different browser, device, or network. ' +
              'You can still play the game without logging in.'
            );
          } else {
            setError(errorMessage);
          }
        }
      }
    } catch (err) {
      // Check if the error is SSL related
      if (err instanceof Error) {
        const errorMsg = err.message;
        if (
          errorMsg.includes('certificate') || 
          errorMsg.includes('SSL') || 
          errorMsg.includes('secure')
        ) {
          setError(
            'SSL Certificate Error: Your browser is not accepting our security certificate. ' +
            'Try using a different browser, device, or network. ' +
            'You can still play the game without logging in.'
          );
        } else {
          setError('An unexpected error occurred. You can still play the game without logging in.');
        }
      } else {
        setError('An unexpected error occurred. You can still play the game without logging in.');
      }
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
              {error}
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