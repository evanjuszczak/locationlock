import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { Clock } from 'lucide-react';

export const Timer: React.FC = () => {
  const { timeRemaining, timerActive, timerTick } = useGameStore();
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        timerTick();
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerTick]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Determine color based on time remaining
  const getTimerColor = (): string => {
    if (timeRemaining < 10) return 'text-red-500'; // Red when < 10 seconds
    if (timeRemaining < 30) return 'text-yellow-500'; // Yellow when < 30 seconds
    return 'text-neo-text'; // Default color in our theme
  };
  
  const getProgressWidth = (): string => {
    const { settings } = useGameStore();
    const percent = (timeRemaining / settings.roundTime) * 100;
    return `${percent}%`;
  };
  
  return (
    <div className="bg-neo-bg rounded-lg shadow-neo p-3 w-48">
      <div className="flex items-center justify-center mb-1">
        <Clock className="w-4 h-4 text-neo-accent mr-2" />
        <div className="text-sm text-neo-muted">Time Remaining</div>
      </div>
      <div className={`text-2xl font-bold text-center ${getTimerColor()}`}>
        {formatTime(timeRemaining)}
      </div>
      {/* Progress bar for time */}
      <div className="mt-2 h-1 w-full bg-neo-border rounded-full overflow-hidden">
        <div 
          className="h-full bg-neo-accent transition-all duration-1000 ease-linear"
          style={{ width: getProgressWidth() }}
        />
      </div>
    </div>
  );
}; 