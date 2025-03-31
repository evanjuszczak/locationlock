import { supabase } from '../lib/supabase';

export interface UserStats {
  id?: string;
  user_id: string;
  games_played: number;
  created_at?: string;
  updated_at?: string;
  username?: string; // Added for leaderboard display
}

// Get user stats
export const getUserStats = async (userId: string) => {
  try {
    // Try to get the user's stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no stats exist yet, create a new record
    if (error && error.code === 'PGRST116') { // "No rows returned" error code
      // Create a new stats record for the user
      const { data: newData, error: insertError } = await supabase
        .from('user_stats')
        .insert([{ user_id: userId, games_played: 0 }])
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError, data: null };
      }

      return { success: true, data: newData, error: null };
    }

    if (error) {
      return { success: false, error, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, error, data: null };
  }
};

// Increment games played count
export const incrementGamesPlayed = async (userId: string) => {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided', data: null };
    }

    // First, ensure the user has a stats record
    const { data: existingData, success, error } = await getUserStats(userId);

    // If failed to get stats for any reason other than record not existing
    if (!success && error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code !== 'PGRST116') {
        return { success: false, error, data: null };
      }
    }

    // If we have existing data, update it
    if (success && existingData) {
      const { data, error: updateError } = await supabase
        .from('user_stats')
        .update({ games_played: existingData.games_played + 1 })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError, data: null };
      }

      return { success: true, data, error: null };
    } 
    // If no existing record, create one with games_played = 1
    else {
      const { data: newData, error: insertError } = await supabase
        .from('user_stats')
        .insert([{ user_id: userId, games_played: 1 }])
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError, data: null };
      }

      return { success: true, data: newData, error: null };
    }
  } catch (error) {
    return { success: false, error, data: null };
  }
};

// Get most active players (users with most games played)
export const getMostActivePlayers = async (limit = 10) => {
  try {
    // Use a special leaderboard function or view that's accessible to everyone
    // Try to use a direct query to the public.most_active_users_leaderboard view
    const { data, error } = await supabase
      .from('most_active_users_leaderboard')
      .select('*')
      .limit(limit);

    // If the view doesn't exist or there's another error, try the function approach
    if (error) {
      // Try to use the stored procedure / function instead
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_most_active_players', { row_limit: limit });

      if (rpcError) {
        return { 
          success: false, 
          error: 'Could not access player activity data. Please check with the administrator.',
          data: null 
        };
      }

      return { success: true, data: rpcData || [], error: null };
    }

    return { success: true, data: data || [], error: null };
  } catch (error) {
    return { 
      success: false, 
      error: 'An unexpected error occurred when fetching player activity',
      data: null 
    };
  }
}; 