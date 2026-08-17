import { useState } from 'react'
import { TextInput, View, Text, Pressable, type TextInputProps } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props extends TextInputProps {
  label?: string
  error?: string
  secureToggle?: boolean
}

export function Input({ label, error, secureToggle = false, secureTextEntry, ...rest }: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false)

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium" style={{ color: Colors.textMuted }}>
          {label}
        </Text>
      ) : null}

      <View
        className="flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: error ? Colors.error : Colors.border,
          height: 48,
        }}
      >
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          className="flex-1 text-white text-base"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
          autoCorrect={rest.autoCorrect ?? false}
          style={{ flex: 1, color: Colors.text, fontSize: 15 }}
        />
        {secureToggle && (
          <Pressable onPress={() => setHidden((h) => !h)} className="pl-2">
            <Text style={{ color: Colors.textMuted, fontSize: 18 }}>
              {hidden ? '👁' : '🙈'}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="text-xs" style={{ color: Colors.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
