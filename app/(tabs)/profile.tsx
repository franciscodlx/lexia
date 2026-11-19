import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AuthModal } from '@/components/modals/AuthModal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { usePremium } from '@/hooks/usePremium'
import { useNotifications } from '@/hooks/useNotifications'
import { useGameStore, useLanguage } from '@/store/gameStore'
import { pickAndUploadAvatar } from '@/lib/avatar'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

export default function ProfileScreen() {
  const { isAuthenticated, profile, stats, updateProfile, signOut, deleteAccount } = useAuth()
  const { isPremium, restore } = usePremium()
  const { scheduleDailyReminder, isNotificationsEnabled } = useNotifications()
  const language = useLanguage()
  const setLanguage = useGameStore((s) => s.setLanguage)

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(false)

  const copy = COPY[language]

  useEffect(() => {
    isNotificationsEnabled()
      .then(setNotificationsOn)
      .catch(() => setNotificationsOn(false))
  }, [isNotificationsEnabled])

  const handleSaveUsername = useCallback(async () => {
    const value = usernameInput.trim()
    if (!value) return
    setSavingUsername(true)
    setUsernameError(null)
    try {
      await updateProfile({ username: value })
      setEditingUsername(false)
    } catch (e) {
      // 23505 = unique_violation on profiles.username
      const code = (e as { code?: string }).code
      setUsernameError(code === '23505' ? copy.profile.usernameTaken : copy.common.error)
    } finally {
      setSavingUsername(false)
    }
  }, [copy, updateProfile, usernameInput])

  const handleAvatar = useCallback(async () => {
    if (!profile) return
    setUploadingAvatar(true)
    try {
      const url = await pickAndUploadAvatar(profile.id)
      if (url) await updateProfile({ avatarUrl: url })
    } catch (e) {
      console.warn('[Lexia] avatar upload failed', e)
      Alert.alert(copy.common.error, copy.profile.avatarFailed)
    } finally {
      setUploadingAvatar(false)
    }
  }, [copy, profile, updateProfile])

  const handleLanguageChange = useCallback(
    async (lang: Language) => {
      setLanguage(lang)
      try {
        if (isAuthenticated) await updateProfile({ language: lang })
        if (notificationsOn) await scheduleDailyReminder(lang, true)
      } catch (e) {
        console.warn('[Lexia] language change failed', e)
      }
    },
    [isAuthenticated, notificationsOn, scheduleDailyReminder, setLanguage, updateProfile]
  )

  const handleNotificationsToggle = useCallback(
    async (value: boolean) => {
      setNotificationsOn(value)
      try {
        const enabled = await scheduleDailyReminder(language, value)
        setNotificationsOn(enabled)
      } catch {
        setNotificationsOn(false)
      }
    },
    [language, scheduleDailyReminder]
  )

  const handleSignOut = useCallback(() => {
    Alert.alert(copy.auth.signOut, '', [
      { text: copy.profile.cancel, style: 'cancel' },
      {
        text: copy.auth.signOut,
        style: 'destructive',
        onPress: () => {
          signOut().catch((e) => console.warn('[Lexia] signOut failed', e))
        },
      },
    ])
  }, [copy, signOut])

  const handleRestore = useCallback(async () => {
    const ok = await restore()
    Alert.alert(copy.common.ok, ok ? copy.profile.purchasesRestored : copy.profile.noPurchases)
  }, [copy, restore])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(copy.profile.deleteAccount, copy.profile.deleteConfirm, [
      { text: copy.profile.cancel, style: 'cancel' },
      {
        text: copy.profile.deleteAccount,
        style: 'destructive',
        onPress: () => {
          deleteAccount().catch((e) => {
            console.warn('[Lexia] deleteAccount failed', e)
            Alert.alert(copy.common.error, copy.profile.deleteFailed)
          })
        },
      },
    ])
  }, [copy, deleteAccount])

  const languageCard = (
    <SectionCard>
      <SectionTitle label={copy.profile.language} />
      <View className="flex-row gap-3 mt-1">
        {(['es', 'en'] as Language[]).map((lang) => (
          <Pressable
            key={lang}
            onPress={() => handleLanguageChange(lang)}
            className="flex-1 py-2.5 rounded-xl items-center"
            style={{
              backgroundColor: language === lang ? Colors.correct : Colors.background,
              borderWidth: 1,
              borderColor: language === lang ? Colors.correct : Colors.border,
            }}
          >
            <Text className="text-white font-bold uppercase">{lang}</Text>
          </Pressable>
        ))}
      </View>
    </SectionCard>
  )

  const notificationsCard = (
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
  )

  // Not authenticated — guests can still set language and reminders
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="items-center gap-4 py-8">
            <Text className="text-5xl">👤</Text>
            <Text className="text-white text-xl font-bold text-center">{copy.profile.title}</Text>
            <Text className="text-center text-sm px-4" style={{ color: Colors.textMuted }}>
              {copy.auth.suggestionBody}
            </Text>
            <Button label={copy.auth.signIn} onPress={() => setShowAuthModal(true)} size="lg" />
          </View>
          {languageCard}
          {notificationsCard}
        </ScrollView>
        <AuthModal
          visible={showAuthModal}
          reason="suggestion"
          language={language}
          onDismiss={() => setShowAuthModal(false)}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {profile && (
          <ProfileHeader
            profile={profile}
            stats={stats}
            onAvatarPress={handleAvatar}
            avatarLabel={copy.profile.changeAvatar}
            avatarLoading={uploadingAvatar}
          />
        )}

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
                  autoCapitalize="none"
                  maxLength={24}
                  error={usernameError ?? undefined}
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
                onPress={() => {
                  setUsernameInput(profile?.username ?? '')
                  setUsernameError(null)
                  setEditingUsername(true)
                }}
                className="flex-row items-center justify-between py-2"
              >
                <Text className="text-white text-base">{profile?.username}</Text>
                <Text style={{ color: Colors.textMuted }}>✏️</Text>
              </Pressable>
            )}
          </SectionCard>

          {languageCard}
          {notificationsCard}

          {/* Premium */}
          <SectionCard>
            <SectionTitle label={copy.profile.premium} />
            {isPremium ? (
              <Text className="text-sm mt-1" style={{ color: Colors.correct }}>
                {copy.profile.premiumActive}
              </Text>
            ) : (
              <View className="gap-2 mt-2">
                <Button label={copy.paywall.lifetime} onPress={() => router.push('/paywall')} color={Colors.premium} />
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
    </SafeAreaView>
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
