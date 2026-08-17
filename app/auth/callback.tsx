import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams<{ code?: string }>()

  useEffect(() => {
    const handle = async () => {
      try {
        if (params.code) {
          await supabase.auth.exchangeCodeForSession(params.code)
        }
      } catch {
        // Ignore — redirect regardless
      } finally {
        router.replace('/(tabs)')
      }
    }
    handle()
  }, [params.code, router])

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background }}>
      <ActivityIndicator color={Colors.correct} size="large" />
    </View>
  )
}
