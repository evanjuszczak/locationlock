import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// Simplified fetch error handling
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    return await originalFetch(...args);
  } catch (err) {
    // Specific handling for SSL certificate errors
    if (err instanceof Error && 
        (err.message.includes('SSL') || 
         err.message.includes('certificate') || 
         err.message.includes('ERR_CERT_AUTHORITY_INVALID'))) {
      
      console.warn('SSL Certificate Error:', args[0], err.message);
      
      // Add custom property to Error object to identify SSL issues
      err.name = 'SSLCertificateError';
      
      // Create a custom event to notify the app of SSL issues
      const sslErrorEvent = new CustomEvent('app:sslerror', { 
        detail: { 
          url: args[0],
          message: err.message 
        } 
      });
      window.dispatchEvent(sslErrorEvent);
    }
    
    throw err;
  }
};

// Set up a global error handler for unhandled SSL certificate errors
window.addEventListener('unhandledrejection', event => {
  if (event.reason instanceof Error && 
      (event.reason.message.includes('SSL') || 
       event.reason.message.includes('certificate') ||
       event.reason.message.includes('ERR_CERT_AUTHORITY_INVALID'))) {
    
    console.warn('Unhandled SSL Error:', event.reason.message);
    
    // Add some suggestions for users
    console.info('Browser:', navigator.userAgent);
    console.info('Troubleshooting tips:');
    console.info('1. Try using Chrome, Firefox or Edge');
    console.info('2. Check your system date/time is correct');
    console.info('3. Try clearing browser cache and cookies');
    console.info('4. Disable browser extensions that might interfere');
    
    // Prevent the default handling (avoid unhandled promise rejection)
    event.preventDefault();
  }
});

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
