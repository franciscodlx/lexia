import { View, Text, Pressable } from 'react-native'
import { Button } from '@/components/ui/Button'
import { DIFFICULTY_CONFIGS, THEMES } from '@/constants/config'
import { COPY } from '@/constants/copy'
import type { Difficulty, Language } from '@/types'
import { Colors } from '@/constants/colors'

interface Props {
  language: Language
  selectedDifficulty: Difficulty
  selectedTheme: string | undefined
  onDifficultyChange: (d: Difficulty) => void
  onThemeChange: (t: string | undefined) => void
  onPlay: () => void
  loading?: boolean
}

export function DifficultySelector({
  language,
  selectedDifficulty,
  selectedTheme,
  onDifficultyChange,
  onThemeChange,
  onPlay,
  loading = false,
}: Props) {
  const copy = COPY[language].ai
  const activeDiffConfig = DIFFICULTY_CONFIGS.find((d) => d.key === selectedDifficulty)!

  return (
    <View className="gap-5 px-4 py-6">
      {/* Difficulty cards */}
      <View className="gap-2">
        <Text className="text-white font-bold text-base">{copy.selectDifficulty}</Text>
        {DIFFICULTY_CONFIGS.map((config) => {
          const isSelected = selectedDifficulty === config.key
          return (
            <Pressable
              key={config.key}
              onPress={() => onDifficultyChange(config.key)}
              style={{
                backgroundColor: isSelected ? config.color + '22' : Colors.surface,
                borderWidth: 2,
                borderColor: isSelected ? config.color : Colors.border,
                borderRadius: 12,
                padding: 14,
                opacity: 1,
              }}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{config.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    {config.label[language]}
                  </Text>
                  <Text className="text-sm mt-0.5" style={{ color: Colors.textMuted }}>
                    {config.description[language]}
                  </Text>
                </View>
                {isSelected && (
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{ backgroundColor: config.color }}
                  >
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>

      {/* Theme chips */}
      <View className="gap-2">
        <Text className="text-white font-bold text-base">{copy.selectTheme}</Text>
        <View className="flex-row flex-wrap gap-2">
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.key
            return (
              <Pressable
                key={theme.key}
                onPress={() =>
                  onThemeChange(isSelected ? undefined : theme.key)
                }
                style={{
                  backgroundColor: isSelected ? Colors.correct + '33' : Colors.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? Colors.correct : Colors.border,
                  borderRadius: 99,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text>{theme.emoji}</Text>
                <Text
                  style={{
                    color: isSelected ? Colors.text : Colors.textMuted,
                    fontSize: 13,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {theme.label[language]}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Play button */}
      <Button
        label={loading ? copy.generating : copy.play}
        onPress={onPlay}
        loading={loading}
        color={activeDiffConfig.color}
        size="lg"
      />
    </View>
  )
}
