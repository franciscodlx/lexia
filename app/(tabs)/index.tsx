import { useEffect, useState, useCallback, useRef } from 'react'
import { AppState, View } from 'react-native'
import { router } from 'expo-router'
import { WordleGame } from '@/components/game/WordleGame'
import { AuthModal } from '@/components/modals/AuthModal'
import { StatsModal } from '@/components/modals/StatsModal'
import { useWordleGame } from '@/hooks/useWordleGame'
import { useAuth } from '@/hooks/useAuth'
import { useRewardedAd } from '@/hooks/useRewardedAd'
import { useDisplayStats } from '@/hooks/useDisplayStats'
import { useStoreHydrated } from '@/hooks/useStoreHydrated'
import { useGameStore, useLanguage } from '@/store/gameStore'
import { useUserStore } from '@/store/userStore'
import { getDailyWord, getTodayString } from '@/lib/utils'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

const STATS_DELAY_MS = 1800

export default function DailyGame() {
  const hydrated = useStoreHydrated()
  const primaryLanguage = useLanguage()
  const isPremium = useUserStore((s) => s.isPremium)
  const [language, setLanguage] = useState<Language>(primaryLanguage)
  const [showStats, setShowStats] = useState(false)
  // Day + language of the game currently on screen, and whether it was already recorded
  const loadedRef = useRef<{ date: string; language: Language; recorded: boolean } | null>(null)

  const {
    board, currentRow, completedRows, gameStatus, targetWord, hints, usedLetters, message,
    shakeValues, flipValues, handleKey, useHint, addHint, resetGame, restoreGame, showMessage,
  } = useWordleGame()

  const { isAuthenticated, registrationPrompt, dismissRegistrationPrompt, saveGame } = useAuth()
  const { stats, winRate } = useDisplayStats()
  const { showAd, isLoaded: adLoaded } = useRewardedAd()
  const incrementLocalGames = useGameStore((s) => s.incrementLocalGames)
  const recordDailyResult = useGameStore((s) => s.recordDailyResult)

  const copy = COPY[language]

  // Load today's word for `lang` — or the finished board if it was already played
  const loadDaily = useCallback(
    (lang: Language) => {
      const today = getTodayString()
      const saved = useGameStore.getState().dailyResults[lang]
      setShowStats(false)
      if (saved?.date === today) {
        restoreGame(saved.word, lang, saved.board, saved.won ? 'won' : 'lost', saved.guesses)
        loadedRef.current = { date: today, language: lang, recorded: true }
      } else {
        resetGame(getDailyWord(lang), lang)
        loadedRef.current = { date: today, language: lang, recorded: false }
      }
    },
    [resetGame, restoreGame]
  )

  // Initial load; afterwards only switch when the game on screen is no longer allowed
  // (primary language changed, or premium was lost while on the second language)
  useEffect(() => {
    if (!hydrated) return
    const loaded = loadedRef.current
    if (loaded && (loaded.language === primaryLanguage || isPremium)) return
    setLanguage(primaryLanguage)
    loadDaily(primaryLanguage)
  }, [hydrated, isPremium, loadDaily, primaryLanguage])

  // New day while the app stayed open → load the new word
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const loaded = loadedRef.current
      if (state === 'active' && loaded && loaded.date !== getTodayString()) {
        loadDaily(loaded.language)
      }
    })
    return () => sub.remove()
  }, [loadDaily])

  // The second language is a premium feature
  const handleLanguageChange = useCallback(
    (lang: Language) => {
      if (lang === language) return
      if (lang !== primaryLanguage && !isPremium) {
        showMessage(COPY[language].game.premiumLanguage)
        router.push('/paywall')
        return
      }
      setLanguage(lang)
      loadDaily(lang)
    },
    [isPremium, language, loadDaily, primaryLanguage, showMessage]
  )

  // Record the result once when a freshly played game ends
  useEffect(() => {
    const loaded = loadedRef.current
    if ((gameStatus !== 'won' && gameStatus !== 'lost') || !loaded || loaded.recorded) return
    loaded.recorded = true
    const won = gameStatus === 'won'

    recordDailyResult({
      date: loaded.date,
      language: loaded.language,
      word: targetWord,
      board,
      won,
      guesses: completedRows,
    })
    incrementLocalGames()
    if (isAuthenticated) {
      saveGame({
        word: targetWord,
        guesses: won ? completedRows : null,
        won,
        language: loaded.language,
        isAIMode: false,
        playedAt: new Date().toISOString(),
      }).catch((e) => console.warn('[Lexia] saveGame failed', e))
    }
    // No cleanup on purpose: once recorded, this effect never runs again for this game
    setTimeout(() => setShowStats(true), STATS_DELAY_MS)
  }, [
    board, completedRows, gameStatus, incrementLocalGames, isAuthenticated, recordDailyResult,
    saveGame, targetWord,
  ])

  // Rewarded ad → extra hint
  const handleWatchAd = useCallback(async () => {
    if (!adLoaded) return
    const rewarded = await showAd()
    if (rewarded) addHint()
  }, [adLoaded, showAd, addHint])

  const finished = gameStatus === 'won' || gameStatus === 'lost'

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      <WordleGame
        board={board}
        currentRow={currentRow}
        gameStatus={gameStatus}
        language={language}
        hints={hints}
        usedLetters={usedLetters}
        message={message}
        shakeValues={shakeValues}
        flipValues={flipValues}
        handleKey={handleKey}
        onUseHint={useHint}
        onWatchAd={adLoaded ? handleWatchAd : undefined}
        streak={stats.currentStreak}
        showLanguageToggle
        lockedLanguages={isPremium ? [] : [primaryLanguage === 'es' ? 'en' : 'es']}
        onLanguageChange={handleLanguageChange}
        subtitle={finished ? copy.game.alreadyPlayed : copy.game.daily}
        onShowResult={finished ? () => setShowStats(true) : undefined}
      />

      {/* Auth modal (progressive registration) */}
      {registrationPrompt && (
        <AuthModal
          visible
          reason={registrationPrompt}
          language={language}
          onDismiss={dismissRegistrationPrompt}
        />
      )}

      <StatsModal
        visible={showStats}
        won={gameStatus === 'won'}
        targetWord={targetWord}
        board={board}
        completedRows={completedRows}
        stats={stats}
        language={language}
        winRate={winRate}
        isAIMode={false}
        onClose={() => setShowStats(false)}
      />
    </View>
  )
}
