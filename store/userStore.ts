import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProfile, PlayerStats } from '@/types'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'

interface UserState {
  profile: UserProfile | null
  stats: PlayerStats | null
  isPremium: boolean
  setProfile: (profile: UserProfile | null) => void
  setStats: (stats: PlayerStats | null) => void
  setIsPremium: (value: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      stats: null,
      isPremium: false,
      setProfile: (profile) => set({ profile }),
      setStats: (stats) => set({ stats }),
      setIsPremium: (isPremium) => set({ isPremium }),
      clearUser: () => set({ profile: null, stats: null, isPremium: false }),
    }),
    {
      name: ASYNC_STORAGE_KEYS.USER_PROFILE,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        stats: state.stats,
        isPremium: state.isPremium,
      }),
    }
  )
)
