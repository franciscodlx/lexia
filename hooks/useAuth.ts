import { useEffect, useCallback } from 'react'
import Purchases from 'react-native-purchases'
import { supabase } from '@/lib/supabase'
import { initRevenueCat } from '@/lib/revenuecat'
import { hasPremium } from '@/hooks/usePremium'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import type { GameResult, Language, RegistrationPromptReason, UserProfile } from '@/types'
import { GAMES_BEFORE_REQUIRED, GAMES_BEFORE_SUGGESTION } from '@/constants/config'

// ─── Load user data from Supabase into the store ─────────────────────────────
export async function loadUserData(userId: string): Promise<void> {
  const { setProfile, setStats } = useUserStore.getState()
  const [profileRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('player_stats').select('*').eq('user_id', userId).single(),
  ])
  if (profileRes.data) {
    const language = profileRes.data.language as Language
    setProfile({
      id: profileRes.data.id,
      username: profileRes.data.username ?? '',
      avatarUrl: profileRes.data.avatar_url,
      language,
      isPremium: profileRes.data.is_premium,
      createdAt: profileRes.data.created_at,
    })
    // The account's language becomes the device's primary language
    useGameStore.getState().setLanguage(language)
  }
  if (statsRes.data) {
    setStats({
      userId: statsRes.data.user_id,
      gamesPlayed: statsRes.data.games_played,
      gamesWon: statsRes.data.games_won,
      currentStreak: statsRes.data.current_streak,
      maxStreak: statsRes.data.max_streak,
      lastPlayedAt: statsRes.data.last_played_at,
      guessDistribution: statsRes.data.guess_distribution,
    })
  }
}

async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!initRevenueCat()) return
  try {
    const { setIsPremium } = useUserStore.getState()
    if (userId) {
      const { customerInfo } = await Purchases.logIn(userId)
      setIsPremium(hasPremium(customerInfo))
    } else {
      if (!(await Purchases.isAnonymous())) await Purchases.logOut()
      setIsPremium(hasPremium(await Purchases.getCustomerInfo()))
    }
  } catch (e) {
    console.warn('[Lexia] RevenueCat identify failed', e)
  }
}

/**
 * Mount ONCE (root layout): keeps the Supabase session, the profile/stats in the
 * store and the RevenueCat identity in sync.
 */
export function useAuthBootstrap(): void {
  useEffect(() => {
    let lastUserId: string | null | undefined

    const apply = (userId: string | null) => {
      if (userId === lastUserId) return
      lastUserId = userId
      if (userId) {
        loadUserData(userId).catch((e) => console.warn('[Lexia] loadUserData failed', e))
      } else {
        useUserStore.getState().clearUser()
      }
      syncPurchasesUser(userId).catch(() => {})
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => apply(session?.user.id ?? null))
      .catch(() => apply(null))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user.id ?? null))

    let removeRcListener: (() => void) | undefined
    if (initRevenueCat()) {
      const listener = (info: Parameters<typeof hasPremium>[0]) =>
        useUserStore.getState().setIsPremium(hasPremium(info))
      Purchases.addCustomerInfoUpdateListener(listener)
      removeRcListener = () => Purchases.removeCustomerInfoUpdateListener(listener)
    }

    return () => {
      subscription.unsubscribe()
      removeRcListener?.()
    }
  }, [])
}

export function useAuth() {
  const profile = useUserStore((s) => s.profile)
  const stats = useUserStore((s) => s.stats)
  const setProfile = useUserStore((s) => s.setProfile)
  const localGamesCount = useGameStore((s) => s.localGamesCount)
  const lastPromptShown = useGameStore((s) => s.lastPromptShown)
  const setLastPromptShown = useGameStore((s) => s.setLastPromptShown)
  const setLanguage = useGameStore((s) => s.setLanguage)

  const isAuthenticated = profile !== null

  // ─── Email auth ──────────────────────────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string, language: Language) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, language } },
      })
      if (error) throw error
    },
    []
  )

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  // ─── Profile update ──────────────────────────────────────────────────────
  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'username' | 'avatarUrl' | 'language'>>) => {
      if (!profile) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          avatar_url: updates.avatarUrl,
          language: updates.language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      if (error) throw error
      setProfile({ ...profile, ...updates })
      if (updates.language) setLanguage(updates.language)
    },
    [profile, setProfile, setLanguage]
  )

  // ─── Save game result (DB trigger updates player_stats) ──────────────────
  const saveGame = useCallback(async (result: GameResult) => {
    const { profile: current } = useUserStore.getState()
    if (!current) return
    const { error } = await supabase.from('game_history').insert({
      user_id: current.id,
      word: result.word,
      guesses: result.guesses,
      won: result.won,
      language: result.language,
      difficulty: result.difficulty ?? null,
      is_ai_mode: result.isAIMode,
      played_at: result.playedAt,
    })
    if (error) throw error
    await loadUserData(current.id)
  }, [])

  // ─── Sign out / delete account ───────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    useUserStore.getState().clearUser()
  }, [])

  /** Permanently deletes the account (Edge Function `delete-account`) and signs out. */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
    if (error) throw error
    await supabase.auth.signOut().catch(() => {})
    useUserStore.getState().clearUser()
  }, [])

  // ─── Registration prompt logic ───────────────────────────────────────────
  const dismissRegistrationPrompt = useCallback(() => {
    setLastPromptShown(Date.now())
  }, [setLastPromptShown])

  const registrationPrompt: RegistrationPromptReason | null = (() => {
    if (isAuthenticated) return null
    if (localGamesCount >= GAMES_BEFORE_REQUIRED) return 'required'
    if (
      localGamesCount >= GAMES_BEFORE_SUGGESTION &&
      // eslint-disable-next-line react-hooks/purity -- time-gated prompt: reading the clock here only delays re-showing the suggestion, never changes committed UI
      (!lastPromptShown || Date.now() - lastPromptShown > 24 * 60 * 60 * 1000)
    ) {
      return 'suggestion'
    }
    return null
  })()

  // ─── Computed ────────────────────────────────────────────────────────────
  const winRate =
    stats && stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0

  return {
    isAuthenticated,
    profile,
    stats,
    winRate,
    registrationPrompt,
    signUpWithEmail,
    signInWithEmail,
    updateProfile,
    saveGame,
    signOut,
    deleteAccount,
    dismissRegistrationPrompt,
  }
}
