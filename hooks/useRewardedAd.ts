import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads'

const REWARDED_AD_UNIT_ID =
  __DEV__
    ? TestIds.REWARDED
    : Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? TestIds.REWARDED)
    : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ?? TestIds.REWARDED)

export function useRewardedAd() {
  const [isLoaded, setIsLoaded] = useState(false)
  // Loading starts as soon as the mount effect requests the first ad
  const [isLoading, setIsLoading] = useState(true)
  // Bumped when an ad closes so the effect below preloads the next one
  const [reloadKey, setReloadKey] = useState(0)
  const adRef = useRef<RewardedAd | null>(null)
  const resolveRef = useRef<((rewarded: boolean) => void) | null>(null)

  const loadAd = useCallback(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    })

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true)
      setIsLoading(false)
    })

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        resolveRef.current?.(true)
        resolveRef.current = null
      }
    )

    ad.addAdEventListener('closed' as RewardedAdEventType, () => {
      unsubscribeLoaded()
      unsubscribeEarned()
      setIsLoaded(false)
      setIsLoading(true)
      // If reward wasn't earned (user closed early)
      resolveRef.current?.(false)
      resolveRef.current = null
      // Preload next ad
      setReloadKey((k) => k + 1)
    })

    ad.load()
    adRef.current = ad
  }, [])

  useEffect(() => {
    loadAd()
    return () => {
      adRef.current = null
    }
  }, [loadAd, reloadKey])

  const showAd = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!adRef.current || !isLoaded) {
        resolve(false)
        return
      }
      resolveRef.current = resolve
      adRef.current.show().catch(() => {
        resolveRef.current = null
        resolve(false)
      })
    })
  }, [isLoaded])

  return { isLoaded, isLoading, showAd }
}
