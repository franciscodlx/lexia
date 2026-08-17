import { useState, useCallback, useRef } from 'react'
import { useSharedValue, withSequence, withTiming, withDelay } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import type { GameState, GameStatus, Language, LetterCell, LetterStatus } from '@/types'
import { WORD_LENGTH, MAX_ROWS } from '@/constants/config'
import { createEmptyBoard, evaluateGuess, isValidWord } from '@/lib/utils'

// Priority order for usedLetters — never downgrade a letter status
const STATUS_PRIORITY: Record<LetterStatus, number> = {
  correct: 3,
  present: 2,
  absent: 1,
  tbd: 0,
  empty: 0,
}

function mergeLetterStatus(prev: LetterStatus | undefined, next: LetterStatus): LetterStatus {
  if (!prev) return next
  return STATUS_PRIORITY[next] > STATUS_PRIORITY[prev] ? next : prev
}

export function useWordleGame() {
  // ─── Core state ─────────────────────────────────────────────────────────
  const [board, setBoard] = useState<LetterCell[][]>(createEmptyBoard())
  const [currentRow, setCurrentRow] = useState(0)
  const [currentCol, setCurrentCol] = useState(0)
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [targetWord, setTargetWord] = useState('')
  const [language, setLanguage] = useState<Language>('es')
  const [hints, setHints] = useState(0)
  const [usedLetters, setUsedLetters] = useState<Record<string, LetterStatus>>({})
  const [message, setMessage] = useState<string | null>(null)

  // Keep a ref for targetWord so callbacks always have latest value
  const targetRef = useRef(targetWord)
  targetRef.current = targetWord

  // ─── Animations ──────────────────────────────────────────────────────────
  // One shake value per row
  const shakeValues = Array.from({ length: MAX_ROWS }, () => useSharedValue(0))
  // One flip progress per cell [row][col] → 0..1
  const flipValues = Array.from({ length: MAX_ROWS }, () =>
    Array.from({ length: WORD_LENGTH }, () => useSharedValue(0))
  )

  const shakeRow = useCallback(
    (row: number) => {
      shakeValues[row].value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
    },
    [shakeValues]
  )

  const flipRow = useCallback(
    (row: number, onComplete?: () => void) => {
      flipValues[row].forEach((val, col) => {
        val.value = withDelay(
          col * 300,
          withSequence(
            withTiming(1, { duration: 250 }),
            withTiming(2, { duration: 250 })
          )
        )
      })
      // Call onComplete after all flips finish
      const totalDuration = WORD_LENGTH * 300 + 500
      setTimeout(() => onComplete?.(), totalDuration)
    },
    [flipValues]
  )

  // ─── Show transient message ──────────────────────────────────────────────
  const showMessage = useCallback((msg: string, duration = 1500) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), duration)
  }, [])

  // ─── handleKey ───────────────────────────────────────────────────────────
  const handleKey = useCallback(
    (key: string) => {
      if (gameStatus !== 'playing') return

      // DELETE
      if (key === '⌫') {
        if (currentCol === 0) return
        setBoard((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })))
          next[currentRow][currentCol - 1] = { letter: '', status: 'empty' }
          return next
        })
        setCurrentCol((c) => c - 1)
        return
      }

      // ENTER
      if (key === 'ENTER') {
        if (currentCol < WORD_LENGTH) {
          shakeRow(currentRow)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          return
        }

        const guess = board[currentRow].map((c) => c.letter).join('')

        if (!isValidWord(guess, language)) {
          shakeRow(currentRow)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          showMessage(language === 'es' ? 'Palabra no encontrada' : 'Word not found')
          return
        }

        const result = evaluateGuess(guess, targetRef.current)

        // Update board with results (status = 'tbd' until flip completes)
        setBoard((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })))
          result.forEach((cell, col) => {
            next[currentRow][col] = { letter: cell.letter, status: 'tbd' }
          })
          return next
        })

        // Flip animation, then reveal real statuses
        flipRow(currentRow, () => {
          setBoard((prev) => {
            const next = prev.map((r) => r.map((c) => ({ ...c })))
            result.forEach((cell, col) => {
              next[currentRow][col] = cell
            })
            return next
          })

          // Update used letters (no downgrade)
          setUsedLetters((prev) => {
            const next = { ...prev }
            result.forEach((cell) => {
              next[cell.letter] = mergeLetterStatus(next[cell.letter], cell.status)
            })
            return next
          })

          const won = result.every((c) => c.status === 'correct')
          const nextRow = currentRow + 1

          if (won) {
            setGameStatus('won')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          } else if (nextRow >= MAX_ROWS) {
            setGameStatus('lost')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          } else {
            setCurrentRow(nextRow)
            setCurrentCol(0)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }
        })

        return
      }

      // LETTER — only A-Z and Ñ
      if (!/^[A-ZÑ]$/.test(key)) return
      if (currentCol >= WORD_LENGTH) return

      setBoard((prev) => {
        const next = prev.map((r) => r.map((c) => ({ ...c })))
        next[currentRow][currentCol] = { letter: key, status: 'tbd' }
        return next
      })
      setCurrentCol((c) => c + 1)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
    [board, currentCol, currentRow, flipRow, gameStatus, language, shakeRow, showMessage]
  )

  // ─── useHint: reveal first incorrect letter in current row ───────────────
  const useHint = useCallback(() => {
    if (gameStatus !== 'playing' || hints <= 0) return

    const target = targetRef.current
    const currentGuess = board[currentRow]

    // Find first position that doesn't match the target
    const hintCol = currentGuess.findIndex(
      (cell, i) => cell.letter !== target[i]
    )
    if (hintCol === -1) return // all letters already correct

    setBoard((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })))
      next[currentRow][hintCol] = { letter: target[hintCol], status: 'tbd' }
      return next
    })

    // Advance col if we placed past current position
    setCurrentCol((c) => Math.max(c, hintCol + 1))
    setHints((h) => h - 1)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [board, currentRow, gameStatus, hints])

  // ─── addHint ─────────────────────────────────────────────────────────────
  const addHint = useCallback(() => {
    setHints((h) => h + 1)
  }, [])

  // ─── resetGame ───────────────────────────────────────────────────────────
  const resetGame = useCallback(
    (word: string, lang: Language, initialHints = 0) => {
      setBoard(createEmptyBoard())
      setCurrentRow(0)
      setCurrentCol(0)
      setGameStatus('playing')
      setTargetWord(word)
      targetRef.current = word
      setLanguage(lang)
      setHints(initialHints)
      setUsedLetters({})
      setMessage(null)
      // Reset animations
      shakeValues.forEach((v) => { v.value = 0 })
      flipValues.forEach((row) => row.forEach((v) => { v.value = 0 }))
    },
    [flipValues, shakeValues]
  )

  return {
    // State
    board,
    currentRow,
    currentCol,
    gameStatus,
    targetWord,
    language,
    hints,
    usedLetters,
    message,
    // Animated values (expose for components)
    shakeValues,
    flipValues,
    // Actions
    handleKey,
    useHint,
    addHint,
    resetGame,
    showMessage,
  }
}
