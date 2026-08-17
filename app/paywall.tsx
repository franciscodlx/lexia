import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { usePremium } from '@/hooks/usePremium'
import { useUserStore } from '@/store/userStore'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

export default function Paywall() {
  const { profile } = useUserStore()
  const language: Language = profile?.language ?? 'es'
  const copy = COPY[language]

  const { offerings, isLoading, isPremium, loadOfferings, purchase, restore } = usePremium()

  useEffect(() => {
    loadOfferings()
  }, [loadOfferings])

  const benefits = [
    copy.paywall.benefit1,
    copy.paywall.benefit2,
    copy.paywall.benefit3,
    copy.paywall.benefit4,
  ]

  const packages = offerings?.availablePackages ?? []

  if (isPremium) {
    router.back()
    return null
  }

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
                onPress={() => purchase(pkg)}
                style={({ pressed }) => ({
                  backgroundColor:
                    pkg.packageType === 'LIFETIME' ? Colors.premium : Colors.surface,
                  borderWidth: 2,
                  borderColor:
                    pkg.packageType === 'LIFETIME' ? Colors.premium : Colors.border,
                  borderRadius: 16,
                  padding: 18,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  className="text-lg font-bold"
                  style={{ color: pkg.packageType === 'LIFETIME' ? '#000' : Colors.text }}
                >
                  {pkg.packageType === 'LIFETIME'
                    ? copy.paywall.lifetime
                    : copy.paywall.monthly}
                </Text>
                {pkg.packageType === 'LIFETIME' && (
                  <Text
                    className="text-xs mt-1"
                    style={{ color: '#000', opacity: 0.7 }}
                  >
                    {language === 'es' ? 'Sin renovación automática' : 'No auto-renewal'}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          // Fallback when RevenueCat not configured
          <View className="gap-3">
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
        <Pressable onPress={restore} className="items-center mt-6 py-2">
          <Text className="text-sm" style={{ color: Colors.textMuted }}>
            {copy.paywall.restore}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
