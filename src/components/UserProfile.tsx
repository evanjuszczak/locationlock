import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserBestScore } from '../api/scores';
import { getUserStats } from '../api/userStats';
import { LogOut, Award, User, Gamepad2 } from 'lucide-react';

interface UserProfileProps {
  onLogin: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogin }) => {
  const { user, signOut } = useAuth();
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Reset state when user changes or logs out
  useEffect(() => {
    if (!user) {
      setBestScore(null);
      setGamesPlayed(0);
    }
  }, [user]);

  // Fetch user data when user is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      setBestScore(null);
      setGamesPlayed(0);
      
      try {
        // Fetch best score
        const { success: scoreSuccess, data: scoreData } = await getUserBestScore(user.id);
        if (scoreSuccess && scoreData) {
          setBestScore(scoreData.score);
        }
        
        // Fetch games played
        const { success: statsSuccess, data: statsData } = await getUserStats(user.id);
        if (statsSuccess && statsData) {
          setGamesPlayed(statsData.games_played);
        }
      } catch (error) {
        // Remove console.error statement
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user?.id]); // Only re-run when user ID changes

  if (!user) {
    return (
      <button
        onClick={onLogin}
        className="flex items-center gap-2 bg-neo-bg/50 hover:bg-neo-bg px-4 py-2 rounded-lg transition-colors"
      >
        <User size={18} className="text-neo-accent" />
        <span className="text-neo-text">Sign In</span>
      </button>
    );
  }

  const username = user.user_metadata?.username || 'Player';

  // Handle sign out with state reset
  const handleSignOut = async () => {
    // Reset state before signing out
    setBestScore(null);
    setGamesPlayed(0);
    await signOut();
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-neo-bg/50 hover:bg-neo-bg px-4 py-2 rounded-lg transition-colors">
        <div className="w-8 h-8 rounded-full bg-neo-accent/20 flex items-center justify-center text-neo-accent font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-neo-text">{username}</span>
      </button>
      
      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-64 bg-neo-card rounded-neo shadow-neo overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
        <div className="p-4 border-b border-neo-border">
          <div className="font-medium text-neo-text">{username}</div>
          <div className="text-sm text-neo-muted">{user.email}</div>
        </div>
        
        <div className="p-4 border-b border-neo-border grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-neo-text mb-1">
              <Award size={16} className="text-neo-accent" />
              <span className="font-medium">Best Score</span>
            </div>
            {loading ? (
              <div className="text-neo-muted text-sm">Loading...</div>
            ) : bestScore !== null ? (
              <div className="text-neo-accent font-bold text-xl">{bestScore}</div>
            ) : (
              <div className="text-neo-muted text-sm">No scores yet</div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-neo-text mb-1">
              <Gamepad2 size={16} className="text-neo-accent" />
              <span className="font-medium">Games Played</span>
            </div>
            {loading ? (
              <div className="text-neo-muted text-sm">Loading...</div>
            ) : (
              <div className="text-neo-accent font-bold text-xl">{gamesPlayed}</div>
            )}
          </div>
        </div>
        
        <div className="p-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-neo-bg/50 transition-colors text-neo-muted hover:text-neo-text"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 