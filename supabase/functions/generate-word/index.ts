// Supabase Edge Function — generate-word
// Runtime: Deno. Do NOT use require() or Node.js APIs.
//
// Genera una palabra de 5 letras para el Modo IA con Meta Muse Spark
// (POST https://api.meta.ai/v1/chat/completions, compatible con OpenAI).
// Cada llamada a Muse pide varias candidatas: una se devuelve y el resto llena
// ai_words_cache, así la mayoría de partidas se sirven desde caché sin coste.
//
// Secretos (supabase secrets set …):
//   MODEL_API_KEY        clave de la Meta Model API (LLM_…)            [obligatoria para IA]
//   MUSE_BASE_URL        por defecto https://api.meta.ai/v1
//   MUSE_MODEL           por defecto muse-spark-1.3 (muse-ember-1.0 ≈ 12× más barato)
//   MUSE_REASONING_EFFORT low | medium | high (por defecto low)
//   DAILY_AI_WORD_LIMIT  peticiones por usuario y día (por defecto 40)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Language = 'es' | 'en'
type Difficulty = 'easy' | 'medium' | 'hard'

interface RequestBody {
  language: Language
  difficulty: Difficulty
  theme?: string
  excludeWords?: string[]
}

interface WordResult {
  word: string
  definition: string
  hint: string
}

const MUSE_BASE_URL = Deno.env.get('MUSE_BASE_URL') ?? 'https://api.meta.ai/v1'
const MUSE_MODEL = Deno.env.get('MUSE_MODEL') ?? 'muse-spark-1.3'
const MUSE_REASONING_EFFORT = Deno.env.get('MUSE_REASONING_EFFORT') ?? 'low'
const DAILY_LIMIT = Number(Deno.env.get('DAILY_AI_WORD_LIMIT') ?? '40')
const CANDIDATES = 5
const CACHE_PROBABILITY = 0.6
const MIN_CACHE_POOL = 3

const THEMES: Record<string, { es: string; en: string }> = {
  animals: { es: 'animales', en: 'animals' },
  food: { es: 'comida', en: 'food' },
  nature: { es: 'naturaleza', en: 'nature' },
  sports: { es: 'deportes', en: 'sports' },
  tech: { es: 'tecnología', en: 'technology' },
  body: { es: 'el cuerpo humano', en: 'the human body' },
}

// Fallback words when Muse is unavailable or not configured
const FALLBACKS: Record<`${Language}_${Difficulty}`, WordResult[]> = {
  es_easy: [
    { word: 'GATOS', definition: 'Plural de gato, felino doméstico', hint: 'Son mascotas comunes' },
    { word: 'PLAYA', definition: 'Orilla de arena junto al mar', hint: 'Ideal en vacaciones' },
    { word: 'FRUTA', definition: 'Producto comestible de algunas plantas', hint: 'Dulce y saludable' },
  ],
  es_medium: [
    { word: 'NICHO', definition: 'Hueco en una pared para colocar objetos', hint: 'Está en las paredes' },
    { word: 'BRUMA', definition: 'Niebla ligera, sobre todo en el mar', hint: 'Reduce la visibilidad' },
    { word: 'TRIGO', definition: 'Cereal con el que se hace harina', hint: 'Base del pan' },
  ],
  es_hard: [
    { word: 'ZAFIO', definition: 'Tosco, sin educación ni delicadeza', hint: 'Sinónimo de grosero' },
    { word: 'OCASO', definition: 'Puesta del sol; decadencia', hint: 'Final del día' },
    { word: 'CENIT', definition: 'Punto más alto del cielo sobre el observador', hint: 'Opuesto al nadir' },
  ],
  en_easy: [
    { word: 'BRAVE', definition: 'Ready to face danger without fear', hint: 'A courageous act' },
    { word: 'APPLE', definition: 'A round fruit with red or green skin', hint: 'Keeps the doctor away' },
    { word: 'HOUSE', definition: 'A building where people live', hint: 'Home sweet...' },
  ],
  en_medium: [
    { word: 'QUIRK', definition: 'A peculiar behavioral habit', hint: 'Everyone has one' },
    { word: 'GLINT', definition: 'A small flash of light', hint: 'A quick sparkle' },
    { word: 'TROVE', definition: 'A store of valuable things', hint: 'Treasure ___' },
  ],
  en_hard: [
    { word: 'CYNIC', definition: 'A person who believes people are selfish', hint: 'Glass half empty' },
    { word: 'FJORD', definition: 'A narrow sea inlet between cliffs', hint: 'Common in Norway' },
    { word: 'EPOCH', definition: 'A notable period of time', hint: 'An era' },
  ],
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'definition', 'hint'],
        properties: {
          word: { type: 'string', description: 'Exactly 5 letters, uppercase, no accents' },
          definition: { type: 'string', description: 'Short definition, max 15 words' },
          hint: { type: 'string', description: 'Indirect hint that does not contain the word, max 8 words' },
        },
      },
    },
  },
} as const

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Uppercase, strip accents, keep Ñ (same rules as lib/utils.ts sanitizeWord). */
function sanitize(word: string): string {
  return word
    .toUpperCase()
    .trim()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ')
}

function isValidWord(word: string, language: Language): boolean {
  return language === 'es' ? /^[A-ZÑ]{5}$/.test(word) : /^[A-Z]{5}$/.test(word)
}

function pickFallback(language: Language, difficulty: Difficulty, exclude: Set<string>): WordResult {
  const list = FALLBACKS[`${language}_${difficulty}`] ?? FALLBACKS.en_easy
  const fresh = list.filter((w) => !exclude.has(w.word))
  const pool = fresh.length > 0 ? fresh : list
  return pool[Math.floor(Math.random() * pool.length)]
}

function buildMessages(body: RequestBody, exclude: string[]) {
  const { language, difficulty, theme } = body
  const themeName = theme && THEMES[theme] ? THEMES[theme][language] : null

  if (language === 'es') {
    const level = {
      easy: 'muy comunes, que cualquier hispanohablante conoce desde niño',
      medium: 'de uso moderado: no triviales pero reconocibles para un adulto',
      hard: 'poco frecuentes: vocabulario culto o técnico, pero que existan en el diccionario de la RAE',
    }[difficulty]
    return [
      {
        role: 'developer',
        content: `Eres el generador de palabras de Lexia, un juego tipo Wordle en español.
Propón ${CANDIDATES} palabras distintas del español, todas ${level}.
Reglas estrictas para cada palabra:
- EXACTAMENTE 5 letras, en MAYÚSCULAS, solo A-Z o Ñ, sin tildes ni diéresis (ÁRBOL → ARBOL).
- Sustantivos, adjetivos o verbos en infinitivo; nada de nombres propios, siglas, extranjerismos ni groserías.
- La definición, en español, máximo 15 palabras.
- La pista, en español, máximo 8 palabras, indirecta y SIN contener la palabra.`,
      },
      {
        role: 'user',
        content: [
          themeName ? `Tema: ${themeName}.` : 'Tema libre.',
          exclude.length ? `No uses ninguna de estas palabras: ${exclude.join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ]
  }

  const level = {
    easy: 'very common, known by any English speaker since childhood',
    medium: 'moderately common: not trivial but recognizable to an adult',
    hard: 'uncommon: advanced or technical vocabulary that is still in standard dictionaries',
  }[difficulty]
  return [
    {
      role: 'developer',
      content: `You generate words for Lexia, a Wordle-style game in English.
Propose ${CANDIDATES} different English words, all ${level}.
Strict rules for each word:
- EXACTLY 5 letters, UPPERCASE, A-Z only.
- Nouns, adjectives or base-form verbs; no proper nouns, acronyms, plurals ending in S, or profanity.
- Definition in English, max 15 words.
- Hint in English, max 8 words, indirect and NOT containing the word.`,
    },
    {
      role: 'user',
      content: [
        themeName ? `Theme: ${themeName}.` : 'Any theme.',
        exclude.length ? `Do not use any of these words: ${exclude.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ]
}

/** SHA-256 of the user id: Meta gets a stable identifier without the real UUID. */
async function pseudonymousId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Calls Muse once (with retry on 429/5xx) and returns the valid, non-excluded candidates. */
async function askMuse(apiKey: string, body: RequestBody, exclude: Set<string>, userId: string): Promise<WordResult[]> {
  const payload = {
    model: MUSE_MODEL,
    // Muse models always reason and those tokens count as output: leave headroom
    reasoning_effort: MUSE_REASONING_EFFORT,
    max_completion_tokens: 4000,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'lexia_words', strict: true, schema: RESPONSE_SCHEMA },
    },
    messages: buildMessages(body, [...exclude].slice(0, 30)),
    user: await pseudonymousId(userId),
  }

  let lastError = 'unknown'
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${MUSE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    })
    if (!res.ok) {
      lastError = `${res.status}: ${(await res.text()).slice(0, 300)}`
      const retryable = res.status === 429 || res.status >= 500
      if (!retryable) break
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt + Math.random() * 400))
      continue
    }

    const data = await res.json()
    const content: string | undefined = data?.choices?.[0]?.message?.content
    if (!content) {
      lastError = `empty response (finish_reason=${data?.choices?.[0]?.finish_reason})`
      continue
    }
    const parsed = JSON.parse(content) as { candidates?: WordResult[] }
    const seen = new Set<string>()
    const valid: WordResult[] = []
    for (const c of parsed.candidates ?? []) {
      const word = sanitize(String(c.word ?? ''))
      if (!isValidWord(word, body.language) || exclude.has(word) || seen.has(word)) continue
      const hint = String(c.hint ?? '').trim()
      seen.add(word)
      valid.push({
        word,
        definition: String(c.definition ?? '').trim().slice(0, 200),
        // Never let the hint give the answer away
        hint: sanitize(hint).includes(word) ? '' : hint.slice(0, 120),
      })
    }
    if (valid.length > 0) return valid
    lastError = 'no valid candidates'
  }
  throw new Error(`Muse failed: ${lastError}`)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // ── Auth: validate the user's JWT ────────────────────────────────────────
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)
  const userId = userData.user.id

  // ── Body ─────────────────────────────────────────────────────────────────
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { language, difficulty } = body
  if (!['es', 'en'].includes(language) || !['easy', 'medium', 'hard'].includes(difficulty)) {
    return json({ error: 'Invalid language or difficulty' }, 400)
  }
  const theme = body.theme && THEMES[body.theme] ? body.theme : null
  const exclude = new Set(
    (Array.isArray(body.excludeWords) ? body.excludeWords : [])
      .slice(0, 50)
      .map((w) => sanitize(String(w)))
      .filter((w) => isValidWord(w, language)),
  )

  // ── Per-user daily limit (every request counts; Muse calls cost money) ──
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('ai_generation_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)
  if ((count ?? 0) >= DAILY_LIMIT) return json({ error: 'Daily limit reached' }, 429)

  // ── Cache first (60% of the time when there's a pool of ≥3 fresh words) ─
  let source: 'cache' | 'muse' | 'fallback' = 'cache'
  let result: WordResult | null = null
  try {
    let query = supabase
      .from('ai_words_cache')
      .select('word, definition, hint')
      .eq('language', language)
      .eq('difficulty', difficulty)
      .limit(60)
    query = theme ? query.eq('theme', theme) : query.is('theme', null)
    const { data: cached } = await query
    const pool = (cached ?? []).filter((c) => !exclude.has(c.word))
    if (pool.length >= MIN_CACHE_POOL && Math.random() < CACHE_PROBABILITY) {
      result = pool[Math.floor(Math.random() * pool.length)]
    }
  } catch (e) {
    console.warn('cache lookup failed', e)
  }

  // ── Muse ─────────────────────────────────────────────────────────────────
  if (!result) {
    const apiKey = Deno.env.get('MODEL_API_KEY')
    if (apiKey) {
      try {
        const candidates = await askMuse(apiKey, { ...body, theme: theme ?? undefined }, exclude, userId)
        result = candidates[Math.floor(Math.random() * candidates.length)]
        source = 'muse'
        // Every valid candidate feeds the shared cache
        const { error: cacheError } = await supabase.from('ai_words_cache').upsert(
          candidates.map((c) => ({ ...c, language, difficulty, theme })),
          { onConflict: 'word,language', ignoreDuplicates: true },
        )
        if (cacheError) console.warn('cache upsert failed', cacheError.message)
      } catch (e) {
        console.error('muse error', e instanceof Error ? e.message : e)
      }
    } else {
      console.warn('MODEL_API_KEY not set — serving fallback words')
    }
  }

  if (!result) {
    result = pickFallback(language, difficulty, exclude)
    source = 'fallback'
  }

  const { error: logError } = await supabase
    .from('ai_generation_log')
    .insert({ user_id: userId, source, language, difficulty })
  if (logError) console.warn('log insert failed', logError.message)

  return json(result)
})
