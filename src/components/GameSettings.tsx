import React, { useState } from 'react';
import { useGameStore } from '../store';
import { Settings, Clock, Navigation } from 'lucide-react';

export const GameSettings: React.FC = () => {
  const { settings, updateSettings } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  
  // Time options in seconds
  const timeOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' },
  ];
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ roundTime: parseInt(e.target.value, 10) });
  };
  
  return (
    <div className="mt-6 text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-neo-muted hover:text-neo-accent mb-2 mx-auto transition-colors"
      >
        <Settings size={18} />
        <span>{expanded ? 'Hide Settings' : 'Game Settings'}</span>
      </button>
      
      {expanded && (
        <div className="bg-neo-bg p-5 rounded-lg animate-fadeIn border border-neo-border">
          <h3 className="text-lg font-semibold mb-5 text-neo-text">Game Settings</h3>
          
          <div className="mb-5">
            <label className="flex items-center gap-2 text-neo-text mb-2">
              <Clock size={16} className="text-neo-accent" />
              <span>Round Timer:</span>
            </label>
            <select
              value={settings.roundTime}
              onChange={handleTimeChange}
              className="w-full p-2 border border-neo-border rounded bg-neo-card text-neo-text"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-neo-muted mt-1">
              Choose how much time you want for each round
            </p>
          </div>
          
          <div className="mb-5">
            <label className="flex items-center text-neo-text mb-2">
              <input
                type="checkbox"
                checked={settings.allowNavigation}
                onChange={(e) => updateSettings({ allowNavigation: e.target.checked })}
                className="mr-2 h-4 w-4 accent-neo-accent bg-neo-bg border-neo-border"
              />
              <Navigation size={16} className="text-neo-accent mr-2" />
              <span>Allow Street View Navigation</span>
            </label>
            <p className="text-sm text-neo-muted mt-1 ml-6">
              When enabled, you can move around in street view. 
              Disable for a harder challenge.
            </p>
          </div>
          
          <div className="text-sm text-neo-muted mt-6 border-t border-neo-border pt-4">
            <h4 className="font-medium mb-3 text-neo-text">Game Rules:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Each game consists of 5 random locations</li>
              <li>You'll see a street view image for each location</li>
              <li>Place your guess on the world map</li>
              <li>The closer your guess, the more points you earn</li>
              <li>If time runs out, you receive 0 points for that round</li>
              <li>Toggle navigation on/off for different challenge levels</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 