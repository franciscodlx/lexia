import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { sanitizeWord } from '@/lib/utils'
import { DIFFICULTY_CONFIGS, ASYNC_STORAGE_KEYS } from '@/constants/config'
import type { AIWordResult, Difficulty, DifficultyConfig, Language } from '@/types'

const MAX_HISTORY = 30

function historyKey(language: Language): string {
  return language === 'es' ? ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_ES : ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_EN
}

async function getHistory(language: Language): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(historyKey(language))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((w): w is string => typeof w === 'string') : []
  } catch {
    return []
  }
}

async function saveToHistory(language: Language, word: string): Promise<void> {
  const history = await getHistory(language)
  const updated = [word, ...history.filter((w) => w !== word)].slice(0, MAX_HISTORY)
  await AsyncStorage.setItem(historyKey(language), JSON.stringify(updated))
}

export type AIWordError = 'not_authenticated' | 'rate_limited' | 'failed'

export function useAIWord() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIWordError | null>(null)

  const generateWord = useCallback(
    async (language: Language, difficulty: Difficulty, theme?: string): Promise<AIWordResult | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          setError('not_authenticated')
          return null
        }

        const excludeWords = await getHistory(language)
        // functions.invoke attaches the user's JWT automatically
        const { data, error: fnError } = await supabase.functions.invoke<AIWordResult>('generate-word', {
          body: { language, difficulty, theme, excludeWords },
        })
        if (fnError) {
          const status = fnError instanceof FunctionsHttpError ? fnError.context.status : 0
          setError(status === 429 ? 'rate_limited' : 'failed')
          console.warn('[Lexia] generate-word failed', status, fnError.message)
          return null
        }

        const word = sanitizeWord(data?.word ?? '')
        if (!/^[A-ZÑ]{5}$/.test(word)) {
          setError('failed')
          return null
        }
        const result: AIWordResult = { word, definition: data?.definition ?? '', hint: data?.hint ?? '' }
        await saveToHistory(language, word).catch(() => {})
        return result
      } catch (e) {
        console.warn('[Lexia] generate-word error', e)
        setError('failed')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const getDifficultyConfig = useCallback(
    (difficulty: Difficulty): DifficultyConfig =>
      DIFFICULTY_CONFIGS.find((d) => d.key === difficulty) ?? DIFFICULTY_CONFIGS[0],
    []
  )

  return { isLoading, error, generateWord, getDifficultyConfig }
}
