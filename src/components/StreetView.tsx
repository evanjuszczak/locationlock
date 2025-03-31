import React, { useEffect, useRef } from 'react';
import { Location } from '../types';

interface StreetViewProps {
  location: Location;
}

export const StreetView: React.FC<StreetViewProps> = ({ location }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const panorama = new google.maps.StreetViewPanorama(ref.current, {
      position: location,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: false,
      showRoadLabels: false,
      motionTracking: false,
      fullscreenControl: false,
    });
  }, [location]);

  return <div ref={ref} className="w-full h-[400px] rounded-lg" />;
};