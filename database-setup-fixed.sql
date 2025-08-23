-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  number integer,
  is_on_field boolean DEFAULT false,
  position text,
  field_time_start bigint,
  total_field_time integer DEFAULT 0,
  position_time_start bigint,
  total_position_time integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create matches table  
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date text NOT NULL,
  opponent text,
  score text,
  start_time bigint,
  end_time bigint,
  half_time_start bigint,
  half_time_end bigint,
  duration integer DEFAULT 90,
  is_active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create time_logs table
CREATE TABLE IF NOT EXISTS public.time_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  start_time bigint NOT NULL,
  end_time bigint,
  position text,
  type text CHECK (type IN ('field', 'position')) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for players
DROP POLICY IF EXISTS "Users can manage own players" ON public.players;
CREATE POLICY "Users can manage own players" ON public.players
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for matches  
DROP POLICY IF EXISTS "Users can manage own matches" ON public.matches;
CREATE POLICY "Users can manage own matches" ON public.matches
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for time_logs
DROP POLICY IF EXISTS "Users can manage own time logs" ON public.time_logs;
CREATE POLICY "Users can manage own time logs" ON public.time_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.players p 
      WHERE p.id = time_logs.player_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS players_user_id_idx ON public.players(user_id);
CREATE INDEX IF NOT EXISTS matches_user_id_idx ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS time_logs_player_id_idx ON public.time_logs(player_id);
CREATE INDEX IF NOT EXISTS time_logs_match_id_idx ON public.time_logs(match_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS on_players_updated ON public.players;
CREATE TRIGGER on_players_updated
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_matches_updated ON public.matches;
CREATE TRIGGER on_matches_updated
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();