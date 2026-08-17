import { useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import type { GameResult, Language, RegistrationPromptReason, UserProfile } from '@/types'
import { GAMES_BEFORE_REQUIRED, GAMES_BEFORE_SUGGESTION } from '@/constants/config'

export function useAuth() {
  const { profile, stats, setProfile, setStats, clearUser } = useUserStore()
  const { localGamesCount, lastPromptShown, setLastPromptShown } = useGameStore()

  const isAuthenticated = profile !== null

  // ─── Load user data from Supabase ────────────────────────────────────────
  const loadUserData = useCallback(async (userId: string) => {
    const [profileRes, statsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('player_stats').select('*').eq('user_id', userId).single(),
    ])
    if (profileRes.data) {
      setProfile({
        id: profileRes.data.id,
        username: profileRes.data.username ?? '',
        avatarUrl: profileRes.data.avatar_url,
        language: profileRes.data.language as Language,
        isPremium: profileRes.data.is_premium,
        createdAt: profileRes.data.created_at,
      })
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
  }, [setProfile, setStats])

  // ─── Auth state listener ─────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        clearUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData, clearUser])

  // ─── Email auth ──────────────────────────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) throw error
    },
    []
  )

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  // ─── Apple Sign-In (iOS only) ────────────────────────────────────────────
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is iOS only')

    const { default: AppleAuthentication } = await import('expo-apple-authentication')
    const { getRandomBytes } = await import('expo-crypto')

    const rawNonce = Array.from(getRandomBytes(16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken ?? '',
      nonce: rawNonce,
    })
    if (error) throw error
  }, [])

  // ─── Google Sign-In ──────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')

    const hasServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })
      .then(() => true)
      .catch(() => false)

    if (!hasServices) throw new Error('Google Play Services not available')

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    })

    await GoogleSignin.hasPlayServices()
    const userInfo = await GoogleSignin.signIn()
    const tokens = await GoogleSignin.getTokens()

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.idToken ?? '',
    })
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
    },
    [profile, setProfile]
  )

  // ─── Save game result ────────────────────────────────────────────────────
  const saveGame = useCallback(
    async (result: GameResult) => {
      if (!profile) return
      const { error } = await supabase.from('game_history').insert({
        user_id: profile.id,
        word: result.word,
        guesses: result.guesses,
        won: result.won,
        language: result.language,
        difficulty: result.difficulty ?? null,
        is_ai_mode: result.isAIMode,
        played_at: result.playedAt,
      })
      if (error) throw error
      // Reload stats (trigger updated them)
      await loadUserData(profile.id)
    },
    [profile, loadUserData]
  )

  // ─── Sign out ────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearUser()
  }, [clearUser])

  // ─── Registration prompt logic ───────────────────────────────────────────
  const dismissRegistrationPrompt = useCallback(() => {
    setLastPromptShown(Date.now())
  }, [setLastPromptShown])

  const registrationPrompt: RegistrationPromptReason | null = (() => {
    if (isAuthenticated) return null
    if (localGamesCount >= GAMES_BEFORE_REQUIRED) return 'required'
    if (
      localGamesCount >= GAMES_BEFORE_SUGGESTION &&
      (!lastPromptShown || Date.now() - lastPromptShown > 24 * 60 * 60 * 1000)
    ) {
      return 'suggestion'
    }
    return null
  })()

  // ─── Computed ────────────────────────────────────────────────────────────
  const winRate =
    stats && stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0

  return {
    isAuthenticated,
    profile,
    stats,
    winRate,
    registrationPrompt,
    signUpWithEmail,
    signInWithEmail,
    signInWithApple,
    signInWithGoogle,
    updateProfile,
    saveGame,
    signOut,
    dismissRegistrationPrompt,
  }
}
