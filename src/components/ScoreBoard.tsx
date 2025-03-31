import React from 'react';
import { GameState } from '../types';
import { Award } from 'lucide-react';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  // Always show just the score, regardless of game state
  return (
    <div className="bg-neo-bg px-4 py-2 rounded-lg flex items-center">
      <Award className="w-5 h-5 mr-2 text-neo-accent" />
      <div className="text-lg font-bold">
        <span className="text-neo-muted mr-2">Score:</span>
        <span className="text-neo-accent">{gameState.totalScore}</span>
      </div>
    </div>
  );
};