import { View, useWindowDimensions } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { GameCell } from './GameCell'
import type { LetterCell } from '@/types'
import { WORD_LENGTH, MAX_ROWS } from '@/constants/config'

interface Props {
  board: LetterCell[][]
  shakeValues: SharedValue<number>[]
  flipValues: SharedValue<number>[][]
}

const CELL_GAP = 6
const BOARD_PADDING = 32

export function GameBoard({ board, shakeValues, flipValues }: Props) {
  const { width } = useWindowDimensions()
  const availableWidth = width - BOARD_PADDING * 2
  const cellSize = Math.floor(
    (availableWidth - CELL_GAP * (WORD_LENGTH - 1)) / WORD_LENGTH
  )

  return (
    <View className="items-center justify-center py-2">
      {Array.from({ length: MAX_ROWS }, (_, rowIdx) => (
        <View key={rowIdx} className="flex-row" style={{ gap: CELL_GAP, marginBottom: CELL_GAP }}>
          {Array.from({ length: WORD_LENGTH }, (_, colIdx) => (
            <GameCell
              key={colIdx}
              cell={board[rowIdx]?.[colIdx] ?? { letter: '', status: 'empty' }}
              size={cellSize}
              shakeValue={shakeValues[rowIdx]}
              flipValue={flipValues[rowIdx][colIdx]}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
