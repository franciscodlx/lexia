import { useGameStore } from '@/store/gameStore'
import { createEmptyBoard, getTodayString } from '@/lib/utils'
import type { DailyResult } from '@/types'

function result(overrides: Partial<DailyResult> = {}): DailyResult {
  return {
    date: getTodayString(),
    language: 'es',
    word: 'GATOS',
    board: createEmptyBoard(),
    won: true,
    guesses: 3,
    ...overrides,
  }
}

beforeEach(() => {
  useGameStore.setState({
    localStats: {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedAt: null,
      guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 },
    },
    dailyResults: {},
  })
})

describe('gameStore.recordDailyResult', () => {
  it('stores the result per language and updates guest stats', () => {
    useGameStore.getState().recordDailyResult(result())
    const { localStats, dailyResults } = useGameStore.getState()
    expect(dailyResults.es?.word).toBe('GATOS')
    expect(dailyResults.en).toBeUndefined()
    expect(localStats.gamesPlayed).toBe(1)
    expect(localStats.gamesWon).toBe(1)
    expect(localStats.currentStreak).toBe(1)
    expect(localStats.guessDistribution['3']).toBe(1)
  })

  it('continues the streak from yesterday and resets it on a loss', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    useGameStore.setState((s) => ({ localStats: { ...s.localStats, currentStreak: 4, maxStreak: 4, lastPlayedAt: y } }))

    useGameStore.getState().recordDailyResult(result())
    expect(useGameStore.getState().localStats.currentStreak).toBe(5)
    expect(useGameStore.getState().localStats.maxStreak).toBe(5)

    useGameStore.getState().recordDailyResult(result({ language: 'en', won: false, guesses: 6 }))
    expect(useGameStore.getState().localStats.currentStreak).toBe(0)
    expect(useGameStore.getState().localStats.maxStreak).toBe(5)
  })
})
