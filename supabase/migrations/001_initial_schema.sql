-- ============================================================
-- Lexia — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- profiles: one row per authenticated user
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  avatar_url    text,
  language      text not null default 'es' check (language in ('es', 'en')),
  is_premium    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- player_stats: cumulative game statistics per user
create table if not exists public.player_stats (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  games_played          integer not null default 0,
  games_won             integer not null default 0,
  current_streak        integer not null default 0,
  max_streak            integer not null default 0,
  last_played_at        date,
  guess_distribution    jsonb not null default '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
  updated_at            timestamptz not null default now()
);

-- game_history: individual game records
create table if not exists public.game_history (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  word          text not null,
  guesses       integer,           -- null if lost
  won           boolean not null,
  language      text not null check (language in ('es', 'en')),
  difficulty    text check (difficulty in ('easy', 'medium', 'hard')),
  is_ai_mode    boolean not null default false,
  played_at     timestamptz not null default now()
);

-- daily_words: pre-seeded or admin-set daily words
create table if not exists public.daily_words (
  id            uuid primary key default uuid_generate_v4(),
  word          text not null,
  language      text not null check (language in ('es', 'en')),
  date          date not null,
  unique (language, date)
);

-- ai_words_cache: cached AI-generated words to reduce API calls
create table if not exists public.ai_words_cache (
  id            uuid primary key default uuid_generate_v4(),
  word          text not null,
  definition    text not null,
  hint          text not null,
  language      text not null check (language in ('es', 'en')),
  difficulty    text not null check (difficulty in ('easy', 'medium', 'hard')),
  theme         text,
  used          boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (word, language)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_game_history_user_id on public.game_history(user_id);
create index if not exists idx_game_history_played_at on public.game_history(played_at desc);
create index if not exists idx_ai_words_cache_lookup on public.ai_words_cache(language, difficulty, used);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Auto-create profile + player_stats after user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'language', 'es')
  );

  insert into public.player_stats (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Update stats after each game is recorded
create or replace function public.update_stats_after_game()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_stats public.player_stats%rowtype;
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_new_streak integer;
  v_dist jsonb;
begin
  select * into v_stats from public.player_stats where user_id = new.user_id;

  -- Streak logic
  if v_stats.last_played_at = v_yesterday then
    v_new_streak := v_stats.current_streak + 1;
  elsif v_stats.last_played_at = v_today then
    v_new_streak := v_stats.current_streak; -- same day, no change
  else
    v_new_streak := 1; -- reset
  end if;

  -- Guess distribution (only update on wins)
  v_dist := v_stats.guess_distribution;
  if new.won and new.guesses is not null then
    v_dist := jsonb_set(
      v_dist,
      array[new.guesses::text],
      to_jsonb((coalesce((v_dist->>new.guesses::text)::integer, 0) + 1))
    );
  end if;

  update public.player_stats
  set
    games_played       = v_stats.games_played + 1,
    games_won          = v_stats.games_won + case when new.won then 1 else 0 end,
    current_streak     = case when new.won then v_new_streak else 0 end,
    max_streak         = greatest(v_stats.max_streak, case when new.won then v_new_streak else v_stats.max_streak end),
    last_played_at     = v_today,
    guess_distribution = v_dist,
    updated_at         = now()
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists on_game_history_insert on public.game_history;
create trigger on_game_history_insert
  after insert on public.game_history
  for each row execute procedure public.update_stats_after_game();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.player_stats  enable row level security;
alter table public.game_history  enable row level security;
alter table public.daily_words   enable row level security;
alter table public.ai_words_cache enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- player_stats
create policy "Users can view own stats"
  on public.player_stats for select
  using (auth.uid() = user_id);

create policy "Users can update own stats"
  on public.player_stats for update
  using (auth.uid() = user_id);

-- game_history
create policy "Users can view own game history"
  on public.game_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own game history"
  on public.game_history for insert
  with check (auth.uid() = user_id);

-- daily_words: public read
create policy "Anyone can read daily words"
  on public.daily_words for select
  using (true);

-- ai_words_cache: public read
create policy "Anyone can read AI word cache"
  on public.ai_words_cache for select
  using (true);
