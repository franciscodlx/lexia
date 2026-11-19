import { useCallback } from 'react'
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Language } from '@/types'
import { ASYNC_STORAGE_KEYS } from '@/constants/config'
import { COPY } from '@/constants/copy'

const REMINDER_ID = 'lexia-daily-reminder'
const CHANNEL_ID = 'daily-reminder'
const REMINDER_HOUR = 9

/** Next 9:00 local time (today if still ahead, otherwise tomorrow). */
function nextReminderTimestamp(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(REMINDER_HOUR, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime()
}

export function useNotifications() {
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const settings = await notifee.requestPermission()
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
  }, [])

  /** Schedules (or cancels) the 9:00 local reminder. Resolves to whether it ended up enabled. */
  const scheduleDailyReminder = useCallback(
    async (language: Language, enabled: boolean): Promise<boolean> => {
      await notifee.cancelTriggerNotification(REMINDER_ID)

      const granted = enabled ? await requestPermissions() : false
      await AsyncStorage.setItem(ASYNC_STORAGE_KEYS.NOTIFICATIONS_ENABLED, JSON.stringify(granted))
      if (!granted) return false

      const { title, body } = COPY[language].notifications
      const channelId = await notifee.createChannel({
        id: CHANNEL_ID,
        name: title,
        importance: AndroidImportance.DEFAULT,
      })

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: nextReminderTimestamp(),
        repeatFrequency: RepeatFrequency.DAILY,
      }
      await notifee.createTriggerNotification(
        { id: REMINDER_ID, title, body, android: { channelId, pressAction: { id: 'default' } } },
        trigger
      )
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
