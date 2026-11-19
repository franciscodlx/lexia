import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { usePremium } from '@/hooks/usePremium'
import { useLanguage } from '@/store/gameStore'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

export default function Paywall() {
  const language: Language = useLanguage()
  const copy = COPY[language]

  const { offerings, isLoading, isPremium, error, loadOfferings, purchase, restore } = usePremium()
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    loadOfferings()
  }, [loadOfferings])

  // Close as soon as premium is active (purchase, restore or listener)
  useEffect(() => {
    if (isPremium && router.canGoBack()) router.back()
  }, [isPremium])

  const handleRestore = async () => {
    setNotice(null)
    const ok = await restore()
    if (!ok) setNotice(copy.profile.noPurchases)
  }

  const benefits = [
    copy.paywall.benefit1,
    copy.paywall.benefit2,
    copy.paywall.benefit3,
    copy.paywall.benefit4,
  ]

  const packages = offerings?.availablePackages ?? []

  if (isPremium) return null

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-14 right-5 z-10 p-2"
      >
        <Text className="text-xl" style={{ color: Colors.textMuted }}>✕</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 48, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="items-center gap-3 mb-8">
          <Text className="text-5xl">⭐</Text>
          <Text className="text-white text-3xl font-bold text-center">{copy.paywall.title}</Text>
          <Text className="text-center text-base" style={{ color: Colors.textMuted }}>
            {copy.paywall.subtitle}
          </Text>
        </View>

        {/* Benefits */}
        <View
          className="rounded-2xl p-5 mb-8 gap-3"
          style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
        >
          {benefits.map((benefit, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Text className="text-base">{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Purchase options */}
        {isLoading ? (
          <ActivityIndicator color={Colors.correct} size="large" />
        ) : packages.length > 0 ? (
          <View className="gap-3">
            {packages.map((pkg) => (
              <Pressable
                key={pkg.identifier}
                onPress={async () => {
                  setNotice(null)
                  const ok = await purchase(pkg)
                  if (!ok) setNotice(copy.paywall.purchaseFailed)
                }}
                disabled={isLoading}
                style={{
                  backgroundColor:
                    pkg.packageType === 'LIFETIME' ? Colors.premium : Colors.surface,
                  borderWidth: 2,
                  borderColor:
                    pkg.packageType === 'LIFETIME' ? Colors.premium : Colors.border,
                  borderRadius: 16,
                  padding: 18,
                  alignItems: 'center',
                  opacity: 1,
                }}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: pkg.packageType === 'LIFETIME' ? '#000' : Colors.text }}
                >
                  {pkg.packageType === 'LIFETIME'
                    ? copy.paywall.lifetime
                    : copy.paywall.monthly}
                </Text>
                <Text
                  className="text-sm mt-1"
                  style={{ color: pkg.packageType === 'LIFETIME' ? '#000' : Colors.textMuted }}
                >
                  {pkg.product.priceString}
                </Text>
                {pkg.packageType === 'LIFETIME' && (
                  <Text
                    className="text-xs mt-1"
                    style={{ color: '#000', opacity: 0.7 }}
                  >
                    {copy.paywall.noAutoRenew}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          // RevenueCat not configured / no offering yet
          <View className="gap-3" style={{ opacity: 0.5 }}>
            <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
              {copy.paywall.notAvailable}
            </Text>
            <View
              className="rounded-2xl p-5 items-center"
              style={{ backgroundColor: Colors.premium, opacity: 0.9 }}
            >
              <Text className="text-lg font-bold" style={{ color: '#000' }}>
                {copy.paywall.lifetime}
              </Text>
            </View>
            <View
              className="rounded-2xl p-5 items-center"
              style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text className="text-base text-white">{copy.paywall.monthly}</Text>
            </View>
          </View>
        )}

        {/* Restore */}
        {notice && error !== 'not_configured' ? (
          <Text className="text-center text-sm mt-4" style={{ color: Colors.error }}>
            {notice}
          </Text>
        ) : null}

        <Pressable onPress={handleRestore} className="items-center mt-6 py-2">
          <Text className="text-sm" style={{ color: Colors.textMuted }}>
            {copy.paywall.restore}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
