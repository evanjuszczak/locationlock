import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

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
      if (
        err.message.includes('SSL') || 
        err.message.includes('certificate') || 
        err.message.includes('ERR_SSL_PROTOCOL_ERROR') ||
        err.message.includes('ERR_CERT_AUTHORITY_INVALID')
      ) {
        console.warn('SSL Connection Error:', err.message, 'URL:', args[0]);
        console.info('This could be due to:');
        console.info('1. Browser security settings');
        console.info('2. Network/VPN/proxy interference');
        console.info('3. Outdated browser or OS certificates');
        console.info('4. Incorrect system date/time');
        
        // Attempt to be more informative about the specific URL
        if (typeof args[0] === 'string') {
          const url = args[0];
          if (url.includes('supabase')) {
            console.info('Connection to Supabase service failed - this is likely a temporary issue or a browser security setting');
          }
        }
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
      event.reason.message.includes('security') ||
      event.reason.message.includes('ERR_CERT_AUTHORITY_INVALID')
    ) {
      console.warn('Unhandled SSL Error:', event.reason);
      // Add more detailed diagnostics
      console.info('Browser:', navigator.userAgent);
      console.info('Protocol:', window.location.protocol);
      console.info('Hostname:', window.location.hostname);
      
      // Attempt to add user guidance
      console.info('User tips: Try using a different browser, clearing cookies, or check your network settings.');
      
      event.preventDefault();
    }
  }
});

// Add offline/online detection for better error handling
window.addEventListener('online', () => {
  console.log('Connection restored. App should function normally now.');
});

window.addEventListener('offline', () => {
  console.warn('Internet connection lost. Some features may not work correctly.');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
