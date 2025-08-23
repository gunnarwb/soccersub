-- Enable RLS
alter table if exists public.players enable row level security;
alter table if exists public.matches enable row level security;
alter table if exists public.time_logs enable row level security;

-- Create players table
create table if not exists public.players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  number integer,
  is_on_field boolean default false,
  position text,
  field_time_start bigint,
  total_field_time integer default 0,
  position_time_start bigint,
  total_position_time integer default 0,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create matches table
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  opponent text,
  score text,
  start_time bigint,
  end_time bigint,
  half_time_start bigint,
  half_time_end bigint,
  duration integer default 90,
  is_active boolean default true,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create time_logs table
create table if not exists public.time_logs (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.players(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  start_time bigint not null,
  end_time bigint,
  position text,
  type text check (type in ('field', 'position')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies for players
create policy "Users can view own players" on public.players
  for select using (auth.uid() = user_id);

create policy "Users can insert own players" on public.players
  for insert with check (auth.uid() = user_id);

create policy "Users can update own players" on public.players
  for update using (auth.uid() = user_id);

create policy "Users can delete own players" on public.players
  for delete using (auth.uid() = user_id);

-- Create RLS policies for matches
create policy "Users can view own matches" on public.matches
  for select using (auth.uid() = user_id);

create policy "Users can insert own matches" on public.matches
  for insert with check (auth.uid() = user_id);

create policy "Users can update own matches" on public.matches
  for update using (auth.uid() = user_id);

create policy "Users can delete own matches" on public.matches
  for delete using (auth.uid() = user_id);

-- Create RLS policies for time_logs
create policy "Users can view own time logs" on public.time_logs
  for select using (exists (
    select 1 from public.players p 
    where p.id = time_logs.player_id 
    and p.user_id = auth.uid()
  ));

create policy "Users can insert own time logs" on public.time_logs
  for insert with check (exists (
    select 1 from public.players p 
    where p.id = time_logs.player_id 
    and p.user_id = auth.uid()
  ));

create policy "Users can update own time logs" on public.time_logs
  for update using (exists (
    select 1 from public.players p 
    where p.id = time_logs.player_id 
    and p.user_id = auth.uid()
  ));

create policy "Users can delete own time logs" on public.time_logs
  for delete using (exists (
    select 1 from public.players p 
    where p.id = time_logs.player_id 
    and p.user_id = auth.uid()
  ));

-- Create indexes for performance
create index if not exists players_user_id_idx on public.players(user_id);
create index if not exists matches_user_id_idx on public.matches(user_id);
create index if not exists time_logs_player_id_idx on public.time_logs(player_id);
create index if not exists time_logs_match_id_idx on public.time_logs(match_id);

-- Create functions for updating timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
drop trigger if exists on_players_updated on public.players;
create trigger on_players_updated
  before update on public.players
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_matches_updated on public.matches;
create trigger on_matches_updated
  before update on public.matches
  for each row execute procedure public.handle_updated_at();