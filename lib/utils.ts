import type { Language, LetterCell, LetterStatus } from '@/types'
import { WORD_LENGTH, MAX_ROWS } from '@/constants/config'
import { WORDS_ES } from './words-es'
import { WORDS_EN } from './words-en'

export function getDailyWord(lang: Language): string {
  const words = lang === 'es' ? WORDS_ES : WORDS_EN
  const today = getTodayString()
  // Deterministic seed from date string
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0
  }
  return words[hash % words.length]
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

export function getTodayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getYesterdayString(): string {
  const now = new Date()
  now.setDate(now.getDate() - 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function sanitizeWord(word: string): string {
  return word
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
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

export function isValidWord(word: string, lang: Language): boolean {
  const words = lang === 'es' ? WORDS_ES : WORDS_EN
  return words.includes(word.toUpperCase())
}

export function secondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}
