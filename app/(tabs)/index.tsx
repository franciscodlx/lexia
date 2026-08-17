import { useEffect, useState, useCallback } from 'react'
import { View, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WordleGame } from '@/components/game/WordleGame'
import { AuthModal } from '@/components/modals/AuthModal'
import { StatsModal } from '@/components/modals/StatsModal'
import { useWordleGame } from '@/hooks/useWordleGame'
import { useAuth } from '@/hooks/useAuth'
import { useRewardedAd } from '@/hooks/useRewardedAd'
import { useGameStore } from '@/store/gameStore'
import { getDailyWord, getTodayString } from '@/lib/utils'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

const DEFAULT_LANGUAGE: Language = 'es'

export default function DailyGame() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [aiDefinition, setAiDefinition] = useState<string | undefined>()

  const {
    board, currentRow, gameStatus, hints, usedLetters, message,
    shakeValues, flipValues, handleKey, useHint, addHint, resetGame,
  } = useWordleGame()

  const { isAuthenticated, registrationPrompt, stats, winRate, dismissRegistrationPrompt } = useAuth()
  const { showAd, isLoaded: adLoaded } = useRewardedAd()
  const { localGamesCount, incrementLocalGames } = useGameStore()

  const copy = COPY[language]

  // Load language preference and check if already played today
  useEffect(() => {
    const init = async () => {
      const [savedLang, lastDate] = await Promise.all([
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LAST_DAILY_DATE),
      ])
      const lang = (savedLang as Language | null) ?? DEFAULT_LANGUAGE
      setLanguage(lang)

      if (lastDate === getTodayString()) {
        setAlreadyPlayed(true)
        return
      }

      const word = getDailyWord(lang)
      resetGame(word, lang)
    }
    init()
  }, [])

  // When language toggles, restart with new daily word
  const handleLanguageChange = useCallback(
    async (lang: Language) => {
      setLanguage(lang)
      await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.LANGUAGE, lang)
      const word = getDailyWord(lang)
      resetGame(word, lang)
      setShowStats(false)
    },
    [resetGame]
  )

  // Show stats modal when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const finish = async () => {
        await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.LAST_DAILY_DATE, getTodayString())
        incrementLocalGames()
        setTimeout(() => setShowStats(true), 1800)
      }
      finish()
    }
  }, [gameStatus, incrementLocalGames])

  // Handle rewarded ad → grant hint
  const handleWatchAd = useCallback(async () => {
    if (!adLoaded) return
    const rewarded = await showAd()
    if (rewarded) addHint()
  }, [adLoaded, showAd, addHint])

  const streak = stats?.currentStreak ?? 0

  if (alreadyPlayed) {
    return (
      <View className="flex-1 items-center justify-center gap-4" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">✅</Text>
        <Text className="text-white text-xl font-bold text-center px-8">
          {language === 'es' ? '¡Ya jugaste hoy!' : "You've already played today!"}
        </Text>
        <Text className="text-sm text-center px-8" style={{ color: Colors.textMuted }}>
          {copy.game.nextWordIn}
        </Text>
      </View>
    )
  }

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
        streak={streak}
        showLanguageToggle
        onLanguageChange={handleLanguageChange}
        subtitle={copy.game.daily}
      />

      {/* Auth modal */}
      {registrationPrompt && (
        <AuthModal
          visible
          reason={registrationPrompt}
          language={language}
          onDismiss={dismissRegistrationPrompt}
        />
      )}

      {/* Stats modal */}
      <StatsModal
        visible={showStats}
        won={gameStatus === 'won'}
        targetWord={board[0]?.[0] ? '' : ''}
        definition={aiDefinition}
        board={board}
        completedRows={currentRow}
        stats={stats}
        language={language}
        winRate={winRate}
        isAIMode={false}
        onClose={() => setShowStats(false)}
      />
    </View>
  )
}
