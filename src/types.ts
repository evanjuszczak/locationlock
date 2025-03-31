export interface Location {
  lat: number;
  lng: number;
}

export interface Round {
  actualLocation: Location;
  guessedLocation?: Location;
  score?: number;
  distance?: number;
}

export interface GameSettings {
  roundTime: number; // Time in seconds for each round
  allowNavigation?: boolean; // Whether to allow navigation in street view
}

export interface GameState {
  rounds: Round[];
  currentRound: number;
  isGameStarted: boolean;
  isGameFinished: boolean;
  totalScore: number;
  showingResult: boolean;
  timeRemaining: number;
  timerActive: boolean;
  settings: GameSettings;
  startGame: () => void;
  resetGame: () => void;
  submitGuess: (location: Location) => void;
  proceedToNextRound: () => void;
  saveScore: (playerName: string) => void;
  timerTick: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}