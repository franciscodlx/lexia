export type Language = 'es' | 'en'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface LetterCell {
  letter: string
  status: LetterStatus
}

export interface GameState {
  board: LetterCell[][]
  currentRow: number
  currentCol: number
  gameStatus: GameStatus
  targetWord: string
  language: Language
  hints: number
  usedLetters: Record<string, LetterStatus>
  message: string | null
}

export interface UserProfile {
  id: string
  username: string
  avatarUrl: string | null
  language: Language
  isPremium: boolean
  createdAt: string
}

export interface PlayerStats {
  userId: string
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  lastPlayedAt: string | null
  guessDistribution: Record<string, number>
}

export interface AIWordResult {
  word: string
  definition: string
  hint: string
}

export interface DifficultyConfig {
  key: Difficulty
  label: Record<Language, string>
  description: Record<Language, string>
  emoji: string
  color: string
  maxHints: number
  timeLimit: number | null
}

export interface ThemeOption {
  key: string
  label: Record<Language, string>
  emoji: string
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  profile: UserProfile | null
  stats: PlayerStats | null
}

export type RegistrationPromptReason = 'suggestion' | 'required'

export interface GameResult {
  word: string
  guesses: number | null
  won: boolean
  language: Language
  difficulty?: Difficulty
  isAIMode: boolean
  playedAt: string
}
