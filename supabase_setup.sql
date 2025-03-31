-- Create the scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table to track user statistics
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comment on the user_stats table
COMMENT ON TABLE public.user_stats IS 'Table to store user statistics like games played';
COMMENT ON COLUMN public.user_stats.id IS 'Unique identifier for the stats entry';
COMMENT ON COLUMN public.user_stats.user_id IS 'Reference to the user';
COMMENT ON COLUMN public.user_stats.games_played IS 'Number of games the user has played';
COMMENT ON COLUMN public.user_stats.created_at IS 'When this stats entry was created';
COMMENT ON COLUMN public.user_stats.updated_at IS 'When this stats entry was last updated';

-- Create an index on user_id for faster lookups in user_stats
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON public.user_stats(user_id);

-- Enable Row Level Security (RLS) for user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats" 
ON public.user_stats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
ON public.user_stats FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
ON public.user_stats FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Comment on the table and columns for better documentation
COMMENT ON TABLE public.scores IS 'Table to store user game scores';
COMMENT ON COLUMN public.scores.id IS 'Unique identifier for each score entry';
COMMENT ON COLUMN public.scores.user_id IS 'Reference to the user who achieved this score';
COMMENT ON COLUMN public.scores.username IS 'Display name of the user';
COMMENT ON COLUMN public.scores.score IS 'The score value achieved in the game';
COMMENT ON COLUMN public.scores.created_at IS 'When this score was recorded';

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS scores_user_id_idx ON public.scores(user_id);

-- Create an index on score for faster leaderboard sorting
CREATE INDEX IF NOT EXISTS scores_score_idx ON public.scores(score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- 1. Anyone can read all scores (for leaderboard)
CREATE POLICY "Anyone can read scores" 
ON public.scores FOR SELECT 
USING (true);

-- 2. Authenticated users can insert their own scores
CREATE POLICY "Authenticated users can insert their own scores" 
ON public.scores FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can only update their own scores
CREATE POLICY "Users can update their own scores" 
ON public.scores FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- 4. Users can only delete their own scores
CREATE POLICY "Users can delete their own scores" 
ON public.scores FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 5. Anonymous users can insert scores without a user_id
CREATE POLICY "Anonymous users can insert scores without user_id" 
ON public.scores FOR INSERT TO anon 
WITH CHECK (user_id IS NULL);

-- Make sure uuid-ossp extension is enabled for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 