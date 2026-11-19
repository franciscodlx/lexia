import { View, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { DailyGame } from '@/screens/DailyScreen'
import { AIMode } from '@/screens/AIScreen'
import { StatsScreen } from '@/screens/StatsScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'
import { Paywall } from '@/screens/PaywallScreen'
import { useUserStore } from '@/store/userStore'
import { Colors } from '@/constants/colors'
import type { RootStackParamList, TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

function AITabIcon({ focused }: { focused: boolean }) {
  const isPremium = useUserStore((s) => s.isPremium)
  return (
    <View className="items-center">
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🤖</Text>
      {!isPremium && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -10,
            backgroundColor: Colors.premium,
            borderRadius: 99,
            paddingHorizontal: 4,
            paddingVertical: 1,
          }}
        >
          <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold' }}>PRO</Text>
        </View>
      )}
    </View>
  )
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.correct,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tab.Screen
        name="Daily"
        component={DailyGame}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" focused={focused} /> }}
      />
      <Tab.Screen
        name="AI"
        component={AIMode}
        options={{ tabBarIcon: ({ focused }) => <AITabIcon focused={focused} /> }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}
    >
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Paywall" component={Paywall} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  )
}
