// Supabase Edge Function — delete-account
// Runtime: Deno. Borra permanentemente la cuenta del usuario que llama.
// Requerido por App Store (guideline 5.1.1(v)): borrar la cuenta desde la app.
// ON DELETE CASCADE elimina profiles, player_stats, game_history y ai_generation_log;
// los avatares del bucket `avatars/<uid>/` se borran aquí.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return json({ error: 'Unauthorized' }, 401)
  const userId = data.user.id

  // Avatars (best effort — the account is deleted even if storage cleanup fails)
  try {
    const { data: files } = await admin.storage.from('avatars').list(userId)
    if (files?.length) {
      await admin.storage.from('avatars').remove(files.map((f) => `${userId}/${f.name}`))
    }
  } catch (e) {
    console.warn('avatar cleanup failed', e)
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error('deleteUser failed', deleteError.message)
    return json({ error: 'Could not delete account' }, 500)
  }
  return json({ deleted: true })
})
