import { useMemo, useState, type ReactNode } from 'react'
import { AvatarSelectionContext } from './avatarSelectionContext'
import { defaultAvatarId, isAvatarId, type AvatarId } from './__stubs__/avatarAdapter'

const STORAGE_KEY = 'mars-base:selected-avatar:v1'

function readStoredAvatar(): AvatarId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isAvatarId(stored) ? stored : defaultAvatarId
  } catch {
    return defaultAvatarId
  }
}

function persistAvatar(id: AvatarId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Storage can be blocked or unavailable. In-memory selection still works.
  }
}

export function AvatarSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarId>(readStoredAvatar)

  const value = useMemo(() => ({
    selectedAvatarId,
    selectAvatar: (id: AvatarId) => {
      setSelectedAvatarId(id)
      persistAvatar(id)
    },
  }), [selectedAvatarId])

  return <AvatarSelectionContext value={value}>{children}</AvatarSelectionContext>
}
