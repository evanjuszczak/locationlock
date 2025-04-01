import { create } from 'zustand';
import { GameState, GameSettings, Location } from './types';
import { getRandomLocation } from './utils';

const ROUNDS_PER_GAME = 5;
const MAX_SCORE = 5000;
const DEFAULT_ROUND_TIME = 120; // 2 minutes in seconds

const calculateDistance = (actual: Location, guessed: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (guessed.lat - actual.lat) * Math.PI / 180;
  const dLon = (guessed.lng - actual.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(actual.lat * Math.PI / 180) * Math.cos(guessed.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance);
};

const calculateScore = (distance: number, timeBonus: number = 0): number => {
  // Score decreases exponentially with distance
  const distanceScore = Math.round(MAX_SCORE * Math.exp(-distance/2000));
  
  // Add a small time bonus (up to 10% of maximum score)
  const totalScore = distanceScore + timeBonus;
  
  return Math.max(0, totalScore);
};

export const useGameStore = create<GameState>((set, get) => ({
  rounds: [],
  currentRound: 0,
  isGameStarted: false,
  isGameFinished: false,
  totalScore: 0,
  showingResult: false,
  timeRemaining: DEFAULT_ROUND_TIME,
  timerActive: false,
  settings: {
    roundTime: DEFAULT_ROUND_TIME,
    allowNavigation: true,
  },

  updateSettings: (newSettings: Partial<GameSettings>) => {
    const currentSettings = get().settings;
    set({
      settings: { ...currentSettings, ...newSettings },
      // Update timeRemaining if roundTime was changed
      ...(newSettings.roundTime ? { timeRemaining: newSettings.roundTime } : {})
    });
  },

  startGame: () => {
    console.log("🎮 startGame called - generating rounds");
    
    // Generate random locations for the game
    const rounds = Array(ROUNDS_PER_GAME).fill(null).map(() => ({
      actualLocation: getRandomLocation()
    }));
    
    const { settings } = get();
    
    console.log(`🎮 Setting up game with ${ROUNDS_PER_GAME} rounds`);
    
    // Update the game state
    set({
      rounds,
      currentRound: 0,
      isGameStarted: true,
      isGameFinished: false,
      totalScore: 0,
      showingResult: false,
      timeRemaining: settings.roundTime,
      timerActive: true
    });
    
    console.log("🎮 Game started successfully", { 
      isStarted: get().isGameStarted,
      roundCount: get().rounds.length
    });
  },
  
  resetGame: () => {
    console.log("🎮 resetGame called");
    
    set({
      rounds: [],
      currentRound: 0,
      isGameStarted: false,
      isGameFinished: false,
      totalScore: 0,
      showingResult: false,
      timeRemaining: get().settings.roundTime,
      timerActive: false
    });
    
    console.log("🎮 Game reset successfully");
  },

  submitGuess: (guessedLocation: Location) => {
    const state = get();
    const currentRound = state.rounds[state.currentRound];
    const distance = calculateDistance(currentRound.actualLocation, guessedLocation);
    
    // Calculate a time bonus based on remaining time (max 10% of MAX_SCORE)
    const timeBonus = Math.floor((state.timeRemaining / state.settings.roundTime) * (MAX_SCORE * 0.1));
    const score = calculateScore(distance, timeBonus);

    const updatedRounds = [...state.rounds];
    updatedRounds[state.currentRound] = {
      ...currentRound,
      guessedLocation,
      distance,
      score
    };

    const totalScore = updatedRounds.reduce((sum, round) => sum + (round.score || 0), 0);

    set({
      rounds: updatedRounds,
      totalScore,
      showingResult: true,
      timerActive: false
    });
  },

  proceedToNextRound: () => {
    const state = get();
    const newCurrentRound = state.currentRound + 1;
    const isGameFinished = newCurrentRound >= ROUNDS_PER_GAME;

    set({
      currentRound: newCurrentRound,
      isGameFinished,
      showingResult: false,
      timeRemaining: state.settings.roundTime,
      timerActive: !isGameFinished
    });
  },

  timerTick: () => {
    const { timeRemaining, timerActive } = get();
    
    if (!timerActive || timeRemaining <= 0) return;
    
    if (timeRemaining === 1) {
      // Time's up! Issue 0 points for the round
      const state = get();
      const currentRound = state.rounds[state.currentRound];
      
      const updatedRounds = [...state.rounds];
      updatedRounds[state.currentRound] = {
        ...currentRound,
        // No guessedLocation means no guess was made
        score: 0
      };

      const totalScore = updatedRounds.reduce((sum, round) => sum + (round.score || 0), 0);

      set({
        rounds: updatedRounds,
        totalScore,
        showingResult: true,
        timerActive: false
      });
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  pauseTimer: () => {
    set({ timerActive: false });
  },

  resumeTimer: () => {
    set({ timerActive: true });
  },

  saveScore: (playerName: string) => {
    const { totalScore } = get();
    // In a real app, this would save to a database
  }
}));