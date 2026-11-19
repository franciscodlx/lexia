import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useUserStore } from '@/store/userStore'
import type { UserProfile, LocalStats } from '@/types'
import { Colors } from '@/constants/colors'

interface Props {
  profile: UserProfile
  stats: LocalStats | null
  /** When set, the avatar is tappable (e.g. to change the photo) */
  onAvatarPress?: () => void
  avatarLabel?: string
  avatarLoading?: boolean
}

export function ProfileHeader({ profile, stats, onAvatarPress, avatarLabel, avatarLoading = false }: Props) {
  // RevenueCat (store) is the source of truth for premium, not the DB column
  const isPremium = useUserStore((s) => s.isPremium)

  const avatar = <Avatar uri={profile.avatarUrl} name={profile.username} size={80} />

  return (
    <View className="items-center gap-3 py-6">
      {onAvatarPress ? (
        <Pressable
          onPress={onAvatarPress}
          disabled={avatarLoading}
          accessibilityRole="button"
          accessibilityLabel={avatarLabel}
          className="items-center gap-1 active:opacity-70"
        >
          <View>
            {avatar}
            {avatarLoading && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/50">
                <ActivityIndicator color={Colors.text} />
              </View>
            )}
          </View>
          {avatarLabel ? (
            <Text className="text-xs" style={{ color: Colors.textMuted }}>
              {avatarLabel}
            </Text>
          ) : null}
        </Pressable>
      ) : (
        avatar
      )}

      <View className="items-center gap-1.5">
        <Text className="text-white text-xl font-bold">{profile.username}</Text>

        <View className="flex-row items-center gap-2">
          {stats && stats.currentStreak > 0 && (
            <Badge label={`🔥 ${stats.currentStreak}`} color={Colors.surface} size="md" />
          )}
          {isPremium && <Badge label="PRO" color={Colors.premium} size="md" />}
        </View>
      </View>
    </View>
  )
}
