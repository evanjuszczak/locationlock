import React from 'react';
import { GameState } from '../types';
import { Award } from 'lucide-react';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  // Always show just the score, regardless of game state
  return (
    <div className="bg-neo-bg px-3 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center">
      <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-neo-accent" />
      <div className="text-base sm:text-lg font-bold">
        <span className="text-neo-muted mr-1 sm:mr-2">Score:</span>
        <span className="text-neo-accent">{gameState.totalScore}</span>
      </div>
    </div>
  );
};