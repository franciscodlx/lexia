-- Trigger-only functions must not be callable through the PostgREST RPC API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_stats_after_game() from public, anon, authenticated;
