import { Pressable, Text, ActivityIndicator } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  color?: string
}

const VARIANT_STYLES: Record<
  NonNullable<Props['variant']>,
  { bg: string; text: string; border?: string }
> = {
  primary:   { bg: Colors.correct,   text: Colors.text },
  secondary: { bg: Colors.surface,   text: Colors.text, border: Colors.border },
  ghost:     { bg: 'transparent',    text: Colors.textMuted },
  danger:    { bg: Colors.error,     text: Colors.text },
}

const SIZE_STYLES: Record<NonNullable<Props['size']>, { py: number; px: number; fs: number; radius: number }> = {
  sm: { py: 8,  px: 16, fs: 13, radius: 8  },
  md: { py: 12, px: 20, fs: 15, radius: 12 },
  lg: { py: 16, px: 24, fs: 17, radius: 14 },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  color,
}: Props) {
  const vs = VARIANT_STYLES[variant]
  const ss = SIZE_STYLES[size]
  const bg = color ?? vs.bg
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{
        backgroundColor: bg,
        paddingVertical: ss.py,
        paddingHorizontal: ss.px,
        borderRadius: ss.radius,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: vs.border ? 1 : 0,
        borderColor: vs.border,
        opacity: isDisabled ? 0.65 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <Text style={{ color: vs.text, fontSize: ss.fs, fontWeight: 'bold' }}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}
