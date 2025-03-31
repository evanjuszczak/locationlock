import React, { useEffect, useState } from 'react';
import { getHighScores } from '../api/scores';
import { getMostActivePlayers } from '../api/userStats';
import { Trophy, Medal, TrendingUp, Award, Users, RefreshCw } from 'lucide-react';
import type { Score } from '../api/scores';
import type { UserStats } from '../api/userStats';

interface LeaderboardProps {
  onClose: () => void;
  isOpen: boolean;
}

type LeaderboardTab = 'scores' | 'activity';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, isOpen }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('scores');
  const [scores, setScores] = useState<Score[]>([]);
  const [activePlayers, setActivePlayers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force data refresh

  // Function to refresh the data
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'scores') {
          const { success, data, error } = await getHighScores(10);
          if (success && data) {
            setScores(data);
          } else {
            setError('Failed to load leaderboard scores');
          }
        } else {
          const { success, data, error } = await getMostActivePlayers(10);
          if (success && data) {
            setActivePlayers(data);
          } else {
            setError('Failed to load most active players');
          }
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, refreshKey, isOpen]); // Also refetch when refreshKey or isOpen changes

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="text-yellow-400 w-5 h-5" />;
      case 1:
        return <Medal className="text-gray-400 w-5 h-5" />;
      case 2:
        return <Medal className="text-amber-700 w-5 h-5" />;
      default:
        return <TrendingUp className="text-neo-muted w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-overlay">
      <div className="bg-neo-card rounded-neo shadow-neo w-full max-w-lg">
        <div className="p-6 border-b border-neo-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-neo-text flex items-center gap-2">
              <Trophy className="text-neo-accent" />
              Leaderboard
            </h2>
            <p className="text-neo-muted">See how you rank against other players</p>
          </div>
          <button 
            onClick={refreshData}
            className="p-2 rounded-full hover:bg-neo-bg/50 text-neo-muted hover:text-neo-text transition-colors"
            aria-label="Refresh leaderboard"
            title="Refresh leaderboard"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neo-border">
          <button
            onClick={() => {
              setActiveTab('scores');
              refreshData(); // Refresh data when switching tabs
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeTab === 'scores' 
                ? 'border-b-2 border-neo-accent text-neo-accent' 
                : 'text-neo-muted hover:text-neo-text'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Top Scores</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('activity');
              refreshData(); // Refresh data when switching tabs
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeTab === 'activity' 
                ? 'border-b-2 border-neo-accent text-neo-accent' 
                : 'text-neo-muted hover:text-neo-text'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Most Active</span>
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 border-4 border-neo-accent/30 border-t-neo-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neo-muted">
              {activeTab === 'scores' ? 'Loading top scores...' : 'Loading most active players...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-neo-bg rounded-lg text-neo-muted hover:text-neo-text transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="p-4">
              {activeTab === 'scores' ? (
                // Top Scores Tab Content
                scores.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neo-muted">No scores recorded yet.</p>
                    <p className="text-neo-muted text-sm mt-2">Be the first to get on the leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neo-border/50">
                    {scores.map((score, index) => (
                      <div key={score.id} className="flex items-center py-3 px-2">
                        <div className="w-8 flex-shrink-0 flex justify-center">
                          {getMedalIcon(index)}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-neo-text">{score.username}</div>
                          <div className="text-xs text-neo-muted">
                            {new Date(score.created_at!).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-neo-accent">{score.score}</div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Most Active Players Tab Content
                activePlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neo-muted">No player activity recorded yet.</p>
                    <p className="text-neo-muted text-sm mt-2">Be the first to get on this leaderboard!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neo-border/50">
                    {activePlayers.map((player, index) => (
                      <div key={player.id || index} className="flex items-center py-3 px-2">
                        <div className="w-8 flex-shrink-0 flex justify-center">
                          {getMedalIcon(index)}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-neo-text">
                            {player.username || 'Player'}
                            {player.username && player.username.startsWith('Player ') && (
                              <span className="text-xs text-neo-muted ml-1">(Anonymous)</span>
                            )}
                          </div>
                          <div className="text-xs text-neo-muted">
                            {player.updated_at ? `Last played: ${new Date(player.updated_at).toLocaleDateString()}` : 'Recently played'}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-neo-accent">
                          {player.games_played} 
                          <span className="text-xs text-neo-muted ml-1">{player.games_played === 1 ? 'game' : 'games'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className="p-4 border-t border-neo-border bg-neo-bg/50">
              <button 
                onClick={onClose}
                className="w-full py-2 text-center text-neo-muted hover:text-neo-text transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 