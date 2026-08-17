import { useState, useCallback } from 'react'
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native'
import { router } from 'expo-router'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AuthModal } from '@/components/modals/AuthModal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { useNotifications } from '@/hooks/useNotifications'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

export default function ProfileScreen() {
  const { isAuthenticated, profile, stats, winRate, updateProfile, signOut } = useAuth()
  const { isPremium, restore, isLoading: premiumLoading } = usePremium()
  const { scheduleDailyReminder, isNotificationsEnabled } = useNotifications()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(false)

  const language: Language = profile?.language ?? 'es'
  const copy = COPY[language]

  // Load notifications state on mount
  useState(() => {
    isNotificationsEnabled().then(setNotificationsOn)
  })

  const handleSaveUsername = useCallback(async () => {
    if (!usernameInput.trim()) return
    setSavingUsername(true)
    try {
      await updateProfile({ username: usernameInput.trim() })
      setEditingUsername(false)
    } catch {
      // error handled silently — user stays on edit mode
    } finally {
      setSavingUsername(false)
    }
  }, [updateProfile, usernameInput])

  const handleLanguageChange = useCallback(
    async (lang: Language) => {
      await updateProfile({ language: lang })
    },
    [updateProfile]
  )

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      setNotificationsOn(value)
      await scheduleDailyReminder(language, value)
    },
    [language, scheduleDailyReminder]
  )

  const handleSignOut = useCallback(() => {
    Alert.alert(
      copy.auth.signOut,
      '',
      [
        { text: copy.profile.cancel, style: 'cancel' },
        { text: copy.auth.signOut, style: 'destructive', onPress: signOut },
      ]
    )
  }, [copy, signOut])

  const handleRestore = useCallback(async () => {
    const ok = await restore()
    Alert.alert(
      copy.common.ok,
      ok
        ? (language === 'es' ? '¡Compras restauradas!' : 'Purchases restored!')
        : (language === 'es' ? 'No se encontraron compras.' : 'No purchases found.')
    )
  }, [copy, language, restore])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      copy.profile.deleteAccount,
      copy.profile.deleteConfirm,
      [
        { text: copy.profile.cancel, style: 'cancel' },
        {
          text: copy.profile.deleteAccount,
          style: 'destructive',
          onPress: async () => {
            // Supabase doesn't expose a deleteUser from client — guide user
            Alert.alert(
              language === 'es' ? 'Contacta soporte' : 'Contact support',
              language === 'es'
                ? 'Envía un correo a soporte@lexia.app para eliminar tu cuenta.'
                : 'Send an email to support@lexia.app to delete your account.'
            )
          },
        },
      ]
    )
  }, [copy, language])

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">👤</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.profile.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.auth.suggestionBody}
        </Text>
        <Button
          label={copy.auth.signIn}
          onPress={() => setShowAuthModal(true)}
          size="lg"
        />
        <AuthModal
          visible={showAuthModal}
          reason="suggestion"
          language={language}
          onDismiss={() => setShowAuthModal(false)}
        />
      </View>
    )
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        {profile && <ProfileHeader profile={profile} stats={stats} />}

        <View className="px-4 gap-4">
          {/* Username */}
          <SectionCard>
            <SectionTitle label={copy.profile.editUsername} />
            {editingUsername ? (
              <View className="gap-3">
                <Input
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  placeholder={profile?.username ?? ''}
                  autoFocus
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button label={copy.profile.cancel} onPress={() => setEditingUsername(false)} variant="ghost" />
                  </View>
                  <View className="flex-1">
                    <Button label={copy.profile.save} onPress={handleSaveUsername} loading={savingUsername} />
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => { setUsernameInput(profile?.username ?? ''); setEditingUsername(true) }}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-white text-base">{profile?.username}</Text>
                <Text style={{ color: Colors.textMuted }}>✏️</Text>
              </Pressable>
            )}
          </SectionCard>

          {/* Language */}
          <SectionCard>
            <SectionTitle label={copy.profile.language} />
            <View className="flex-row gap-3 mt-1">
              {(['es', 'en'] as Language[]).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => handleLanguageChange(lang)}
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{
                    backgroundColor: profile?.language === lang ? Colors.correct : Colors.background,
                    borderWidth: 1,
                    borderColor: profile?.language === lang ? Colors.correct : Colors.border,
                  }}
                >
                  <Text className="text-white font-bold uppercase">{lang}</Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>

          {/* Notifications */}
          <SectionCard>
            <View className="flex-row items-center justify-between">
              <SectionTitle label={copy.profile.notifications} />
              <Switch
                value={notificationsOn}
                onValueChange={handleNotificationsToggle}
                trackColor={{ true: Colors.correct, false: Colors.border }}
                thumbColor={Colors.text}
              />
            </View>
          </SectionCard>

          {/* Premium */}
          <SectionCard>
            <SectionTitle label={copy.profile.premium} />
            {isPremium ? (
              <Text className="text-sm mt-1" style={{ color: Colors.correct }}>
                {language === 'es' ? '✓ Premium activo' : '✓ Premium active'}
              </Text>
            ) : (
              <View className="gap-2 mt-2">
                <Button
                  label={copy.paywall.lifetime}
                  onPress={() => router.push('/paywall')}
                  color={Colors.premium}
                />
              </View>
            )}
            <Pressable onPress={handleRestore} className="mt-3">
              <Text className="text-sm" style={{ color: Colors.textMuted }}>
                {copy.profile.restorePurchases}
              </Text>
            </Pressable>
          </SectionCard>

          {/* Sign out + Delete */}
          <View className="gap-3 mt-2">
            <Button label={copy.auth.signOut} onPress={handleSignOut} variant="secondary" size="lg" />
            <Pressable onPress={handleDeleteAccount} className="items-center py-2">
              <Text className="text-sm" style={{ color: Colors.error }}>
                {copy.profile.deleteAccount}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="rounded-xl px-4 py-4"
      style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
    >
      {children}
    </View>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <Text className="text-xs font-bold uppercase mb-1" style={{ color: Colors.textMuted }}>
      {label}
    </Text>
  )
}
