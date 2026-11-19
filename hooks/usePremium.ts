import { useState, useCallback } from 'react'
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases'
import { useUserStore } from '@/store/userStore'
import { initRevenueCat, PREMIUM_ENTITLEMENT } from '@/lib/revenuecat'

export function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined
}

/**
 * Premium state + purchase actions. The status itself is kept in sync by the
 * root layout (customer-info listener + logIn/logOut), so this hook never
 * re-identifies the user on mount.
 */
export function usePremium() {
  const isPremium = useUserStore((s) => s.isPremium)
  const setIsPremium = useUserStore((s) => s.setIsPremium)
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    if (!initRevenueCat()) return
    try {
      setIsPremium(hasPremium(await Purchases.getCustomerInfo()))
    } catch (e) {
      console.warn('[Lexia] RevenueCat status failed', e)
    }
  }, [setIsPremium])

  const loadOfferings = useCallback(async () => {
    if (!initRevenueCat()) {
      setError('not_configured')
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const res = await Purchases.getOfferings()
      setOfferings(res.current)
    } catch {
      setError('offerings_failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        setIsLoading(true)
        setError(null)
        const { customerInfo } = await Purchases.purchasePackage(pkg)
        const active = hasPremium(customerInfo)
        setIsPremium(active)
        return active
      } catch (e: unknown) {
        if ((e as { userCancelled?: boolean }).userCancelled) return false
        setError('purchase_failed')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [setIsPremium]
  )

  const restore = useCallback(async () => {
    if (!initRevenueCat()) return false
    try {
      setIsLoading(true)
      setError(null)
      const active = hasPremium(await Purchases.restorePurchases())
      setIsPremium(active)
      return active
    } catch {
      setError('restore_failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [setIsPremium])

  return { isPremium, offerings, isLoading, error, checkStatus, loadOfferings, purchase, restore }
}
