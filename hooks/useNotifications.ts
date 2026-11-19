import { useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Language } from '@/types'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'
import { COPY } from '@/constants/copy'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function useNotifications() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existing } = await Notifications.getPermissionsAsync()
    if (existing === 'granted') return true
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  }, [])

  /** Schedules (or cancels) the 9:00 reminder. Resolves to whether it ended up enabled. */
  const scheduleDailyReminder = useCallback(
    async (language: Language, enabled: boolean): Promise<boolean> => {
      await Notifications.cancelAllScheduledNotificationsAsync()

      const granted = enabled ? await requestPermissions() : false
      await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.NOTIFICATIONS_ENABLED, JSON.stringify(granted))
      if (!granted) return false

      const { title, body } = COPY[language].notifications

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: false },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      })
      return true
    },
    [requestPermissions]
  )

  const isNotificationsEnabled = useCallback(async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.NOTIFICATIONS_ENABLED)
    return val ? JSON.parse(val) : false
  }, [])

  return { requestPermissions, scheduleDailyReminder, isNotificationsEnabled }
}
