import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Trophy } from 'lucide-react';
import { useGameStore } from './store';
import { LocationView } from './components/LocationView';
import { GuessMap } from './components/GuessMap';
import { ScoreBoard } from './components/ScoreBoard';
import { ResultMap } from './components/ResultMap';
import { Timer } from './components/Timer';
import { GameSettings } from './components/GameSettings';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { Leaderboard } from './components/Leaderboard';
import { useAuth } from './contexts/AuthContext';
import { saveScore } from './api/scores';
import { incrementGamesPlayed } from './api/userStats';

function App() {
  const gameState = useGameStore();
  const { user, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [gameTracked, setGameTracked] = useState(false);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [startingGame, setStartingGame] = useState(false);
  const isInitialMount = useRef(true);
  
  // Store a snapshot of game state to restore after login if needed
  const [savedGameState, setSavedGameState] = useState<{
    isGameFinished: boolean;
    totalScore: number;
    preserveState: boolean;
  } | null>(null);

  // Only reset when there's a real user change after the initial mount,
  // not on the initial null -> null transition for anonymous users
  useEffect(() => {
    // Skip the effect on initial mount
    if (isInitialMount.current) {
      console.log("Initial auth mount, setting previousUserId:", user?.id || null);
      setPreviousUserId(user?.id || null);
      isInitialMount.current = false;
      return;
    }
    
    // Only proceed if auth loading is complete
    if (authLoading) return;
    
    console.log("Auth changed:", { 
      current: user?.id || 'anonymous', 
      previous: previousUserId || 'anonymous',
      shouldReset: Boolean(user?.id !== previousUserId && (user?.id || previousUserId)),
      savedGameState
    });
    
    // If we go from user A to user B or from user A to anonymous,
    // we should reset, but not when going from anonymous to anonymous
    const isRealUserChange = user?.id !== previousUserId && (user?.id || previousUserId);
    
    if (isRealUserChange) {
      // Update previous user ID
      setPreviousUserId(user?.id || null);
      
      // Reset score-related states since they're user-specific
      setScoreSaved(false);
      setScoreError(null);
      setPreviousBest(null);
      setGameTracked(false);
      
      // Check if we need to preserve game state (login from game completion screen)
      if (savedGameState && savedGameState.preserveState) {
        console.log("Restoring saved game state after login:", savedGameState);
        
        // Only restore if the game is not already in a finished state
        // We don't have a direct way to restore the game with a specific score,
        // so we'll just make sure we don't reset the current finished game
        if (!gameState.isGameFinished && savedGameState.isGameFinished) {
          console.log("Game state was reset during login, but we want to preserve it");
          // We can't directly restore the game state, but we can leave a message
          // to inform the user they need to save their score now
          alert("You're now logged in! Please start a new game.");
        }
        
        // Clear saved state after restoring
        setSavedGameState(null);
      } 
      // Otherwise, reset the game if it was in progress (normal user change scenario)
      else if (gameState.isGameStarted || gameState.isGameFinished) {
        console.log("User changed during game, resetting game");
        gameState.resetGame();
      }
    } else {
      // Just update previousUserId without resetting game
      setPreviousUserId(user?.id || null);
    }
  }, [user, gameState, authLoading, savedGameState]);

  // Track when a game is finished and increment games played (only for logged in users)
  useEffect(() => {
    const trackGamePlayed = async () => {
      // Only track if game just finished, user is logged in, and we haven't tracked this game yet
      if (gameState.isGameFinished && user && !gameTracked) {
        try {
          await incrementGamesPlayed(user.id);
        } catch (error) {
          console.warn("Failed to increment games played:", error);
        }
        setGameTracked(true);
      }
    };

    // Only run if auth loading is complete
    if (!authLoading) {
      trackGamePlayed();
    }
  }, [gameState.isGameFinished, user, gameTracked, authLoading]);

  // Handle successful login - used when logging in from game completion screen
  const handleLoginSuccess = useCallback(async () => {
    if (gameState.isGameFinished) {
      console.log("Login successful, saving game state before auth changes");
      
      // Save current game state so we can restore it after login
      setSavedGameState({
        isGameFinished: true,
        totalScore: gameState.totalScore,
        preserveState: true
      });
      
      // Return a promise to ensure we wait for state to be updated
      return new Promise<void>(resolve => {
        // Use a short timeout to ensure the state is updated before auth effect runs
        setTimeout(() => {
          console.log("Game state saved successfully");
          resolve();
        }, 100);
      });
    }
  }, [gameState.isGameFinished, gameState.totalScore]);

  // Open auth modal with proper mode and context
  const openAuthModal = (mode: 'login' | 'signup' = 'login', preserveGame: boolean = false) => {
    // Save game state if opening from game completion screen
    if (preserveGame || gameState.isGameFinished) {
      console.log("Opening auth modal from game completion screen");
      setSavedGameState({
        isGameFinished: true, 
        totalScore: gameState.totalScore,
        preserveState: true
      });
    }
    
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Handle starting a game - can be done whether user is logged in or not
  const handleStartGame = () => {
    // Set starting state to prevent multiple clicks
    setStartingGame(true);
    
    // Force start the game regardless of auth state
    console.log("Starting game, auth state:", authLoading ? "loading" : "ready");
    
    try {
      // Start the game regardless of auth state
      gameState.startGame();
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      // Clear starting state
      setStartingGame(false);
    }
  };

  // Reset game tracked state when starting a new game
  useEffect(() => {
    if (!gameState.isGameFinished) {
      setGameTracked(false);
    }
  }, [gameState.isGameFinished]);

  const handleSaveScore = async (username: string) => {
    if (scoreSaved) return;
    
    const userId = user?.id;
    const score = gameState.totalScore;
    
    // Reset previous states
    setScoreError(null);
    setPreviousBest(null);
    
    const { success, error, previousBest } = await saveScore(score, username, userId);
    
    if (success) {
      setScoreSaved(true);
    } else if (previousBest) {
      // This is the case where the score wasn't saved because it was lower than the previous best
      setScoreError(`Score not saved. Your previous best score of ${previousBest} is higher.`);
      setPreviousBest(previousBest);
    } else if (error) {
      setScoreError(typeof error === 'string' ? error : 'Failed to save score');
    }
  };

  // Open leaderboard with refreshed data
  const openLeaderboard = useCallback(() => {
    setLeaderboardKey(prev => prev + 1);
    setIsLeaderboardOpen(true);
  }, []);

  // Handle playing again to reset state
  const handlePlayAgain = () => {
    // Reset all game-related states
    setScoreSaved(false);
    setScoreError(null);
    setPreviousBest(null);
    setGameTracked(false);
    
    // Start a new game
    handleStartGame();
  };

  // Main UI content based on game state
  let content;
  
  if (!gameState.isGameStarted) {
    content = (
      <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
        <div className="bg-neo-card p-8 rounded-neo shadow-neo text-center max-w-md w-full">
          <div className="bg-neo-accent/10 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-12 h-12 text-neo-accent" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-neo-text">LocationLock</h1>
          <br></br>
          <h6 className="text-neo-muted mb-8">Created by Evan Juszczak</h6>
          <p className="text-neo-muted mb-8">Test your map knowledge, ad free.</p>
          
          <button
            onClick={handleStartGame}
            disabled={startingGame}
            className="bg-neo-accent text-white w-full px-6 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all mb-6 shadow-lg disabled:opacity-70"
          >
            {startingGame ? 'Starting...' : 'Start Game'}
          </button>
          
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={openLeaderboard}
              className="flex items-center gap-2 text-neo-muted hover:text-neo-text transition-colors"
            >
              <Trophy size={18} className="text-neo-accent" />
              <span>Leaderboard</span>
            </button>
            
            <UserProfile onLogin={() => openAuthModal('login')} />
          </div>
          
          <div className="text-xs text-neo-muted mb-6">
            <p>Note: Signing in is completely optional - you can play without an account.</p>
            <p>Creating an account allows you to save your scores to the leaderboard.</p>
            {!user && (
              <p className="mt-1">Having trouble signing in? You can still play normally.</p>
            )}
          </div>
          
          <GameSettings />
        </div>
      </div>
    );
  } else {
    const currentRound = gameState.rounds[gameState.currentRound];
    // Ensure current round number doesn't exceed total rounds
    const displayRound = Math.min(gameState.currentRound + 1, gameState.rounds.length);

    content = (
      <div className="min-h-screen bg-neo-bg p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 items-center bg-neo-card p-4 rounded-neo shadow-neo">
            {/* Left: Title */}
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neo-text flex items-center justify-center sm:justify-start">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-neo-accent" /> LocationLock
              </h1>
            </div>
            
            {/* Center: Timer */}
            <div className="flex justify-center">
              {!gameState.isGameFinished && !gameState.showingResult && (
                <Timer />
              )}
            </div>
            
            {/* Right: Round counter and score */}
            <div className="flex justify-center sm:justify-end items-center gap-2 sm:gap-4">
              {!gameState.isGameFinished && (
                <div className="bg-neo-bg px-3 sm:px-4 py-1 sm:py-2 rounded-lg">
                  <div className="text-base sm:text-lg font-semibold text-neo-text">
                    Round {displayRound}/{gameState.rounds.length}
                  </div>
                </div>
              )}
              <ScoreBoard gameState={gameState} />
            </div>
          </div>

          {!gameState.isGameFinished && (
            <>
              {currentRound && (
                <>
                  <div className="rounded-neo overflow-hidden shadow-neo">
                    <LocationView location={currentRound.actualLocation} />
                  </div>
                  
                  {gameState.showingResult ? (
                    <ResultMap 
                      actualLocation={currentRound.actualLocation}
                      guessedLocation={currentRound.guessedLocation}
                      distance={currentRound.distance}
                      score={currentRound.score || 0}
                      onNextRound={gameState.proceedToNextRound}
                    />
                  ) : (
                    <GuessMap onGuess={gameState.submitGuess} />
                  )}
                </>
              )}
            </>
          )}

          {gameState.isGameFinished && (
            <div className="bg-neo-card p-4 sm:p-8 rounded-neo shadow-neo text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-neo-accent/10 flex items-center justify-center rounded-full mb-4 sm:mb-6">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-neo-accent" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Game Complete!</h2>
              <p className="text-neo-muted mb-4">Great job exploring the world</p>
              <p className="text-xl sm:text-2xl mb-6 sm:mb-8 font-bold">
                <span className="text-neo-muted">Final Score: </span>
                <span className="text-neo-accent">{gameState.totalScore}</span>
              </p>
              
              {user ? (
                <div className="mb-6 sm:mb-8">
                  {scoreSaved ? (
                    <div className="p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg mb-4">
                      Your score has been saved to the leaderboard!
                    </div>
                  ) : scoreError ? (
                    <div className="p-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg mb-4">
                      {scoreError}
                      {previousBest && (
                        <div className="mt-2 text-sm">
                          Keep practicing to beat your high score!
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSaveScore(user.user_metadata?.username || 'Player')}
                      className="bg-neo-accent text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-opacity-90 transition-all mb-4"
                    >
                      Save Score to Leaderboard
                    </button>
                  )}
                  <button 
                    onClick={openLeaderboard}
                    className="flex items-center gap-2 mx-auto text-neo-muted hover:text-neo-text transition-colors"
                  >
                    <Trophy size={18} className="text-neo-accent" />
                    <span>View Leaderboard</span>
                  </button>
                </div>
              ) : (
                <div className="mb-6 sm:mb-8">
                  <p className="text-neo-muted mb-4">
                    Sign in to save your score to the leaderboard 
                    <span className="block text-sm mt-1">(Optional - you can still play without signing in)</span>
                  </p>
                  <button 
                    onClick={() => openAuthModal('login', true)}
                    className="bg-neo-accent text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-opacity-90 transition-all mb-4"
                  >
                    Sign In
                  </button>
                  <div className="text-xs text-neo-muted mt-2">
                    <p>Having trouble signing in? You can still play without an account.</p>
                    <p>Try using a different browser or device if you want to save scores.</p>
                  </div>
                  <button 
                    onClick={openLeaderboard}
                    className="flex items-center gap-2 mx-auto text-neo-muted hover:text-neo-text transition-colors mt-4"
                  >
                    <Trophy size={18} className="text-neo-accent" />
                    <span>View Leaderboard</span>
                  </button>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={gameState.resetGame}
                  className="bg-neo-bg text-neo-text px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-neo-bg/70 transition-all shadow-neo mb-3 sm:mb-0"
                >
                  Back to Home
                </button>
                <button
                  onClick={handlePlayAgain}
                  className="bg-neo-accent text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-opacity-90 transition-all shadow-neo"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <Leaderboard
        key={leaderboardKey}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </>
  );
}

export default App;