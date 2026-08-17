import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { StatsGrid } from '@/components/profile/StatsGrid'
import { GuessDistribution } from '@/components/profile/GuessDistribution'
import { AuthModal } from '@/components/modals/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { COPY } from '@/constants/copy'
import { Colors } from '@/constants/colors'
import type { Language } from '@/types'

interface GameRecord {
  id: string
  word: string
  guesses: number | null
  won: boolean
  language: Language
  played_at: string
  is_ai_mode: boolean
}

export default function StatsScreen() {
  const { isAuthenticated, profile, stats, winRate } = useAuth()
  const [history, setHistory] = useState<GameRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const language: Language = profile?.language ?? 'es'
  const copy = COPY[language]

  useEffect(() => {
    if (!isAuthenticated || !profile) return
    const loadHistory = async () => {
      setLoadingHistory(true)
      const { data } = await supabase
        .from('game_history')
        .select('id, word, guesses, won, language, played_at, is_ai_mode')
        .eq('user_id', profile.id)
        .order('played_at', { ascending: false })
        .limit(10)
      if (data) setHistory(data as GameRecord[])
      setLoadingHistory(false)
    }
    loadHistory()
  }, [isAuthenticated, profile])

  // Not authenticated — local stats placeholder + CTA
  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-6 px-8" style={{ backgroundColor: Colors.background }}>
        <Text className="text-5xl">📊</Text>
        <Text className="text-white text-xl font-bold text-center">{copy.stats.title}</Text>
        <Text className="text-center text-sm" style={{ color: Colors.textMuted }}>
          {copy.stats.signInForCloud}
        </Text>
        <Pressable
          onPress={() => setShowAuthModal(true)}
          className="px-8 py-3 rounded-xl"
          style={{ backgroundColor: Colors.correct }}
        >
          <Text className="text-white font-bold text-base">{copy.auth.signIn}</Text>
        </Pressable>

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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        {profile && <ProfileHeader profile={profile} stats={stats} />}

        <View className="px-4 gap-5">
          {/* Stats grid */}
          {stats ? (
            <>
              <StatsGrid stats={stats} language={language} winRate={winRate} />
              <GuessDistribution stats={stats} language={language} />
            </>
          ) : (
            <Text className="text-center text-sm py-8" style={{ color: Colors.textMuted }}>
              {copy.stats.noStats}
            </Text>
          )}

          {/* Game history */}
          <View className="gap-3">
            <Text className="text-white font-bold text-base">
              {language === 'es' ? 'Últimas partidas' : 'Recent games'}
            </Text>

            {loadingHistory ? (
              <ActivityIndicator color={Colors.correct} />
            ) : history.length === 0 ? (
              <Text className="text-sm" style={{ color: Colors.textMuted }}>
                {copy.stats.noStats}
              </Text>
            ) : (
              history.map((game) => (
                <View
                  key={game.id}
                  className="flex-row items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{game.won ? '🟩' : '⬛'}</Text>
                    <View>
                      <Text className="text-white font-bold tracking-widest">{game.word}</Text>
                      <Text className="text-xs" style={{ color: Colors.textMuted }}>
                        {game.is_ai_mode ? '🤖 ' : ''}
                        {new Date(game.played_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="font-bold text-base"
                    style={{ color: game.won ? Colors.correct : Colors.textMuted }}
                  >
                    {game.won ? `${game.guesses}/6` : 'X/6'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
