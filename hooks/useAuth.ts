import { useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import Purchases from 'react-native-purchases'
import { supabase } from '@/lib/supabase'
import { initRevenueCat } from '@/lib/revenuecat'
import { hasPremium } from '@/hooks/usePremium'
import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import type { GameResult, Language, RegistrationPromptReason, UserProfile } from '@/types'
import { GAMES_BEFORE_REQUIRED, GAMES_BEFORE_SUGGESTION } from '@/constants/config'

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? ''

/** Google Sign-In needs real OAuth client IDs (and Play Services on Android). */
export function isGoogleConfigured(): boolean {
  const ok = (v: string) => v.length > 0 && !v.includes('XXXX')
  return ok(GOOGLE_WEB_CLIENT_ID) && (Platform.OS !== 'ios' || ok(GOOGLE_IOS_CLIENT_ID))
}

export async function isGoogleSignInAvailable(): Promise<boolean> {
  if (!isGoogleConfigured()) return false
  if (Platform.OS === 'ios') return true
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')
    // Throws on devices without Google Mobile Services (e.g. Huawei)
    return await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })
  } catch {
    return false
  }
}

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

  // ─── Apple Sign-In (iOS only) ────────────────────────────────────────────
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is iOS only')

    const AppleAuthentication = await import('expo-apple-authentication')
    const Crypto = await import('expo-crypto')

    // Apple receives SHA-256(nonce); Supabase receives the raw nonce and compares.
    const rawNonce = Array.from(Crypto.getRandomBytes(16))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    )

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    })
    if (!credential.identityToken) throw new Error('Apple did not return an identity token')

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    })
    if (error) throw error
  }, [])

  // ─── Google Sign-In ──────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin')

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    })

    const hasServices = await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false })
      .then(() => true)
      .catch(() => false)
    if (!hasServices) throw new Error('Google Play Services not available')

    const response = await GoogleSignin.signIn()
    if (response.type !== 'success') return // user cancelled
    const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken
    if (!idToken) throw new Error('Google did not return an ID token')

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
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
    signInWithApple,
    signInWithGoogle,
    updateProfile,
    saveGame,
    signOut,
    deleteAccount,
    dismissRegistrationPrompt,
  }
}
