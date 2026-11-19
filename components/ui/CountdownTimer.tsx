import { useState, useEffect, useRef } from 'react'
import { Text } from 'react-native'
import { formatCountdown } from '@/lib/utils'

interface Props {
  totalSeconds: number
  onExpire?: () => void
  className?: string
}

export function CountdownTimer({ totalSeconds, onExpire, className }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  // Restart the countdown when the configured duration changes
  const [prevTotal, setPrevTotal] = useState(totalSeconds)
  if (prevTotal !== totalSeconds) {
    setPrevTotal(totalSeconds)
    setRemaining(totalSeconds)
  }

  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current?.()
      return
    }
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          onExpireRef.current?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [remaining])

  return (
    <Text className={className ?? 'text-white font-bold text-base tabular-nums'}>
      {formatCountdown(remaining)}
    </Text>
  )
}
