import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl, ScaleControl } from 'react-leaflet';
import { Location } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon with better visibility
const guessIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GuessMapProps {
  onGuess: (location: Location) => void;
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (location: Location) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export const GuessMap: React.FC<GuessMapProps> = ({ onGuess }) => {
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleSubmitGuess = () => {
    if (selectedLocation) {
      onGuess(selectedLocation);
      // Reset the selected location after submitting
      setSelectedLocation(null);
    }
  };

  return (
    <div className="mb-16">
      <div className="rounded-neo overflow-hidden shadow-neo">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '400px', width: '100%' }}
          minZoom={2}
          maxBounds={[[-90, -180], [90, 180]]}
          zoomControl={false} // We'll add a custom position for the zoom control
          scrollWheelZoom={true}
        >
          {/* Using CartoDB Positron - a light, clean map with English labels */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Add zoom control in a better position */}
          <ZoomControl position="bottomright" />
          
          {/* Add scale for distance reference */}
          <ScaleControl position="bottomleft" imperial={false} />
          
          <MapEvents onLocationSelect={handleLocationSelect} />
          
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]} 
              icon={guessIcon}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Submit button container positioned below the map */}
      <div className="flex justify-center mt-6">
        {selectedLocation ? (
          <button
            onClick={handleSubmitGuess}
            className="bg-neo-accent text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all font-medium text-lg shadow-neo"
          >
            Submit Guess
          </button>
        ) : (
          <div className="text-neo-muted py-3 px-6 bg-neo-card rounded-lg shadow-neo">
            Click anywhere on the map to place your guess
          </div>
        )}
      </div>
    </div>
  );
};