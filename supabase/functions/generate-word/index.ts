// Supabase Edge Function — generate-word
// Runtime: Deno. Do NOT use require() or Node.js APIs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  language: 'es' | 'en'
  difficulty: 'easy' | 'medium' | 'hard'
  theme?: string
  excludeWords?: string[]
}

interface WordResult {
  word: string
  definition: string
  hint: string
}

// Fallback words when Claude is unavailable
const FALLBACKS: Record<string, WordResult[]> = {
  es_easy:   [{ word: 'GATOS', definition: 'Plural de gato, felino doméstico', hint: 'Son mascotas comunes' }],
  es_medium: [{ word: 'NICHO', definition: 'Hueco en una pared para colocar objetos', hint: 'Está en las paredes' }],
  es_hard:   [{ word: 'ZAFIO', definition: 'Tosco, sin educación ni delicadeza', hint: 'Sinónimo de grosero' }],
  en_easy:   [{ word: 'BRAVE', definition: 'Ready to face danger without fear', hint: 'A courageous act' }],
  en_medium: [{ word: 'QUIRK', definition: 'A peculiar behavioral habit', hint: 'Everyone has one' }],
  en_hard:   [{ word: 'CYNIC', definition: 'A person who believes people are selfish', hint: 'Glass half empty' }],
}

function buildPrompt(body: RequestBody): string {
  const { language, difficulty, theme, excludeWords } = body
  const lang = language === 'es' ? 'Spanish' : 'English'
  const exclude = excludeWords?.slice(0, 20).join(', ') ?? ''

  const difficultyDesc = {
    easy: language === 'es'
      ? 'muy común, que cualquier hispanohablante conoce'
      : 'very common, known by any English speaker',
    medium: language === 'es'
      ? 'de uso moderado, no trivial pero reconocible'
      : 'moderately common, not trivial but recognizable',
    hard: language === 'es'
      ? 'poco frecuente, vocabulario avanzado o técnico'
      : 'uncommon, advanced or technical vocabulary',
  }[difficulty]

  const themeClause = theme && theme !== 'random'
    ? (language === 'es' ? ` relacionada con el tema "${theme}"` : ` related to the theme "${theme}"`)
    : ''

  const excludeClause = exclude
    ? (language === 'es'
        ? ` No uses ninguna de estas palabras: ${exclude}.`
        : ` Do not use any of these words: ${exclude}.`)
    : ''

  if (language === 'es') {
    return `Genera una palabra en español de EXACTAMENTE 5 letras, sin acentos ni caracteres especiales excepto la Ñ. La palabra debe ser ${difficultyDesc}${themeClause}.${excludeClause}

Responde ÚNICAMENTE con un JSON válido con este formato exacto:
{"word":"XXXXX","definition":"definición breve en español (máx 15 palabras)","hint":"pista indirecta en español (máx 8 palabras)"}

La palabra debe tener exactamente 5 letras (A-Z, puede incluir Ñ). Sin markdown, sin explicaciones adicionales.`
  }

  return `Generate an English word of EXACTLY 5 letters (A-Z only, no special characters). The word should be ${difficultyDesc}${themeClause}.${excludeClause}

Reply ONLY with a valid JSON in this exact format:
{"word":"XXXXX","definition":"brief definition in English (max 15 words)","hint":"indirect hint in English (max 8 words)"}

The word must be exactly 5 letters (A-Z only). No markdown, no additional explanation.`
}

function validateWord(word: string): boolean {
  return /^[A-ZÑ]{5}$/.test(word)
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // Verify JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse body
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { language, difficulty, theme, excludeWords = [] } = body
  if (!language || !difficulty) {
    return new Response(JSON.stringify({ error: 'Missing language or difficulty' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Init Supabase admin client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // Try cache first (60% probability if >= 3 unused items available)
  const cacheKey = `${language}_${difficulty}`
  try {
    const { data: cached } = await supabase
      .from('ai_words_cache')
      .select('id, word, definition, hint')
      .eq('language', language)
      .eq('difficulty', difficulty)
      .eq('used', false)
      .not('word', 'in', `(${excludeWords.map((w) => `"${w}"`).join(',')})`)
      .limit(10)

    if (cached && cached.length >= 3 && Math.random() < 0.6) {
      const pick = cached[Math.floor(Math.random() * cached.length)]
      // Mark as used
      await supabase.from('ai_words_cache').update({ used: true }).eq('id', pick.id)
      return new Response(
        JSON.stringify({ word: pick.word, definition: pick.definition, hint: pick.hint }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
  } catch {
    // Cache miss — continue to Claude
  }

  // Call Claude Haiku
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    // No API key — return fallback
    const fb = FALLBACKS[`${language}_${difficulty}`]?.[0] ?? FALLBACKS['en_easy'][0]
    return new Response(JSON.stringify(fb), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let result: WordResult | null = null

  // Retry up to 3 times (Claude may return invalid words occasionally)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: buildPrompt({ language, difficulty, theme, excludeWords }) }],
        }),
      })

      if (!claudeRes.ok) break

      const claudeData = await claudeRes.json()
      const text: string = claudeData.content?.[0]?.text ?? ''

      // Extract JSON from response (strip any markdown fences)
      const jsonMatch = text.match(/\{[^}]+\}/)
      if (!jsonMatch) continue

      const parsed = JSON.parse(jsonMatch[0]) as WordResult
      const word = parsed.word?.toUpperCase().replace(/\s/g, '')

      if (validateWord(word) && !excludeWords.includes(word)) {
        result = { word, definition: parsed.definition, hint: parsed.hint }
        break
      }
    } catch {
      // retry
    }
  }

  // Fallback if all attempts failed
  if (!result) {
    const fb = FALLBACKS[`${language}_${difficulty}`]?.[0] ?? FALLBACKS['en_easy'][0]
    result = fb
  }

  // Save to cache (fire-and-forget)
  supabase
    .from('ai_words_cache')
    .upsert(
      {
        word: result.word,
        definition: result.definition,
        hint: result.hint,
        language,
        difficulty,
        theme: theme ?? null,
        used: true,
      },
      { onConflict: 'word,language' },
    )
    .then(() => {})
    .catch(() => {})

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
