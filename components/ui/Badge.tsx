import { View, Text } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props {
  label: string
  color?: string
  textColor?: string
  size?: 'sm' | 'md'
}

export function Badge({
  label,
  color = Colors.present,
  textColor = Colors.text,
  size = 'sm',
}: Props) {
  const isSm = size === 'sm'

  return (
    <View
      style={{
        backgroundColor: color,
        paddingHorizontal: isSm ? 6 : 10,
        paddingVertical: isSm ? 2 : 4,
        borderRadius: 99,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: isSm ? 10 : 12,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  )
}
