# SoccerSub Database Setup

## Quick Setup Steps

### 1. Create Supabase Tables
Go to your Supabase project → SQL Editor and run this SQL:

```sql
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

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for players
CREATE POLICY "Users can manage own players" ON public.players
  USING (auth.uid() = user_id);

-- Create policies for matches  
CREATE POLICY "Users can manage own matches" ON public.matches
  USING (auth.uid() = user_id);
```

### 2. Update Supabase Settings
- Go to Authentication → URL Configuration
- Set Site URL: `https://soccersub.com`
- Add Redirect URLs:
  - `https://soccersub.com/**`
  - `https://www.soccersub.com/**`

### 3. Test
1. Sign up for an account
2. Try adding a player
3. Start a match
4. Check browser console for any errors

## Troubleshooting
- Check browser console (F12) for error messages
- Verify environment variables are set in Vercel
- Ensure database tables are created properly