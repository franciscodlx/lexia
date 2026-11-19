import { Share } from 'react-native'
import type { Language, LetterCell } from '@/types'
import { COPY } from '@/constants/copy'
import { boardToEmojis } from '@/lib/utils'

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

  const emojis = boardToEmojis(board, completedRows)

  const modeTag = isAIMode ? ` [${copy.game.aiMode}]` : ''
  const result = won
    ? `${completedRows}/6`
    : 'X/6'

  const text = `${copy.game.title}${modeTag} ${result}\n\n${emojis}`

  try {
    await Share.share({ message: text })
  } catch {
    // User cancelled or share failed — no action needed
  }
}
