import { Modal, View, Text, Pressable, ScrollView } from 'react-native'
import { GuessDistribution } from '@/components/profile/GuessDistribution'
import { StatsGrid } from '@/components/profile/StatsGrid'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { Button } from '@/components/ui/Button'
import { shareResult } from './ShareCard'
import type { Language, LetterCell, PlayerStats } from '@/types'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import { secondsUntilMidnight } from '@/lib/utils'

interface Props {
  visible: boolean
  won: boolean
  targetWord: string
  definition?: string
  board: LetterCell[][]
  completedRows: number
  stats: PlayerStats | null
  language: Language
  winRate: number
  isAIMode?: boolean
  onClose: () => void
  onPlayAgain?: () => void
}

export function StatsModal({
  visible,
  won,
  targetWord,
  definition,
  board,
  completedRows,
  stats,
  language,
  winRate,
  isAIMode = false,
  onClose,
  onPlayAgain,
}: Props) {
  const copy = COPY[language]

  const handleShare = () => {
    shareResult({ board, completedRows, won, language, isAIMode })
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-center items-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        <View
          className="w-full rounded-2xl p-6 gap-5 max-h-5/6"
          style={{ backgroundColor: Colors.surface }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-5">
              {/* Result */}
              <View className="items-center gap-2">
                <Text className="text-4xl">{won ? '🎉' : '😔'}</Text>
                <Text className="text-white text-2xl font-bold text-center">
                  {won ? copy.game.youWon : copy.game.youLost}
                </Text>
                <View className="items-center">
                  <Text className="text-sm" style={{ color: Colors.textMuted }}>
                    {copy.game.theWordWas}
                  </Text>
                  <Text
                    className="text-2xl font-bold tracking-widest mt-1"
                    style={{ color: Colors.correct }}
                  >
                    {targetWord}
                  </Text>
                  {definition ? (
                    <Text
                      className="text-sm text-center mt-2 italic"
                      style={{ color: Colors.textMuted }}
                    >
                      {definition}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Stats grid */}
              {stats ? (
                <>
                  <StatsGrid stats={stats} language={language} winRate={winRate} />
                  <GuessDistribution
                    stats={stats}
                    language={language}
                    lastGuessCount={won ? completedRows : null}
                  />
                </>
              ) : null}

              {/* Countdown (daily mode only) */}
              {!isAIMode && (
                <View className="items-center gap-1">
                  <Text className="text-sm" style={{ color: Colors.textMuted }}>
                    {copy.game.nextWordIn}
                  </Text>
                  <CountdownTimer
                    totalSeconds={secondsUntilMidnight()}
                    className="text-white text-2xl font-bold tabular-nums"
                  />
                </View>
              )}

              {/* Actions */}
              <View className="gap-3">
                <Button
                  label={copy.game.shareResult}
                  onPress={handleShare}
                  variant="secondary"
                  size="lg"
                />
                {isAIMode && onPlayAgain && (
                  <Button
                    label={copy.game.playAgain}
                    onPress={onPlayAgain}
                    size="lg"
                  />
                )}
                <Pressable onPress={onClose} className="items-center py-2">
                  <Text style={{ color: Colors.textMuted, fontSize: 14 }}>
                    {copy.game.close}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
