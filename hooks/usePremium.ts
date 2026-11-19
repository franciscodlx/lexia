import { useState, useEffect, useCallback } from 'react'
import Purchases, {
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases'
import { Platform } from 'react-native'
import { useUserStore } from '@/store/userStore'

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? ''
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? ''

let rcInitialized = false

function initRevenueCat() {
  if (rcInitialized) return
  const key = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY
  if (!key) return
  Purchases.configure({ apiKey: key })
  rcInitialized = true
}

export function usePremium() {
  const { isPremium, setIsPremium, profile } = useUserStore()
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profileId = profile?.id ?? null

  const checkStatus = useCallback(async () => {
    try {
      initRevenueCat()
      if (profileId) {
        await Purchases.logIn(profileId)
      }
      const info = await Purchases.getCustomerInfo()
      const active = info.entitlements.active['premium'] !== undefined
      setIsPremium(active)
    } catch {
      // Fail silently — user stays non-premium
    }
  }, [profileId, setIsPremium])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const loadOfferings = useCallback(async () => {
    try {
      setIsLoading(true)
      initRevenueCat()
      const res = await Purchases.getOfferings()
      setOfferings(res.current)
    } catch {
      setError('Could not load offerings')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true)
      setError(null)
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      const active = customerInfo.entitlements.active['premium'] !== undefined
      setIsPremium(active)
      return active
    } catch (e: unknown) {
      if ((e as { userCancelled?: boolean }).userCancelled) return false
      setError('Purchase failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setIsPremium])

  const restore = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const info = await Purchases.restorePurchases()
      const active = info.entitlements.active['premium'] !== undefined
      setIsPremium(active)
      return active
    } catch {
      setError('Restore failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setIsPremium])

  return {
    isPremium,
    offerings,
    isLoading,
    error,
    checkStatus,
    loadOfferings,
    purchase,
    restore,
  }
}
