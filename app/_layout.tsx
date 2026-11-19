import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthBootstrap } from '@/hooks/useAuth'
import { Colors } from '@/constants/colors'

export default function RootLayout() {
  // Single owner of the Supabase session listener + RevenueCat identity
  useAuthBootstrap()

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </SafeAreaProvider>
  )
}
