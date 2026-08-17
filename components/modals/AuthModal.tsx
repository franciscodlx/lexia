import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Language, RegistrationPromptReason } from '@/types'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'

interface Props {
  visible: boolean
  reason: RegistrationPromptReason
  language: Language
  onDismiss?: () => void
}

type AuthMode = 'signin' | 'signup'

export function AuthModal({ visible, reason, language, onDismiss }: Props) {
  const copy = COPY[language]
  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDismissable = reason === 'suggestion'

  const handleDismiss = () => {
    if (isDismissable) onDismiss?.()
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, username.trim())
      } else {
        await signInWithEmail(email.trim(), password)
      }
      onDismiss?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleApple = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithApple()
      onDismiss?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      onDismiss?.()
    } catch (e) {
      // Silent if Play Services unavailable (Huawei)
      if (!(e instanceof Error && e.message.includes('not available'))) {
        setError(e instanceof Error ? e.message : copy.common.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDismiss}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={handleDismiss}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable onPress={() => {}}>
            <View
              className="rounded-t-3xl px-6 pt-4 pb-8 gap-5"
              style={{ backgroundColor: Colors.surface }}
            >
              {/* Handle + close */}
              <View className="items-center">
                <View
                  className="w-10 h-1 rounded-full mb-3"
                  style={{ backgroundColor: Colors.border }}
                />
                {isDismissable && (
                  <Pressable
                    onPress={handleDismiss}
                    className="absolute right-0 top-0 p-1"
                  >
                    <Text className="text-xl" style={{ color: Colors.textMuted }}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Title */}
              <View className="gap-1">
                <Text className="text-white text-xl font-bold text-center">
                  {reason === 'suggestion'
                    ? copy.auth.suggestionTitle
                    : copy.auth.requiredTitle}
                </Text>
                <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
                  {reason === 'suggestion'
                    ? copy.auth.suggestionBody
                    : copy.auth.requiredBody}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  {/* Social buttons */}
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={handleApple}
                      disabled={loading}
                      className="flex-row items-center justify-center gap-3 py-3 rounded-xl"
                      style={{ backgroundColor: '#000', opacity: loading ? 0.6 : 1 }}
                    >
                      <Text className="text-white font-bold text-base">
                        {copy.auth.continueWithApple}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={handleGoogle}
                    disabled={loading}
                    className="flex-row items-center justify-center gap-3 py-3 rounded-xl"
                    style={{
                      backgroundColor: Colors.background,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    <Text className="text-white font-bold text-base">
                      {copy.auth.continueWithGoogle}
                    </Text>
                  </Pressable>

                  {/* Divider */}
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-px" style={{ backgroundColor: Colors.border }} />
                    <Text className="text-xs" style={{ color: Colors.textMuted }}>
                      {copy.auth.orContinueWith}
                    </Text>
                    <View className="flex-1 h-px" style={{ backgroundColor: Colors.border }} />
                  </View>

                  {/* Email form */}
                  {mode === 'signup' && (
                    <Input
                      label={copy.auth.username}
                      placeholder={copy.auth.username}
                      value={username}
                      onChangeText={setUsername}
                    />
                  )}
                  <Input
                    label={copy.auth.email}
                    placeholder={copy.auth.email}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />
                  <Input
                    label={copy.auth.password}
                    placeholder={copy.auth.password}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    secureToggle
                  />

                  {error && (
                    <Text className="text-xs text-center" style={{ color: Colors.error }}>
                      {error}
                    </Text>
                  )}

                  <Button
                    label={mode === 'signup' ? copy.auth.signUp : copy.auth.signIn}
                    onPress={handleSubmit}
                    loading={loading}
                    size="lg"
                  />

                  {/* Toggle mode */}
                  <Pressable onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}>
                    <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
                      {mode === 'signin'
                        ? copy.auth.dontHaveAccount
                        : copy.auth.alreadyHaveAccount}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
