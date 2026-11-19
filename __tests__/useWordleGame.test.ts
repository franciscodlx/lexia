import { act, renderHook } from '@testing-library/react-native'
import { useWordleGame } from '@/hooks/useWordleGame'

// The flip animation defers row evaluation behind a setTimeout,
// so ENTER-related assertions need fake timers.
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

function typeWord(result: { current: ReturnType<typeof useWordleGame> }, word: string) {
  for (const letter of word) {
    act(() => {
      result.current.handleKey(letter)
    })
  }
}

function pressEnterAndFlip(result: { current: ReturnType<typeof useWordleGame> }) {
  act(() => {
    result.current.handleKey('ENTER')
    jest.runAllTimers()
  })
}

describe('useWordleGame', () => {
  it('starts with an empty 6x5 board in playing state', () => {
    const { result } = renderHook(() => useWordleGame())
    expect(result.current.board).toHaveLength(6)
    expect(result.current.board[0]).toHaveLength(5)
    expect(result.current.currentRow).toBe(0)
    expect(result.current.currentCol).toBe(0)
    expect(result.current.gameStatus).toBe('playing')
    expect(result.current.usedLetters).toEqual({})
  })

  it('resetGame sets target word, language and hints', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es', 2)
    })
    expect(result.current.targetWord).toBe('GATOS')
    expect(result.current.language).toBe('es')
    expect(result.current.hints).toBe(2)
    expect(result.current.gameStatus).toBe('playing')
  })

  it('typing a letter advances the column and fills the cell', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    act(() => {
      result.current.handleKey('M')
    })
    expect(result.current.currentCol).toBe(1)
    expect(result.current.board[0][0].letter).toBe('M')
  })

  it('rejects keys that are not single letters', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    act(() => {
      result.current.handleKey('1')
    })
    expect(result.current.currentCol).toBe(0)
  })

  it('does not type past the fifth column', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'MUNDOS')
    expect(result.current.currentCol).toBe(5)
    expect(result.current.board[0].map((c) => c.letter).join('')).toBe('MUNDO')
  })

  it('backspace clears the previous cell and moves back', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'MU')
    act(() => {
      result.current.handleKey('⌫')
    })
    expect(result.current.currentCol).toBe(1)
    expect(result.current.board[0][1].letter).toBe('')
    expect(result.current.board[0][0].letter).toBe('M')
  })

  it('ENTER on an incomplete row does not advance', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'MUN')
    pressEnterAndFlip(result)
    expect(result.current.currentRow).toBe(0)
    expect(result.current.currentCol).toBe(3)
  })

  it('ENTER on a word not in the dictionary shows a message and stays', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'ZZZZZ')
    act(() => {
      result.current.handleKey('ENTER')
    })
    expect(result.current.message).toBe('Palabra no encontrada')
    expect(result.current.currentRow).toBe(0)
    act(() => {
      jest.runAllTimers()
    })
    expect(result.current.message).toBeNull()
  })

  it('ENTER on a valid wrong guess evaluates and advances the row', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'MUNDO')
    pressEnterAndFlip(result)
    expect(result.current.currentRow).toBe(1)
    expect(result.current.currentCol).toBe(0)
    expect(result.current.gameStatus).toBe('playing')
    // MUNDO vs GATOS: M-U-N absent, D absent, O present (O is at index 3 in GATOS)
    expect(result.current.board[0].map((c) => c.status)).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'present',
    ])
    expect(result.current.usedLetters['O']).toBe('present')
    expect(result.current.usedLetters['M']).toBe('absent')
  })

  it('never downgrades a used letter status', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'PLATO')
    pressEnterAndFlip(result)
    const statusAfterFirst = result.current.usedLetters['A']
    // Second guess reuses A in a non-matching position; status must not regress.
    typeWord(result, 'ALGAS')
    pressEnterAndFlip(result)
    const priority: Record<string, number> = { correct: 3, present: 2, absent: 1 }
    expect(priority[result.current.usedLetters['A']]).toBeGreaterThanOrEqual(
      priority[statusAfterFirst]
    )
  })

  it('winning guess sets gameStatus to won', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'GATOS')
    pressEnterAndFlip(result)
    expect(result.current.gameStatus).toBe('won')
    expect(result.current.board[0].every((c) => c.status === 'correct')).toBe(true)
  })

  it('six failed guesses set gameStatus to lost', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    for (let i = 0; i < 6; i++) {
      typeWord(result, 'MUNDO')
      pressEnterAndFlip(result)
    }
    expect(result.current.gameStatus).toBe('lost')
    expect(result.current.currentRow).toBe(5)
  })

  it('ignores input after the game ends', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'GATOS')
    pressEnterAndFlip(result)
    act(() => {
      result.current.handleKey('M')
    })
    expect(result.current.board[1][0].letter).toBe('')
  })

  it('useHint reveals a target letter and consumes a hint', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es', 1)
    })
    act(() => {
      result.current.useHint()
    })
    expect(result.current.board[0][0].letter).toBe('G')
    expect(result.current.hints).toBe(0)
    expect(result.current.currentCol).toBe(1)
  })

  it('useHint does nothing without hints available', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es', 0)
    })
    act(() => {
      result.current.useHint()
    })
    expect(result.current.board[0][0].letter).toBe('')
  })

  it('addHint increments the hint count', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es', 0)
    })
    act(() => {
      result.current.addHint()
    })
    expect(result.current.hints).toBe(1)
  })

  it('resetGame clears a finished game back to playing', () => {
    const { result } = renderHook(() => useWordleGame())
    act(() => {
      result.current.resetGame('GATOS', 'es')
    })
    typeWord(result, 'GATOS')
    pressEnterAndFlip(result)
    expect(result.current.gameStatus).toBe('won')
    act(() => {
      result.current.resetGame('MUNDO', 'es')
    })
    expect(result.current.gameStatus).toBe('playing')
    expect(result.current.currentRow).toBe(0)
    expect(result.current.board[0][0]).toEqual({ letter: '', status: 'empty' })
    expect(result.current.usedLetters).toEqual({})
  })
})
