import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { useUserStore } from '@/store/userStore'
import { Colors } from '@/constants/colors'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  )
}

function AITabIcon({ focused }: { focused: boolean }) {
  const { isPremium } = useUserStore()
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

export default function TabsLayout() {
  return (
    <Tabs
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: ({ focused }) => <AITabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
