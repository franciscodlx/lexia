import type { Language, LetterCell, LetterStatus } from '@/types'
import { WORD_LENGTH, MAX_ROWS } from '@/constants/config'
import { WORDS_ES } from './words-es'
import { WORDS_EN } from './words-en'
import { DICT_ES } from './dict-es'
import { DICT_EN } from './dict-en'

// Large prime: (day * STEP) mod N walks the whole answer list before repeating a word.
const DAILY_STEP = 7919

/** Days since 1970-01-01 for the device's LOCAL calendar date (stable all day long). */
export function getLocalDayNumber(date: Date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

export function getDailyWord(lang: Language, date: Date = new Date()): string {
  const words = lang === 'es' ? WORDS_ES : WORDS_EN
  return words[(getLocalDayNumber(date) * DAILY_STEP) % words.length]
}

export function createEmptyBoard(): LetterCell[][] {
  return Array.from({ length: MAX_ROWS }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: '', status: 'empty' as LetterStatus }))
  )
}

export function evaluateGuess(guess: string, target: string): LetterCell[] {
  const result: LetterCell[] = Array.from({ length: WORD_LENGTH }, (_, i) => ({
    letter: guess[i],
    status: 'absent' as LetterStatus,
  }))

  const targetLetters = target.split('')
  const guessLetters = guess.split('')

  // First pass: mark correct letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i].status = 'correct'
      targetLetters[i] = '#' // consumed
      guessLetters[i] = '*' // consumed
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === '*') continue
    const idx = targetLetters.indexOf(guessLetters[i])
    if (idx !== -1) {
      result[i].status = 'present'
      targetLetters[idx] = '#' // consumed
    }
  }

  return result
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayString(): string {
  return toDateString(new Date())
}

export function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateString(d)
}

export function sanitizeWord(word: string): string {
  // NFD would split Ñ into N + combining tilde, so protect it before stripping accents.
  return word
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/\u0001/g, 'Ñ')
}

export function boardToEmojis(board: LetterCell[][], completedRows: number): string {
  return board
    .slice(0, completedRows)
    .map((row) =>
      row
        .map((cell) => {
          if (cell.status === 'correct') return '🟩'
          if (cell.status === 'present') return '🟨'
          return '⬛'
        })
        .join('')
    )
    .join('\n')
}

const dictionaries: Partial<Record<Language, Set<string>>> = {}

function getDictionary(lang: Language): Set<string> {
  let dict = dictionaries[lang]
  if (!dict) {
    // Built lazily on the first guess (~11k words per language).
    dict = new Set((lang === 'es' ? DICT_ES : DICT_EN).split(' '))
    for (const w of lang === 'es' ? WORDS_ES : WORDS_EN) dict.add(w)
    dictionaries[lang] = dict
  }
  return dict
}

/** True when `word` is an accepted guess: in the dictionary or in the answer list. */
export function isValidWord(word: string, lang: Language): boolean {
  return getDictionary(lang).has(sanitizeWord(word))
}

export function secondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}
