import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated'
import { Text } from 'react-native'
import type { LetterCell } from '@/types'
import { Colors } from '@/constants/colors'

interface Props {
  cell: LetterCell
  size: number
  shakeValue: SharedValue<number>
  flipValue: SharedValue<number>
}

function getCellColors(status: LetterCell['status']): {
  bg: string
  border: string
  text: string
} {
  switch (status) {
    case 'correct':
      return { bg: Colors.correct, border: Colors.correct, text: Colors.text }
    case 'present':
      return { bg: Colors.present, border: Colors.present, text: Colors.text }
    case 'absent':
      return { bg: Colors.absent, border: Colors.absent, text: Colors.text }
    case 'tbd':
      return { bg: Colors.surface, border: Colors.borderActive, text: Colors.text }
    default:
      return { bg: Colors.surface, border: Colors.border, text: Colors.text }
  }
}

export function GameCell({ cell, size, shakeValue, flipValue }: Props) {
  const { bg, border, text } = getCellColors(cell.status)

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }))

  const flipStyle = useAnimatedStyle(() => {
    // 0→1: front face flips away; 1→2: back face flips in
    const rotation = interpolate(flipValue.value, [0, 1, 2], [0, 90, 0])
    const scale = interpolate(flipValue.value, [0, 0.5, 1, 1.5, 2], [1, 0.95, 0.95, 0.95, 1])
    return {
      transform: [{ rotateX: `${rotation}deg` }, { scale }],
    }
  })

  const scaleStyle = useAnimatedStyle(() => {
    // Slight pop when a letter is typed (tbd status + has letter)
    const scale = cell.letter && cell.status === 'tbd' ? 1 : 1
    return { transform: [{ scale }] }
  })

  const fontSize = size * 0.45

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 2,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
        },
        shakeStyle,
        flipStyle,
        scaleStyle,
      ]}
    >
      <Text
        style={{
          color: text,
          fontSize,
          fontWeight: 'bold',
          letterSpacing: 1,
        }}
      >
        {cell.letter}
      </Text>
    </Animated.View>
  )
}
