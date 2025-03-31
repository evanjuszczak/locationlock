import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../types';
import * as Mapillary from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { useGameStore } from '../store';

interface LocationViewProps {
  location: Location;
}

export const LocationView: React.FC<LocationViewProps> = ({ location }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Mapillary.Viewer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingState, setLoadingState] = useState<'loading' | 'error' | 'success'>('loading');
  const { settings } = useGameStore();
  
  // Define Mapillary token as a constant to ensure consistency
  const MAPILLARY_ACCESS_TOKEN = 'MLY|28852782034366814|2eba972b12a558f2f34883ae3b7a86b8';

  // Fetch with retry logic for rate limits
  const fetchWithRetry = async (url: string, options: RequestInit = {}, maxRetries = 3) => {
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          // Rate limited - exponential backoff
          currentRetry += 1;
          if (currentRetry <= maxRetries) {
            const delay = Math.min(Math.pow(2, currentRetry) * 1000, 10000);
            console.warn(`Rate limited by Mapillary API. Retrying in ${delay}ms (${currentRetry}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
        }
        
        return response;
      } catch (err) {
        if (currentRetry >= maxRetries) throw err;
        currentRetry += 1;
        const delay = Math.min(Math.pow(2, currentRetry) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Maximum retries reached');
  };

  // Function to use fallback locations if needed
  const findImagesForLocation = async (
    lat: number, 
    lng: number, 
    searchRadius = 0.02,
    maxAttempts = 3
  ): Promise<string | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Increase search radius on successive attempts
        const radius = searchRadius * (attempt + 1);
        
        // Create the API URL
        const apiUrl = `https://graph.mapillary.com/images?access_token=${MAPILLARY_ACCESS_TOKEN}&fields=id&bbox=${lng - radius},${lat - radius},${lng + radius},${lat + radius}&limit=1`;
        
        // Make the request with our retry mechanism
        const response = await fetchWithRetry(
          apiUrl,
          { 
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Referer': window.location.origin
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const imageId = data.data[0].id;
          return imageId;
        }
        
        // If no images found, continue to next attempt with larger radius
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed:`, err);
        // If it's the last attempt, re-throw the error
        if (attempt === maxAttempts - 1) throw err;
      }
    }
    
    return null; // No images found after all attempts
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true;
    let timeoutId: number | undefined;
    
    setLoadingState('loading');
    setError(null);

    // Try with production settings first
    const tryLoadMapillaryViewer = async () => {
      try {
        // 1. Configure the viewer with more resilient settings
        const viewer = new Mapillary.Viewer({
          accessToken: MAPILLARY_ACCESS_TOKEN, 
          container: containerRef.current!,
          component: { 
            cover: false,
            bearing: { visible: true },
            zoom: { visible: true },
          },
          // Set transition mode for smoother loading
          transitionMode: Mapillary.TransitionMode.Default,
        });

        viewerRef.current = viewer;

        // Instead of using events, we'll manually set loading state after successful image loading
        const imageLoadSuccessTimeout = setTimeout(() => {
          if (isMounted) {
            setLoadingState('success');
          }
        }, 5000); // Allow up to 5 seconds for loading
        
        // 3. Find the closest image with our enhanced search method
        const controller = new AbortController();
        timeoutId = window.setTimeout(() => controller.abort(), 20000); // 20-second timeout
        
        try {
          // Use our improved image search function
          const imageId = await findImagesForLocation(location.lat, location.lng);
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
          
          if (!imageId) {
            clearTimeout(imageLoadSuccessTimeout);
            throw new Error('No street view images found near this location');
          }
          
          // Navigate to the found image
          await viewer.moveTo(imageId).then(() => {
            // If image loads successfully, set state to success
            if (isMounted) {
              setLoadingState('success');
              clearTimeout(imageLoadSuccessTimeout);
            }
          }).catch(err => {
            clearTimeout(imageLoadSuccessTimeout);
            console.warn('Error moving to image:', err);
            throw new Error('Failed to load street view for this location');
          });
          
          // After successfully loading, configure navigation controls if needed
          if (!settings.allowNavigation && isMounted && containerRef.current) {
            // Disable navigation controls
            viewer.getComponent('direction').configure({ visible: false });
            viewer.getComponent('sequence').configure({ visible: false });
            
            // Add overlay indicator
            const indicator = document.createElement('div');
            indicator.className = 'absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-10';
            indicator.textContent = 'Navigation disabled';
            containerRef.current.appendChild(indicator);
          }
        } catch (err) {
          clearTimeout(imageLoadSuccessTimeout);
          if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error('Connection timeout. Please try again.');
          } else if (err instanceof Error && err.message.includes('rate limit')) {
            throw new Error('API rate limit reached. Try refreshing in a few moments.');
          } else if (err instanceof Error && err.message.includes('No street view images')) {
            throw new Error('No street view images found near this location.');
          } else {
            console.warn('Mapillary search error:', err instanceof Error ? err.message : String(err));
            throw new Error('Error loading street view');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Viewer error:', err);
          setError(err instanceof Error ? err.message : 'Error loading street view');
          setLoadingState('error');
        }
      }
    };

    // Start the loading process
    tryLoadMapillaryViewer();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
  }, [location, settings, MAPILLARY_ACCESS_TOKEN, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  const openProduction = () => {
    window.open('https://locationlock-4jhgjv3ye-evans-projects-6bc84f56.vercel.app', '_blank');
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {/* Loading indicator */}
      {loadingState === 'loading' && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-white">Loading street view...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <div className="bg-black bg-opacity-70 p-4 rounded-lg max-w-xs text-center">
            <p className="mb-2">{error}</p>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={handleRetry}
                className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm mt-2"
              >
                Retry
              </button>
              {!window.location.href.includes('vercel.app') && (
                <button 
                  onClick={openProduction}
                  className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm mt-2"
                >
                  Open Deployed App
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!settings.allowNavigation && loadingState === 'success' && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
          Navigation disabled
        </div>
      )}
    </div>
  );
};