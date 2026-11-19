import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WordleGame } from '@/components/game/WordleGame'
import { AuthModal } from '@/components/modals/AuthModal'
import { DifficultySelector } from '@/components/modals/DifficultySelector'
import { StatsModal } from '@/components/modals/StatsModal'
import { useWordleGame } from '@/hooks/useWordleGame'
import { useAuth } from '@/hooks/useAuth'
import { useAIWord } from '@/hooks/useAIWord'
import { useUserStore } from '@/store/userStore'
import { useLanguage } from '@/store/gameStore'
import { DIFFICULTY_CONFIGS } from '@/constants/config'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Difficulty, Language } from '@/types'

type Screen = 'selector' | 'game' | 'stats'

const STATS_DELAY_MS = 1800

export default function AIMode() {
  const { isAuthenticated, saveGame } = useAuth()
  const isPremium = useUserStore((s) => s.isPremium)
  const primaryLanguage = useLanguage()
  const { generateWord, isLoading: generatingWord, error: aiError } = useAIWord()

  const [screen, setScreen] = useState<Screen>('selector')
  // null = follow the primary language
  const [chosenLanguage, setChosenLanguage] = useState<Language | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [theme, setTheme] = useState<string | undefined>()
  const [definition, setDefinition] = useState<string | undefined>()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const recordedRef = useRef(true)

  const {
    board, currentRow, completedRows, gameStatus, targetWord, hints, usedLetters, message,
    language: gameLanguage,
    shakeValues, flipValues, handleKey, useHint, forfeit, resetGame, showMessage,
  } = useWordleGame()

  // While playing, the language is the one the word was generated in
  const language: Language = screen === 'selector' ? (chosenLanguage ?? primaryLanguage) : gameLanguage
  const copy = COPY[language]
  const diffConfig = DIFFICULTY_CONFIGS.find((d) => d.key === difficulty) ?? DIFFICULTY_CONFIGS[0]

  // Generate word and start game
  const handlePlay = useCallback(async () => {
    const result = await generateWord(language, difficulty, theme)
    if (!result) return
    setDefinition(result.definition)
    resetGame(result.word, language, diffConfig.maxHints)
    recordedRef.current = false
    setScreen('game')
  }, [diffConfig.maxHints, difficulty, generateWord, language, resetGame, theme])

  // Timer ran out → the game is lost
  const handleTimeExpire = useCallback(() => {
    showMessage(COPY[language].game.timeUp)
    forfeit()
  }, [forfeit, language, showMessage])

  // When the game ends: save it once, then show the result
  useEffect(() => {
    if (screen !== 'game' || (gameStatus !== 'won' && gameStatus !== 'lost')) return
    if (!recordedRef.current) {
      recordedRef.current = true
      const won = gameStatus === 'won'
      saveGame({
        word: targetWord,
        guesses: won ? completedRows : null,
        won,
        language,
        difficulty,
        isAIMode: true,
        playedAt: new Date().toISOString(),
      }).catch((e) => console.warn('[Lexia] saveGame (AI) failed', e))
    }
    const timer = setTimeout(() => setScreen('stats'), STATS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [completedRows, difficulty, gameStatus, language, saveGame, screen, targetWord])

  // Guard: not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">🤖</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.ai.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.auth.requiredBody}
        </Text>
        <Pressable
          onPress={() => setShowAuthModal(true)}
          className="px-8 py-3 rounded-xl active:opacity-70"
          style={{ backgroundColor: Colors.correct }}
        >
          <Text className="text-white font-bold text-base">{copy.auth.signIn}</Text>
        </Pressable>

        <AuthModal
          visible={showAuthModal}
          reason="required"
          language={language}
          onDismiss={() => setShowAuthModal(false)}
        />
      </SafeAreaView>
    )
  }

  // Guard: not premium
  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">🔒</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.ai.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.paywall.subtitle}
        </Text>
        <View className="gap-3 w-full">
          {[copy.paywall.benefit1, copy.paywall.benefit2, copy.paywall.benefit3, copy.paywall.benefit4].map(
            (b) => (
              <Text key={b} className="text-white text-sm">{b}</Text>
            )
          )}
        </View>
        <Pressable
          onPress={() => router.push('/paywall')}
          className="px-8 py-3 rounded-xl w-full items-center active:opacity-70"
          style={{ backgroundColor: Colors.premium }}
        >
          <Text className="font-bold text-base" style={{ color: '#000' }}>
            {copy.paywall.lifetime}
          </Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  if (screen === 'selector') {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background }}>
        <View className="px-4 py-4 border-b flex-row items-center justify-between" style={{ borderBottomColor: Colors.border }}>
          <View className="w-16" />
          <Text className="text-white text-xl font-bold text-center tracking-widest">
            {copy.ai.title}
          </Text>
          <View className="w-16 flex-row justify-end gap-1">
            {(['es', 'en'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setChosenLanguage(lang)}
                accessibilityLabel={`${copy.ai.language}: ${lang}`}
                className="px-2 py-1 rounded"
                style={{ backgroundColor: language === lang ? Colors.correct : Colors.surface }}
              >
                <Text
                  className="text-xs font-bold uppercase"
                  style={{ color: language === lang ? Colors.text : Colors.textMuted }}
                >
                  {lang}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {aiError ? (
          <Text className="text-center text-sm px-6 pt-3" style={{ color: Colors.error }}>
            {aiError === 'rate_limited' ? copy.ai.rateLimited : copy.ai.errorGenerating}
          </Text>
        ) : null}
        <DifficultySelector
          language={language}
          selectedDifficulty={difficulty}
          selectedTheme={theme}
          onDifficultyChange={setDifficulty}
          onThemeChange={setTheme}
          onPlay={handlePlay}
          loading={generatingWord}
        />
      </SafeAreaView>
    )
  }

  if (screen === 'stats') {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background }}>
        <StatsModal
          visible
          won={gameStatus === 'won'}
          targetWord={targetWord}
          definition={definition}
          board={board}
          completedRows={completedRows}
          stats={null}
          language={language}
          winRate={0}
          isAIMode
          onClose={() => setScreen('selector')}
          onPlayAgain={() => {
            setScreen('selector')
            setDefinition(undefined)
          }}
        />
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
        title={copy.ai.title}
        subtitle={diffConfig.label[language]}
        timeLimit={diffConfig.timeLimit}
        onTimeExpire={handleTimeExpire}
      />
    </View>
  )
}
