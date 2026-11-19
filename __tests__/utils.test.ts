import {
  boardToEmojis,
  createEmptyBoard,
  evaluateGuess,
  formatCountdown,
  formatTime,
  getDailyWord,
  getTodayString,
  getYesterdayString,
  isValidWord,
  sanitizeWord,
} from '@/lib/utils'
import { WORDS_ES } from '@/lib/words-es'
import { WORDS_EN } from '@/lib/words-en'

describe('evaluateGuess', () => {
  it('marks every letter correct on an exact match', () => {
    const result = evaluateGuess('CRANE', 'CRANE')
    expect(result.map((c) => c.status)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('handles repeated letters without over-marking (SPEED vs SPELL)', () => {
    // Target SPELL has one E; the E in position 2 matches exactly,
    // so the second E in the guess must be absent.
    const result = evaluateGuess('SPEED', 'SPELL')
    expect(result.map((c) => c.status)).toEqual([
      'correct', // S
      'correct', // P
      'correct', // E
      'absent', // E (target's only E already consumed)
      'absent', // D
    ])
  })

  it('consumes target letters left to right (HELLO vs WORLD)', () => {
    // WORLD has a single L, matched exactly by the L in position 3,
    // so the L in position 2 gets no credit.
    const result = evaluateGuess('HELLO', 'WORLD')
    expect(result.map((c) => c.status)).toEqual([
      'absent', // H
      'absent', // E
      'absent', // L (only L in target consumed by exact match)
      'correct', // L
      'present', // O
    ])
  })

  it('marks present for letters in the wrong position', () => {
    const result = evaluateGuess('ALERT', 'LATER')
    expect(result.map((c) => c.status)).toEqual([
      'present', // A
      'present', // L
      'present', // E
      'present', // R
      'present', // T
    ])
  })

  it('keeps the guessed letters on each cell', () => {
    const result = evaluateGuess('CRANE', 'WORLD')
    expect(result.map((c) => c.letter)).toEqual(['C', 'R', 'A', 'N', 'E'])
  })
})

describe('getDailyWord', () => {
  it('returns a 5-letter word for each language', () => {
    expect(getDailyWord('es')).toHaveLength(5)
    expect(getDailyWord('en')).toHaveLength(5)
  })

  it('is deterministic for the same day', () => {
    expect(getDailyWord('es')).toBe(getDailyWord('es'))
    expect(getDailyWord('en')).toBe(getDailyWord('en'))
  })

  it('returns a word from the corresponding list', () => {
    expect(WORDS_ES).toContain(getDailyWord('es'))
    expect(WORDS_EN).toContain(getDailyWord('en'))
  })
})

describe('createEmptyBoard', () => {
  it('creates a 6x5 board with empty cells', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(6)
    for (const row of board) {
      expect(row).toHaveLength(5)
      for (const cell of row) {
        expect(cell).toEqual({ letter: '', status: 'empty' })
      }
    }
  })

  it('creates independent cell objects', () => {
    const board = createEmptyBoard()
    board[0][0].letter = 'A'
    expect(board[0][1].letter).toBe('')
    expect(board[1][0].letter).toBe('')
  })
})

describe('word lists', () => {
  it('every Spanish word has exactly 5 letters', () => {
    const bad = WORDS_ES.filter((w) => w.length !== 5)
    expect(bad).toEqual([])
    expect(WORDS_ES.length).toBeGreaterThanOrEqual(200)
  })

  it('every English word has exactly 5 letters', () => {
    const bad = WORDS_EN.filter((w) => w.length !== 5)
    expect(bad).toEqual([])
    expect(WORDS_EN.length).toBeGreaterThanOrEqual(200)
  })
})

describe('isValidWord', () => {
  it('accepts words from the list regardless of case', () => {
    expect(isValidWord('mundo', 'es')).toBe(true)
    expect(isValidWord('CRANE', 'en')).toBe(true)
  })

  it('rejects words not in the list', () => {
    expect(isValidWord('ZZZZZ', 'es')).toBe(false)
    expect(isValidWord('ZZZZZ', 'en')).toBe(false)
  })
})

describe('sanitizeWord', () => {
  it('uppercases and strips accents', () => {
    expect(sanitizeWord('canción')).toBe('CANCION')
    expect(sanitizeWord('árbol')).toBe('ARBOL')
  })

  it('normalizes Ñ to N along with other diacritics', () => {
    expect(sanitizeWord('ñoño')).toBe('NONO')
  })
})

describe('time formatting', () => {
  it('formatTime renders MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(600)).toBe('10:00')
  })

  it('formatCountdown renders HH:MM:SS', () => {
    expect(formatCountdown(0)).toBe('00:00:00')
    expect(formatCountdown(3661)).toBe('01:01:01')
    expect(formatCountdown(86399)).toBe('23:59:59')
  })
})

describe('date helpers', () => {
  it('return YYYY-MM-DD strings', () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(getYesterdayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(getTodayString()).not.toBe(getYesterdayString())
  })
})

describe('boardToEmojis', () => {
  it('renders completed rows as emoji lines', () => {
    const board = createEmptyBoard()
    board[0] = evaluateGuess('HELLO', 'WORLD')
    board[1] = evaluateGuess('WORLD', 'WORLD')
    const out = boardToEmojis(board, 2)
    expect(out).toBe('⬛⬛⬛🟩🟨\n🟩🟩🟩🟩🟩')
  })

  it('ignores rows beyond completedRows', () => {
    const board = createEmptyBoard()
    board[0] = evaluateGuess('WORLD', 'WORLD')
    expect(boardToEmojis(board, 1)).toBe('🟩🟩🟩🟩🟩')
  })
})
