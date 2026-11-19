import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type TabParamList = {
  Daily: undefined
  AI: undefined
  Stats: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Tabs: undefined
  Paywall: undefined
}

/** Root stack navigation, usable from any screen (tabs bubble up to the stack). */
export function useRootNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>()
}
