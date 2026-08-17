import { useEffect } from 'react'
import { Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated'

interface Props {
  message: string | null
}

export function GameToast({ message }: Props) {
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (message) {
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 300 })
      )
    } else {
      opacity.value = 0
    }
  }, [message, opacity])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  if (!message) return null

  return (
    <Animated.View
      style={[animStyle]}
      className="absolute top-4 self-center bg-white rounded-lg px-5 py-2.5 z-50"
    >
      <Text className="text-black font-bold text-sm">{message}</Text>
    </Animated.View>
  )
}
