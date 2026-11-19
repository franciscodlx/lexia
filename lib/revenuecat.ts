import { Platform } from 'react-native'
import Purchases from 'react-native-purchases'

const RC_KEY =
  Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '')

/** Entitlement ID configured in RevenueCat → Entitlements. */
export const PREMIUM_ENTITLEMENT = 'premium'

let configured = false

/** Configures the SDK once. Returns false when no key is set (premium stays off). */
export function initRevenueCat(): boolean {
  if (configured) return true
  if (!RC_KEY || RC_KEY.includes('XXXX')) return false
  try {
    Purchases.configure({ apiKey: RC_KEY })
    configured = true
  } catch (e) {
    console.warn('[Lexia] RevenueCat configure failed', e)
  }
  return configured
}

export function isRevenueCatConfigured(): boolean {
  return configured
}
