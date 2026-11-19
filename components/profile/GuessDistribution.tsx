import { View, Text } from 'react-native'
import type { Language, LocalStats } from '@/types'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'

interface Props {
  stats: LocalStats
  language: Language
  lastGuessCount?: number | null
}

export function GuessDistribution({ stats, language, lastGuessCount }: Props) {
  const copy = COPY[language].stats
  const dist = stats.guessDistribution

  const counts = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    count: dist[n.toString()] ?? 0,
  }))

  const maxCount = Math.max(...counts.map((c) => c.count), 1)

  return (
    <View className="gap-2">
      <Text className="text-white font-bold text-base">{copy.guessDistribution}</Text>

      {counts.map(({ n, count }) => {
        const isLast = n === lastGuessCount
        const barFraction = Math.max(count / maxCount, 0.05)

        return (
          <View key={n} className="flex-row items-center gap-2">
            <Text
              className="text-sm font-bold w-4 text-right"
              style={{ color: Colors.textMuted }}
            >
              {n}
            </Text>
            <View className="flex-1 h-7 rounded overflow-hidden" style={{ backgroundColor: Colors.surface }}>
              <View
                className="h-full items-end justify-center pr-2 rounded"
                style={{
                  width: `${barFraction * 100}%`,
                  backgroundColor: isLast ? Colors.correct : Colors.absent,
                  minWidth: 28,
                }}
              >
                <Text className="text-white text-xs font-bold">{count}</Text>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}
