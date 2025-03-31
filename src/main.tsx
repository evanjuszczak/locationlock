import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
