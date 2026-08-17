import { View, Text, Image } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props {
  uri?: string | null
  name?: string
  size?: number
}

export function Avatar({ uri, name, size = 48 }: Props) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const fontSize = size * 0.38

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Colors.surface,
        }}
      />
    )
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.correct,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: Colors.text, fontSize, fontWeight: 'bold' }}>
        {initials}
      </Text>
    </View>
  )
}
