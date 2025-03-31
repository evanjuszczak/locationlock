import React, { useState, useEffect, useCallback } from 'react';
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
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [gameTracked, setGameTracked] = useState(false);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  // Reset all game states when user changes (logout/login with different account)
  useEffect(() => {
    // Check if user has changed
    if (user?.id !== previousUserId) {
      // Update previous user ID
      setPreviousUserId(user?.id || null);
      
      // Reset game states for the new user
      setScoreSaved(false);
      setScoreError(null);
      setPreviousBest(null);
      setGameTracked(false);
      
      // If user changed during a game, reset it to avoid tracking issues
      if (gameState.isGameStarted || gameState.isGameFinished) {
        gameState.resetGame();
      }
    }
  }, [user, previousUserId, gameState]);

  // Track when a game is finished and increment games played
  useEffect(() => {
    const trackGamePlayed = async () => {
      // Only track if game just finished, user is logged in, and we haven't tracked this game yet
      if (gameState.isGameFinished && user && !gameTracked) {
        await incrementGamesPlayed(user.id);
        setGameTracked(true);
      }
    };

    trackGamePlayed();
  }, [gameState.isGameFinished, user, gameTracked]);

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

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Open leaderboard with refreshed data
  const openLeaderboard = useCallback(() => {
    setLeaderboardKey(prev => prev + 1);
    setIsLeaderboardOpen(true);
  }, []);

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
            onClick={gameState.startGame}
            className="bg-neo-accent text-white w-full px-6 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all mb-6 shadow-lg"
          >
            Start Game
          </button>
          
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={openLeaderboard}
              className="flex items-center gap-2 text-neo-muted hover:text-neo-text transition-colors"
            >
              <Trophy size={18} className="text-neo-accent" />
              <span>Leaderboard</span>
            </button>
            
            <UserProfile onLogin={() => openAuthModal('login')} />
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
          <div className="grid grid-cols-3 items-center bg-neo-card p-4 rounded-neo shadow-neo">
            {/* Left: Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neo-text flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-neo-accent" /> LocationLock
              </h1>
            </div>
            
            {/* Center: Timer */}
            <div className="flex justify-center">
              {!gameState.isGameFinished && !gameState.showingResult && (
                <Timer />
              )}
            </div>
            
            {/* Right: Round counter and score */}
            <div className="flex justify-end items-center gap-4">
              {!gameState.isGameFinished && (
                <div className="bg-neo-bg px-4 py-2 rounded-lg">
                  <div className="text-lg font-semibold text-neo-text">
                    Round {displayRound}/{gameState.rounds.length}
                  </div>
                </div>
              )}
              <ScoreBoard gameState={gameState} />
            </div>
          </div>

          {!gameState.isGameFinished && (
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

          {gameState.isGameFinished && (
            <div className="bg-neo-card p-8 rounded-neo shadow-neo text-center">
              <div className="mx-auto w-20 h-20 bg-neo-accent/10 flex items-center justify-center rounded-full mb-6">
                <MapPin className="w-10 h-10 text-neo-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Game Complete!</h2>
              <p className="text-neo-muted mb-4">Great job exploring the world</p>
              <p className="text-2xl mb-8 font-bold">
                <span className="text-neo-muted">Final Score: </span>
                <span className="text-neo-accent">{gameState.totalScore}</span>
              </p>
              
              {user ? (
                <div className="mb-8">
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
                      className="bg-neo-accent text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all mb-4"
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
                <div className="mb-8">
                  <p className="text-neo-muted mb-4">Sign in to save your score to the leaderboard</p>
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="bg-neo-accent text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              )}
              
              <button
                onClick={() => { 
                  gameState.resetGame();
                  setScoreSaved(false);
                  setGameTracked(false);
                  setScoreError(null);
                  setPreviousBest(null);
                }}
                className="bg-neo-bg text-neo-text px-8 py-3 rounded-lg text-lg font-medium hover:bg-neo-hover transition-all"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Return main content with modals
  return (
    <>
      {content}
      
      {/* Modals - positioned outside the main content for better rendering */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode}
        />
      )}
      
      {isLeaderboardOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-overlay">
          <Leaderboard key={leaderboardKey} onClose={() => setIsLeaderboardOpen(false)} />
        </div>
      )}
    </>
  );
}

export default App;