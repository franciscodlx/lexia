import { useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Language } from '@/types'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const NOTIFICATION_TEXTS: Record<Language, { title: string; body: string }> = {
  es: {
    title: '¡Tu palabra del día te espera! 📝',
    body: 'Abre Lexia y demuestra que eres el mejor en palabras.',
  },
  en: {
    title: "Your daily word is waiting! 📝",
    body: 'Open Lexia and show off your vocabulary skills.',
  },
}

export function useNotifications() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existing } = await Notifications.getPermissionsAsync()
    if (existing === 'granted') return true
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  }, [])

  const scheduleDailyReminder = useCallback(
    async (language: Language, enabled: boolean) => {
      await Notifications.cancelAllScheduledNotificationsAsync()

      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.NOTIFICATIONS_ENABLED,
        JSON.stringify(enabled)
      )

      if (!enabled) return

      const granted = await requestPermissions()
      if (!granted) return

      const { title, body } = NOTIFICATION_TEXTS[language]

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      })
    },
    [requestPermissions]
  )

  const isNotificationsEnabled = useCallback(async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.NOTIFICATIONS_ENABLED)
    return val ? JSON.parse(val) : false
  }, [])

  return { requestPermissions, scheduleDailyReminder, isNotificationsEnabled }
}
