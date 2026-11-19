-- ============================================================
-- Lexia — 003: seguridad, límites del Modo IA y avatares
-- ============================================================

-- 1. Las estadísticas solo las escribe el trigger (security definer).
--    Antes un usuario podía editarse a sí mismo games_won, rachas, etc.
drop policy if exists "Users can update own stats" on public.player_stats;

-- 2. profiles: el usuario solo puede cambiar username / avatar / idioma.
--    is_premium ya no es editable desde el cliente (lo gobierna RevenueCat).
revoke update on public.profiles from anon, authenticated;
grant update (username, avatar_url, language, updated_at) on public.profiles to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 3. game_history: valores coherentes
alter table public.game_history
  drop constraint if exists game_history_guesses_range,
  add constraint game_history_guesses_range
    check ((won and guesses between 1 and 6) or (not won and guesses is null));

-- 4. Las partidas del Modo IA quedan en el historial pero NO alteran
--    racha / distribución (son ilimitadas, la racha es del juego diario).
create or replace function public.update_stats_after_game()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_stats public.player_stats%rowtype;
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_new_streak integer;
  v_dist jsonb;
begin
  if new.is_ai_mode then
    return new;
  end if;

  select * into v_stats from public.player_stats where user_id = new.user_id for update;
  if not found then
    insert into public.player_stats (user_id) values (new.user_id)
    returning * into v_stats;
  end if;

  if v_stats.last_played_at = v_yesterday then
    v_new_streak := v_stats.current_streak + 1;
  elsif v_stats.last_played_at = v_today then
    v_new_streak := greatest(v_stats.current_streak, 1);
  else
    v_new_streak := 1;
  end if;

  v_dist := v_stats.guess_distribution;
  if new.won and new.guesses is not null then
    v_dist := jsonb_set(
      v_dist,
      array[new.guesses::text],
      to_jsonb(coalesce((v_dist->>new.guesses::text)::integer, 0) + 1)
    );
  end if;

  update public.player_stats
  set
    games_played       = v_stats.games_played + 1,
    games_won          = v_stats.games_won + case when new.won then 1 else 0 end,
    current_streak     = case when new.won then v_new_streak else 0 end,
    max_streak         = greatest(v_stats.max_streak, case when new.won then v_new_streak else 0 end),
    last_played_at     = v_today,
    guess_distribution = v_dist,
    updated_at         = now()
  where user_id = new.user_id;

  return new;
end;
$$;
revoke execute on function public.update_stats_after_game() from public, anon, authenticated;

-- 5. Registro de peticiones al Modo IA (límite diario por usuario en la
--    Edge Function generate-word). Solo la service role lo lee/escribe.
create table if not exists public.ai_generation_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null check (source in ('cache', 'muse', 'fallback')),
  language    text not null check (language in ('es', 'en')),
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_ai_generation_log_user_time
  on public.ai_generation_log (user_id, created_at desc);
alter table public.ai_generation_log enable row level security;
-- (sin políticas: anon/authenticated no tienen acceso)

-- 6. La caché de palabras IA no debe ser legible por clientes (revelaría
--    las respuestas). Solo la Edge Function (service role) la usa.
drop policy if exists "Anyone can read AI word cache" on public.ai_words_cache;
create index if not exists idx_ai_words_cache_pool
  on public.ai_words_cache (language, difficulty, theme);

-- 7. Índices de FK / consultas del historial
create index if not exists idx_game_history_user_played
  on public.game_history (user_id, played_at desc);

-- 8. Avatares: bucket público de lectura; cada usuario escribe solo en <uid>/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Avatar upload own folder" on storage.objects;
create policy "Avatar upload own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatar update own folder" on storage.objects;
create policy "Avatar update own folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatar delete own folder" on storage.objects;
create policy "Avatar delete own folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
