import type { DifficultyConfig, Language, ThemeOption } from '@/types'
import { Colors } from './colors'

export const WORD_LENGTH = 5
export const MAX_ROWS = 6
export const GAMES_BEFORE_SUGGESTION = 5
export const GAMES_BEFORE_REQUIRED = 10

export const KEYBOARDS: Record<Language, string[][]> = {
  es: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ],
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ],
}

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    key: 'easy',
    label: { es: 'Fácil', en: 'Easy' },
    description: { es: 'Palabras comunes, sin límite de tiempo', en: 'Common words, no time limit' },
    emoji: '🟢',
    color: Colors.correct,
    maxHints: 3,
    timeLimit: null,
  },
  {
    key: 'medium',
    label: { es: 'Medio', en: 'Medium' },
    description: { es: 'Vocabulario variado, 5 minutos', en: 'Varied vocabulary, 5 minutes' },
    emoji: '🟡',
    color: Colors.present,
    maxHints: 1,
    timeLimit: 300,
  },
  {
    key: 'hard',
    label: { es: 'Difícil', en: 'Hard' },
    description: { es: 'Palabras raras, 3 minutos, sin pistas', en: 'Rare words, 3 minutes, no hints' },
    emoji: '🔴',
    color: Colors.error,
    maxHints: 0,
    timeLimit: 180,
  },
]

export const THEMES: ThemeOption[] = [
  { key: 'animals', label: { es: 'Animales', en: 'Animals' }, emoji: '🐾' },
  { key: 'food', label: { es: 'Comida', en: 'Food' }, emoji: '🍕' },
  { key: 'nature', label: { es: 'Naturaleza', en: 'Nature' }, emoji: '🌿' },
  { key: 'sports', label: { es: 'Deportes', en: 'Sports' }, emoji: '⚽' },
  { key: 'tech', label: { es: 'Tecnología', en: 'Technology' }, emoji: '💻' },
  { key: 'body', label: { es: 'Cuerpo', en: 'Body' }, emoji: '💪' },
  { key: 'random', label: { es: 'Aleatorio', en: 'Random' }, emoji: '🎲' },
]

export const ASYNC_STORAGE_KEYS = {
  LANGUAGE: 'lexia_language',
  LOCAL_GAMES_COUNT: 'lexia_local_games_count',
  LAST_DAILY_DATE: 'lexia_last_daily_date',
  LAST_PROMPT_SHOWN: 'lexia_last_prompt_shown',
  AI_WORD_HISTORY_ES: 'lexia_ai_history_es',
  AI_WORD_HISTORY_EN: 'lexia_ai_history_en',
  NOTIFICATIONS_ENABLED: 'lexia_notifications_enabled',
  USER_PROFILE: 'lexia_user_profile',
  PLAYER_STATS: 'lexia_player_stats',
} as const
