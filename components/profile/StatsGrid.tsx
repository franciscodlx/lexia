import { useEffect, useRef, useState } from 'react'
import { View, Text, Animated } from 'react-native'
import type { Language, PlayerStats } from '@/types'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'

interface Props {
  stats: PlayerStats
  language: Language
  winRate: number
}

interface StatItem {
  value: number
  label: string
}

function AnimatedStat({ value, label }: StatItem) {
  const [displayed, setDisplayed] = useState(0)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const duration = 800
    const steps = 30
    const interval = duration / steps
    const increment = value / steps
    let current = 0

    animRef.current = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayed(value)
        if (animRef.current) clearInterval(animRef.current)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, interval)

    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [value])

  return (
    <View className="flex-1 items-center gap-1 p-3">
      <Text className="text-white text-3xl font-bold tabular-nums">{displayed}</Text>
      <Text
        className="text-xs text-center font-medium"
        style={{ color: Colors.textMuted }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  )
}

export function StatsGrid({ stats, language, winRate }: Props) {
  const copy = COPY[language].stats

  const items: StatItem[] = [
    { value: stats.gamesPlayed, label: copy.played },
    { value: winRate,           label: copy.winRate },
    { value: stats.currentStreak, label: copy.currentStreak },
    { value: stats.maxStreak,     label: copy.maxStreak },
  ]

  return (
    <View
      className="flex-row flex-wrap rounded-xl overflow-hidden"
      style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
    >
      {items.map((item, idx) => (
        <View
          key={idx}
          style={{
            width: '50%',
            borderRightWidth: idx % 2 === 0 ? 1 : 0,
            borderBottomWidth: idx < 2 ? 1 : 0,
            borderColor: Colors.border,
          }}
        >
          <AnimatedStat value={item.value} label={item.label} />
        </View>
      ))}
    </View>
  )
}
