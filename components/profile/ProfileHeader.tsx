import { View, Text } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { UserProfile, PlayerStats } from '@/types'
import { Colors } from '@/constants/colors'

interface Props {
  profile: UserProfile
  stats: PlayerStats | null
}

export function ProfileHeader({ profile, stats }: Props) {
  return (
    <View className="items-center gap-3 py-6">
      <Avatar uri={profile.avatarUrl} name={profile.username} size={80} />

      <View className="items-center gap-1.5">
        <Text className="text-white text-xl font-bold">{profile.username}</Text>

        <View className="flex-row items-center gap-2">
          {stats && stats.currentStreak > 0 && (
            <Badge
              label={`🔥 ${stats.currentStreak}`}
              color={Colors.surface}
              size="md"
            />
          )}
          {profile.isPremium && (
            <Badge label="PRO" color={Colors.premium} size="md" />
          )}
        </View>
      </View>
    </View>
  )
}
