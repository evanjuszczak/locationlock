import { supabase } from '../lib/supabase';

export interface Score {
  id?: string;
  user_id?: string;
  score: number;
  created_at?: string;
  username: string;
}

// Save a score to the database - only if it's higher than the user's previous best
export const saveScore = async (score: number, username: string, userId?: string) => {
  try {
    // Skip check for anonymous users (those without a userId)
    if (userId) {
      // Check if user already has a high score
      const { data: existingScore, error: fetchError } = await supabase
        .from('scores')
        .select('score')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (!fetchError && existingScore) {
        // If existing score is higher or equal, don't save
        if (existingScore.score >= score) {
          return { 
            success: false, 
            error: "Score not saved. Your previous best score is higher.", 
            data: null,
            previousBest: existingScore.score
          };
        }
        
        // If new score is higher, delete the old record
        await supabase
          .from('scores')
          .delete()
          .eq('user_id', userId);
      }
    }

    // Insert the new high score
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          score,
          username,
          user_id: userId
        },
      ])
      .select();

    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

// Get high scores for the leaderboard
export const getHighScores = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

// Get the best score for a specific user
export const getUserBestScore = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      return { success: false, error, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, error, data: null };
  }
}; 