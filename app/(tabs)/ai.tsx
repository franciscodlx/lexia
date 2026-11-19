import { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { WordleGame } from '@/components/game/WordleGame'
import { AuthModal } from '@/components/modals/AuthModal'
import { DifficultySelector } from '@/components/modals/DifficultySelector'
import { StatsModal } from '@/components/modals/StatsModal'
import { useWordleGame } from '@/hooks/useWordleGame'
import { useAuth } from '@/hooks/useAuth'
import { useAIWord } from '@/hooks/useAIWord'
import { useUserStore } from '@/store/userStore'
import { DIFFICULTY_CONFIGS } from '@/constants/config'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Difficulty, Language } from '@/types'

type Screen = 'selector' | 'game' | 'stats'

export default function AIMode() {
  const { isAuthenticated, stats, winRate } = useAuth()
  const { isPremium } = useUserStore()
  const { generateWord, isLoading: generatingWord } = useAIWord()

  const [screen, setScreen] = useState<Screen>('selector')
  const [language] = useState<Language>('es')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [theme, setTheme] = useState<string | undefined>()
  const [definition, setDefinition] = useState<string | undefined>()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const {
    board, currentRow, gameStatus, hints, usedLetters, message,
    shakeValues, flipValues, handleKey, useHint, resetGame,
  } = useWordleGame()

  const copy = COPY[language]
  const diffConfig = DIFFICULTY_CONFIGS.find((d) => d.key === difficulty)!

  // Generate word and start game
  const handlePlay = useCallback(async () => {
    const result = await generateWord(language, difficulty, theme)
    if (!result) return
    setDefinition(result.definition)
    const hintsCount = diffConfig.maxHints
    resetGame(result.word, language, hintsCount)
    setScreen('game')
  }, [difficulty, diffConfig.maxHints, generateWord, language, resetGame, theme])

  // When the game ends, show the stats screen after the flip settles
  useEffect(() => {
    if (screen === 'game' && (gameStatus === 'won' || gameStatus === 'lost')) {
      const timer = setTimeout(() => setScreen('stats'), 1800)
      return () => clearTimeout(timer)
    }
  }, [gameStatus, screen])

  // Guard: not authenticated
  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">🤖</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.ai.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.auth.requiredBody}
        </Text>
        <Pressable
          onPress={() => setShowAuthModal(true)}
          className="px-8 py-3 rounded-xl"
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
      </View>
    )
  }

  // Guard: not premium
  if (!isPremium) {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">🔒</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.ai.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.paywall.subtitle}
        </Text>
        <View className="gap-3 w-full">
          {[copy.paywall.benefit1, copy.paywall.benefit2, copy.paywall.benefit3, copy.paywall.benefit4].map(
            (b, i) => (
              <Text key={i} className="text-white text-sm">{b}</Text>
            )
          )}
        </View>
        <Pressable
          onPress={() => router.push('/paywall')}
          className="px-8 py-3 rounded-xl w-full items-center"
          style={{ backgroundColor: Colors.premium }}
        >
          <Text className="font-bold text-base" style={{ color: '#000' }}>
            {copy.paywall.lifetime}
          </Text>
        </Pressable>
      </View>
    )
  }

  if (screen === 'selector') {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background }}>
        <View
          className="px-4 py-4 border-b"
          style={{ borderBottomColor: Colors.border }}
        >
          <Text className="text-white text-xl font-bold text-center tracking-widest">
            {copy.ai.title}
          </Text>
        </View>
        <DifficultySelector
          language={language}
          selectedDifficulty={difficulty}
          selectedTheme={theme}
          onDifficultyChange={setDifficulty}
          onThemeChange={setTheme}
          onPlay={handlePlay}
          loading={generatingWord}
        />
      </View>
    )
  }

  if (screen === 'stats') {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background }}>
        <StatsModal
          visible
          won={gameStatus === 'won'}
          targetWord={board.flat().slice(0, 5).map((c) => c.letter).join('')}
          definition={definition}
          board={board}
          completedRows={currentRow}
          stats={stats}
          language={language}
          winRate={winRate}
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
        onTimeExpire={() => setScreen('stats')}
      />
    </View>
  )
}
