import { trigger } from 'react-native-haptic-feedback'

type HapticKind = 'light' | 'medium' | 'success' | 'warning' | 'error'

const MAP = {
  light: 'impactLight',
  medium: 'impactMedium',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
} as const

/** Fire-and-forget haptic feedback; never throws. */
export function haptic(kind: HapticKind): void {
  try {
    trigger(MAP[kind], { enableVibrateFallback: false, ignoreAndroidSystemSettings: false })
  } catch {
    // Haptics are cosmetic
  }
}
