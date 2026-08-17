import { View, Text, Pressable, useWindowDimensions } from 'react-native'
import type { Language, LetterStatus } from '@/types'
import { KEYBOARDS } from '@/constants/config'
import { Colors } from '@/constants/colors'

interface Props {
  language: Language
  usedLetters: Record<string, LetterStatus>
  onKey: (key: string) => void
  disabled?: boolean
}

const KEY_GAP = 5

function getKeyColors(status: LetterStatus | undefined): {
  bg: string
  text: string
} {
  switch (status) {
    case 'correct':
      return { bg: Colors.correct, text: Colors.text }
    case 'present':
      return { bg: Colors.present, text: Colors.text }
    case 'absent':
      return { bg: Colors.absent, text: Colors.textMuted }
    default:
      return { bg: '#818384', text: Colors.text }
  }
}

export function GameKeyboard({ language, usedLetters, onKey, disabled = false }: Props) {
  const { width } = useWindowDimensions()
  const rows = KEYBOARDS[language]

  // Calculate key width based on the longest row (10 keys)
  const maxKeysInRow = 10
  const totalGap = KEY_GAP * (maxKeysInRow - 1)
  const horizontalPadding = 8
  const keyWidth = Math.floor((width - totalGap - horizontalPadding * 2) / maxKeysInRow)
  const keyHeight = Math.floor(keyWidth * 1.5)
  const wideKeyWidth = Math.floor(keyWidth * 1.5)
  const fontSize = Math.floor(keyWidth * 0.38)

  return (
    <View className="px-2 pb-4" style={{ gap: KEY_GAP }}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row justify-center" style={{ gap: KEY_GAP }}>
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === '⌫'
            const { bg, text } = getKeyColors(usedLetters[key])

            return (
              <Pressable
                key={key}
                onPress={() => !disabled && onKey(key)}
                style={({ pressed }) => ({
                  width: isWide ? wideKeyWidth : keyWidth,
                  height: keyHeight,
                  backgroundColor: bg,
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed || disabled ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: isWide ? fontSize * 0.75 : fontSize,
                    fontWeight: 'bold',
                  }}
                  numberOfLines={1}
                >
                  {key}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}
