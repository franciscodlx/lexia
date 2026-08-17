import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'

interface GameState {
  localGamesCount: number
  lastPromptShown: number | null // timestamp ms
  incrementLocalGames: () => void
  setLastPromptShown: (ts: number) => void
  resetLocalGames: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      localGamesCount: 0,
      lastPromptShown: null,
      incrementLocalGames: () =>
        set({ localGamesCount: get().localGamesCount + 1 }),
      setLastPromptShown: (ts) => set({ lastPromptShown: ts }),
      resetLocalGames: () => set({ localGamesCount: 0 }),
    }),
    {
      name: ASYNC_STORAGE_KEYS.LOCAL_GAMES_COUNT,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
