import './global.css'
import { StatusBar } from 'react-native'
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { RootNavigator } from '@/navigation/RootNavigator'
import { useAuthBootstrap } from '@/hooks/useAuth'
import { Colors } from '@/constants/colors'

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    border: Colors.border,
    primary: Colors.correct,
    text: Colors.text,
  },
}

export default function App() {
  // Single owner of the Supabase session listener + RevenueCat identity
  useAuthBootstrap()

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
