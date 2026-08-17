import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import Purchases from 'react-native-purchases'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

const RC_KEY =
  Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '')

let rcInitialized = false

export default function RootLayout() {
  const { clearUser } = useUserStore()

  useEffect(() => {
    // Init RevenueCat once
    if (!rcInitialized && RC_KEY) {
      Purchases.configure({ apiKey: RC_KEY })
      rcInitialized = true
    }

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') clearUser()
      }
    )

    return () => subscription.unsubscribe()
  }, [clearUser])

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </SafeAreaProvider>
  )
}
