import { useSyncExternalStore } from 'react'
import { useGameStore } from '@/store/gameStore'

const subscribe = (onChange: () => void) => useGameStore.persist.onFinishHydration(onChange)
const getSnapshot = () => useGameStore.persist.hasHydrated()

/** True once the persisted game store has been read back from AsyncStorage. */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
