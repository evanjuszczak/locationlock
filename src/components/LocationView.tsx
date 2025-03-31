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
  const { settings } = useGameStore();

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Create the viewer with a catch-all errorHandler option if supported
      const viewer = new Mapillary.Viewer({
        accessToken: 'MLY|28852782034366814|2eba972b12a558f2f34883ae3b7a86b8', 
        container: containerRef.current,
        component: { 
          cover: false,
          bearing: { visible: true },
          zoom: { visible: true },
        },
      });

      viewerRef.current = viewer;

      // Search for the nearest image using the Mapillary API
      const searchForImage = async () => {
        try {
          // First we need to use the Mapillary API to find the closest image
          const response = await fetch(
            `https://graph.mapillary.com/images?access_token=MLY|28852782034366814|2eba972b12a558f2f34883ae3b7a86b8&fields=id&bbox=${location.lng - 0.02},${location.lat - 0.02},${location.lng + 0.02},${location.lat + 0.02}&limit=1`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch image data from Mapillary API');
          }

          const data = await response.json();
          
          if (data.data && data.data.length > 0) {
            const imageId = data.data[0].id;
            // Now use the viewer's moveTo method to navigate to this image
            await viewer.moveTo(imageId);

            // After loading the image, apply navigation controls if needed
            if (!settings.allowNavigation) {
              // Disable navigation controls in a way that doesn't affect image quality
              viewer.getComponent('direction').configure({ visible: false });
              viewer.getComponent('sequence').configure({ visible: false });
              
              // Add an overlay to indicate navigation is disabled
              const indicator = document.createElement('div');
              indicator.className = 'absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-10';
              indicator.textContent = 'Navigation disabled';
              containerRef.current?.appendChild(indicator);
            }
          } else {
            setError('No street view images found near this location');
          }
        } catch (err) {
          // Silently handle error without logging to console
          setError('Error loading street view');
        }
      };

      searchForImage();

      return () => {
        if (viewerRef.current) {
          viewerRef.current.remove();
        }
      };
    } catch (err) {
      // Silently handle error without logging to console
      setError('Error initializing street view');
    }
  }, [location, settings]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <p>{error}</p>
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