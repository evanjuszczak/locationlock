-- Option 1: Create a view that exposes user stats with usernames
CREATE OR REPLACE VIEW public.most_active_users_leaderboard AS
SELECT 
    us.id,
    us.user_id,
    us.games_played,
    us.created_at,
    us.updated_at,
    COALESCE(
        (SELECT s.username FROM public.scores s 
         WHERE s.user_id = us.user_id 
         ORDER BY s.created_at DESC LIMIT 1),
        'Player ' || SUBSTRING(us.user_id::text, 1, 4)
    ) as username
FROM 
    public.user_stats us
WHERE 
    us.games_played > 0
ORDER BY 
    us.games_played DESC;

-- Grant access to everyone
GRANT SELECT ON public.most_active_users_leaderboard TO anon, authenticated;

-- Option 2: Create a function that can be called by any user
CREATE OR REPLACE FUNCTION public.get_most_active_players(row_limit integer DEFAULT 10)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    games_played integer,
    created_at timestamptz,
    updated_at timestamptz,
    username text
) 
SECURITY DEFINER -- This makes the function run with the privileges of the creator
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        us.id,
        us.user_id,
        us.games_played,
        us.created_at,
        us.updated_at,
        COALESCE(
            (SELECT s.username FROM public.scores s 
             WHERE s.user_id = us.user_id 
             ORDER BY s.created_at DESC LIMIT 1),
            'Player ' || SUBSTRING(us.user_id::text, 1, 4)
        ) as username
    FROM 
        public.user_stats us
    WHERE 
        us.games_played > 0
    ORDER BY 
        us.games_played DESC
    LIMIT row_limit;
END;
$$;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION public.get_most_active_players(integer) TO anon, authenticated; 