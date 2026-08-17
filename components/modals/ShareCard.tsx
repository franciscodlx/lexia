import { Share } from 'react-native'
import type { Language, LetterCell } from '@/types'
import { COPY } from '@/constants/copy'

export async function shareResult({
  board,
  completedRows,
  won,
  language,
  isAIMode,
}: {
  board: LetterCell[][]
  completedRows: number
  won: boolean
  language: Language
  isAIMode: boolean
}) {
  const copy = COPY[language]

  const emojis = board
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

  const modeTag = isAIMode ? ` [${copy.game.aiMode}]` : ''
  const result = won
    ? `${completedRows}/6`
    : 'X/6'

  const text = `${copy.game.title}${modeTag} ${result}\n\n${emojis}\n\nhttps://lexia.app`

  try {
    await Share.share({ message: text })
  } catch {
    // User cancelled or share failed — no action needed
  }
}
