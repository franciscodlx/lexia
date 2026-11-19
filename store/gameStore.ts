import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'
import { getTodayString, getYesterdayString } from '@/lib/utils'
import type { DailyResult, Language, LocalStats } from '@/types'

const EMPTY_LOCAL_STATS: LocalStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedAt: null,
  guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
}

interface GameState {
  /** Primary language: UI language and the free daily word. The other one is premium. */
  language: Language | null
  localGamesCount: number
  lastPromptShown: number | null // timestamp ms
  /** Device-side stats (used while the player is a guest). Same rules as the DB trigger. */
  localStats: LocalStats
  /** Today's finished daily game per language, to block replays and show the result. */
  dailyResults: Partial<Record<Language, DailyResult>>
  setLanguage: (language: Language) => void
  incrementLocalGames: () => void
  setLastPromptShown: (ts: number) => void
  resetLocalGames: () => void
  recordDailyResult: (result: DailyResult) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      language: null,
      localGamesCount: 0,
      lastPromptShown: null,
      localStats: EMPTY_LOCAL_STATS,
      dailyResults: {},
      setLanguage: (language) => set({ language }),
      incrementLocalGames: () => set({ localGamesCount: get().localGamesCount + 1 }),
      setLastPromptShown: (ts) => set({ lastPromptShown: ts }),
      resetLocalGames: () => set({ localGamesCount: 0 }),
      recordDailyResult: (result) => {
        const { localStats, dailyResults } = get()
        const today = getTodayString()
        const prev = localStats
        let streak: number
        if (prev.lastPlayedAt === getYesterdayString()) streak = prev.currentStreak + 1
        else if (prev.lastPlayedAt === today) streak = prev.currentStreak
        else streak = 1
        const dist = { ...prev.guessDistribution }
        if (result.won) dist[String(result.guesses)] = (dist[String(result.guesses)] ?? 0) + 1
        const currentStreak = result.won ? Math.max(streak, 1) : 0
        set({
          dailyResults: { ...dailyResults, [result.language]: result },
          localStats: {
            gamesPlayed: prev.gamesPlayed + 1,
            gamesWon: prev.gamesWon + (result.won ? 1 : 0),
            currentStreak,
            maxStreak: Math.max(prev.maxStreak, currentStreak),
            lastPlayedAt: today,
            guessDistribution: dist,
          },
        })
      },
    }),
    {
      name: ASYNC_STORAGE_KEYS.LOCAL_GAMES_COUNT,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 only had localGamesCount + lastPromptShown; the new fields take their defaults
      migrate: (persisted) => persisted as GameState,
    }
  )
)

/** Primary language, falling back to the device locale on first launch. */
export function getDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? ''
    return locale.toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'es'
  }
}

export function useLanguage(): Language {
  return useGameStore((s) => s.language) ?? getDeviceLanguage()
}
