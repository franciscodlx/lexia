import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GameBoard } from './GameBoard'
import { GameKeyboard } from './GameKeyboard'
import { GameToast } from './GameToast'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import type { Language } from '@/types'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'

interface Props {
  // From useWordleGame
  board: ReturnType<typeof import('@/hooks/useWordleGame').useWordleGame>['board']
  currentRow: number
  gameStatus: ReturnType<typeof import('@/hooks/useWordleGame').useWordleGame>['gameStatus']
  language: Language
  hints: number
  usedLetters: ReturnType<typeof import('@/hooks/useWordleGame').useWordleGame>['usedLetters']
  message: string | null
  shakeValues: ReturnType<typeof import('@/hooks/useWordleGame').useWordleGame>['shakeValues']
  flipValues: ReturnType<typeof import('@/hooks/useWordleGame').useWordleGame>['flipValues']
  handleKey: (key: string) => void
  onUseHint: () => void
  // When set, the hint button offers a rewarded ad once hints run out
  onWatchAd?: () => void
  // Game config
  title?: string
  subtitle?: string
  streak?: number
  timeLimit?: number | null
  onTimeExpire?: () => void
  onLanguageChange?: (lang: Language) => void
  showLanguageToggle?: boolean
  /** Languages shown with a lock (premium-only); tapping still calls onLanguageChange */
  lockedLanguages?: Language[]
  /** When set (finished game), the bottom bar shows a "view result" button */
  onShowResult?: () => void
}

export function WordleGame({
  board,
  currentRow,
  gameStatus,
  language,
  hints,
  usedLetters,
  message,
  shakeValues,
  flipValues,
  handleKey,
  onUseHint,
  onWatchAd,
  title,
  subtitle,
  streak = 0,
  timeLimit = null,
  onTimeExpire,
  onLanguageChange,
  showLanguageToggle = false,
  lockedLanguages = [],
  onShowResult,
}: Props) {
  const copy = COPY[language]
  const isPlaying = gameStatus === 'playing'

  return (
    <SafeAreaView className="flex-1 bg-game-bg" style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-game-border">
        {/* Language toggle or spacer */}
        {showLanguageToggle && onLanguageChange ? (
          <View className="flex-row gap-1">
            {(['es', 'en'] as Language[]).map((lang) => (
              <Pressable
                key={lang}
                onPress={() => onLanguageChange(lang)}
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor:
                    language === lang ? Colors.correct : Colors.surface,
                }}
              >
                <Text
                  className="text-xs font-bold uppercase"
                  style={{ color: language === lang ? Colors.text : Colors.textMuted }}
                >
                  {lockedLanguages.includes(lang) ? `🔒${lang}` : lang}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="w-16" />
        )}

        {/* Title */}
        <View className="items-center">
          <Text className="text-white text-xl font-bold tracking-[0.2em]">
            {title ?? copy.game.title}
          </Text>
          {subtitle ? (
            <Text className="text-xs" style={{ color: Colors.textMuted }}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Hints button — with no hints left it offers a rewarded ad */}
        <Pressable
          onPress={hints > 0 ? onUseHint : onWatchAd}
          disabled={!isPlaying || (hints <= 0 && !onWatchAd)}
          className="w-16 items-end"
        >
          <View
            className="px-2 py-1 rounded-lg flex-row items-center gap-1"
            style={{
              backgroundColor:
                isPlaying && (hints > 0 || onWatchAd) ? Colors.present : Colors.surface,
              opacity: isPlaying && (hints > 0 || onWatchAd) ? 1 : 0.4,
            }}
          >
            <Text className="text-base">{hints > 0 || !onWatchAd ? '💡' : '📺'}</Text>
            <Text className="text-white text-xs font-bold">{hints}</Text>
          </View>
        </Pressable>
      </View>

      {/* ── Toast ──────────────────────────────────────────── */}
      <View className="relative">
        <GameToast message={message} />
      </View>

      {/* ── Board ──────────────────────────────────────────── */}
      <View className="flex-1 justify-center">
        <GameBoard
          board={board}
          shakeValues={shakeValues}
          flipValues={flipValues}
        />
      </View>

      {/* ── Bottom bar ─────────────────────────────────────── */}
      <View
        className="flex-row items-center justify-between px-4 py-2 border-t border-game-border"
      >
        {/* Streak */}
        <View className="flex-row items-center gap-1">
          <Text className="text-base">🔥</Text>
          <Text className="text-white text-sm font-bold">{streak}</Text>
        </View>

        {/* Timer (AI mode only) / result button (finished game) */}
        {onShowResult && !isPlaying ? (
          <Pressable
            onPress={onShowResult}
            className="px-3 py-1.5 rounded-lg active:opacity-70"
            style={{ backgroundColor: Colors.correct }}
          >
            <Text className="text-white text-sm font-bold">{copy.game.viewResult}</Text>
          </Pressable>
        ) : timeLimit !== null && isPlaying ? (
          <CountdownTimer
            totalSeconds={timeLimit}
            onExpire={onTimeExpire}
            className="text-white font-bold text-base tabular-nums"
          />
        ) : (
          <View />
        )}
      </View>

      {/* ── Keyboard ───────────────────────────────────────── */}
      <GameKeyboard
        language={language}
        usedLetters={usedLetters}
        onKey={handleKey}
        disabled={!isPlaying}
      />
    </SafeAreaView>
  )
}
