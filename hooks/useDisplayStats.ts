import { useUserStore } from '@/store/userStore'
import { useGameStore } from '@/store/gameStore'
import type { LocalStats } from '@/types'

/** Cloud stats when signed in, device stats for guests. */
export function useDisplayStats(): { stats: LocalStats; winRate: number; isCloud: boolean } {
  const cloud = useUserStore((s) => s.stats)
  const isSignedIn = useUserStore((s) => s.profile !== null)
  const local = useGameStore((s) => s.localStats)
  const stats: LocalStats = isSignedIn && cloud ? cloud : local
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
  return { stats, winRate, isCloud: isSignedIn && cloud !== null }
}
