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

  useEffect(() => {
    if (!containerRef.current) return;
    
    let isMounted = true;
    let timeoutId: number | undefined;

    try {
      // Create the viewer with a catch-all errorHandler option if supported
      const viewer = new Mapillary.Viewer({
        accessToken: MAPILLARY_ACCESS_TOKEN, 
        container: containerRef.current,
        component: { 
          cover: false,
          bearing: { visible: true },
          zoom: { visible: true },
        },
      });

      viewerRef.current = viewer;

      // Error handling through a custom function instead of direct event listener
      const handleViewerErrors = () => {
        if (isMounted) {
          setError('Error loading street view');
        }
      };

      // Search for the nearest image using the Mapillary API
      const searchForImage = async () => {
        try {
          // Use HTTPS explicitly and add timeout to avoid hanging connections
          const controller = new AbortController();
          timeoutId = window.setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          // First we need to use the Mapillary API to find the closest image
          const response = await fetchWithRetry(
            `https://graph.mapillary.com/images?access_token=${MAPILLARY_ACCESS_TOKEN}&fields=id&bbox=${location.lng - 0.02},${location.lat - 0.02},${location.lng + 0.02},${location.lat + 0.02}&limit=1`,
            { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
                'Referer': window.location.origin
              }
            }
          );
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Mapillary API rate limit exceeded. Please try again later.');
            } else {
              throw new Error(`Failed to fetch image data: ${response.status} ${response.statusText}`);
            }
          }

          const data = await response.json();
          
          if (data.data && data.data.length > 0) {
            const imageId = data.data[0].id;
            // Now use the viewer's moveTo method to navigate to this image
            await viewer.moveTo(imageId);

            // After loading the image, apply navigation controls if needed
            if (!settings.allowNavigation && isMounted) {
              // Disable navigation controls in a way that doesn't affect image quality
              viewer.getComponent('direction').configure({ visible: false });
              viewer.getComponent('sequence').configure({ visible: false });
              
              // Add an overlay to indicate navigation is disabled
              if (containerRef.current) {
                const indicator = document.createElement('div');
                indicator.className = 'absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-10';
                indicator.textContent = 'Navigation disabled';
                containerRef.current.appendChild(indicator);
              }
            }
          } else if (isMounted) {
            setError('No street view images found near this location');
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            if (isMounted) setError('Connection timeout. Please try again.');
          } else if (err instanceof Error && err.message.includes('rate limit')) {
            if (isMounted) {
              setError('API rate limit reached. Try refreshing in a few moments.');
              setRetryCount(prev => prev + 1);
            }
          } else if (err instanceof Error && err.message.includes('SSL')) {
            if (isMounted) setError('Secure connection issue. Please try using the production URL.');
          } else {
            console.warn('Mapillary search error:', err instanceof Error ? err.message : String(err));
            if (isMounted) setError('Error loading street view');
          }
        }
      };

      searchForImage();

      return () => {
        isMounted = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (viewerRef.current) {
          viewerRef.current.remove();
        }
      };
    } catch (err) {
      console.warn('Mapillary initialization error:', err instanceof Error ? err.message : String(err));
      if (isMounted) {
        setError('Error initializing street view');
      }
    }
  }, [location, settings, MAPILLARY_ACCESS_TOKEN, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
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
                  onClick={() => window.open('https://locationlock-hq576bw9c-evans-projects-6bc84f56.vercel.app', '_blank')}
                  className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm mt-2"
                >
                  Open Deployed App
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {!settings.allowNavigation && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
          Navigation disabled
        </div>
      )}
    </div>
  );
};