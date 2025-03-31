import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl, ScaleControl } from 'react-leaflet';
import { Location } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const actualIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const guessIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ResultMapProps {
  actualLocation: Location;
  guessedLocation?: Location;
  distance?: number;
  score: number;
  onNextRound: () => void;
}

export const ResultMap: React.FC<ResultMapProps> = ({ 
  actualLocation, 
  guessedLocation, 
  distance, 
  score, 
  onNextRound 
}) => {
  // Determine if time ran out (no guess was made)
  const noGuessMade = !guessedLocation;

  // Calculate center and bounds for the map 
  const bounds = noGuessMade 
    ? [[actualLocation.lat, actualLocation.lng]] as L.LatLngBoundsExpression
    : [[actualLocation.lat, actualLocation.lng], 
       [guessedLocation!.lat, guessedLocation!.lng]] as L.LatLngBoundsExpression;

  // Format the distance
  const formatDistance = (meters?: number) => {
    if (!meters) return "N/A";
    if (meters < 1) {
      return `${Math.round(meters * 1000)} m`;
    }
    return `${meters} km`;
  };

  return (
    <div className="mb-16">
      <div className="bg-neo-card p-5 rounded-neo shadow-neo mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="text-neo-muted text-sm">Distance</div>
            <div className="text-2xl font-bold text-neo-text">{formatDistance(distance)}</div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-neo-muted text-sm">Round Score</div>
            <div className="text-3xl font-bold text-neo-accent">{score}</div>
          </div>
          
          <button
            onClick={onNextRound}
            className="bg-neo-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all font-medium"
          >
            Next Round
          </button>
        </div>
        
        {noGuessMade && (
          <div className="mt-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-center">
            Time ran out! No points awarded for this round.
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center flex-wrap gap-x-8 gap-y-2 text-sm px-2">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-neo-text">Actual Location</span>
        </div>
        {!noGuessMade && (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-neo-text">Your Guess</span>
          </div>
        )}
      </div>

      <div className="rounded-neo overflow-hidden shadow-neo">
        <MapContainer
          bounds={bounds}
          zoom={noGuessMade ? 6 : undefined}
          center={noGuessMade ? [actualLocation.lat, actualLocation.lng] : undefined}
          style={{ height: '500px', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          
          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Line between the two points - only if a guess was made */}
          {!noGuessMade && guessedLocation && (
            <Polyline 
              positions={[
                [actualLocation.lat, actualLocation.lng],
                [guessedLocation.lat, guessedLocation.lng]
              ]}
              color="blue"
              weight={3}
              opacity={0.7}
              dashArray="5, 10"
            />
          )}

          {/* Actual location marker */}
          <Marker 
            position={[actualLocation.lat, actualLocation.lng]} 
            icon={actualIcon}
          >
            <Popup>
              <strong>Actual Location</strong>
            </Popup>
          </Marker>

          {/* Guessed location marker - only if a guess was made */}
          {!noGuessMade && guessedLocation && (
            <Marker 
              position={[guessedLocation.lat, guessedLocation.lng]} 
              icon={guessIcon}
            >
              <Popup>
                <strong>Your Guess</strong>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}; 