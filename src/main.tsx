import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { testSupabaseConnection } from './lib/debug';

// Run the Supabase connection test
testSupabaseConnection();

// Global error handling for fetch operations and SSL issues
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    return response;
  } catch (err) {
    // Log network errors but don't crash the app
    if (err instanceof Error) {
      // Handle SSL errors specifically
      if (err.message.includes('SSL') || err.message.includes('certificate') || err.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
        console.warn('SSL Connection Error:', err.message, 'URL:', args[0]);
      } else {
        console.warn('Network Error:', err.message, 'URL:', args[0]);
      }
    }
    throw err; // Still throw so components can handle it
  }
};

// Filter out noisy Mapillary console errors in development environment
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is a Mapillary-related error message
    const errorMsg = args[0]?.toString() || '';
    if (
      errorMsg.includes('Mapillary') || 
      errorMsg.includes('THREE.WebGLRenderer') ||
      errorMsg.includes('mesh URL')
    ) {
      // Suppress these specific errors
      return;
    }
    // Pass through all other errors
    originalConsoleError.apply(console, args);
  };
}

// Add unhandled rejection handler to prevent app crashes
window.addEventListener('unhandledrejection', event => {
  if (event.reason instanceof Error) {
    // Prevent SSL errors from crashing the app
    if (
      event.reason.message.includes('SSL') || 
      event.reason.message.includes('certificate') || 
      event.reason.message.includes('security')
    ) {
      console.warn('Unhandled SSL Error:', event.reason);
      event.preventDefault();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
