import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { DIFFICULTY_CONFIGS, ASYNC_STORAGE_KEYS } from '@/constants/config'
import type { AIWordResult, Difficulty, DifficultyConfig, Language } from '@/types'

const MAX_HISTORY = 30

export function useAIWord() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getHistory = useCallback(async (language: Language): Promise<string[]> => {
    const key =
      language === 'es'
        ? ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_ES
        : ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_EN
    const raw = await AsyncStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  }, [])

  const saveToHistory = useCallback(async (language: Language, word: string) => {
    const key =
      language === 'es'
        ? ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_ES
        : ASYNC_STORAGE_KEYS.AI_WORD_HISTORY_EN
    const history = await getHistory(language)
    const updated = [word, ...history].slice(0, MAX_HISTORY)
    await AsyncStorage.setItem(key, JSON.stringify(updated))
  }, [getHistory])

  const generateWord = useCallback(
    async (
      language: Language,
      difficulty: Difficulty,
      theme?: string
    ): Promise<AIWordResult | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('Not authenticated')

        const excludeWords = await getHistory(language)

        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-word`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ language, difficulty, theme, excludeWords }),
          }
        )

        if (!res.ok) throw new Error(`Edge Function error: ${res.status}`)

        const result = (await res.json()) as AIWordResult
        await saveToHistory(language, result.word)
        return result
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [getHistory, saveToHistory]
  )

  const getDifficultyConfig = useCallback(
    (difficulty: Difficulty): DifficultyConfig =>
      DIFFICULTY_CONFIGS.find((d) => d.key === difficulty) ?? DIFFICULTY_CONFIGS[0],
    []
  )

  return { isLoading, error, generateWord, getDifficultyConfig }
}
