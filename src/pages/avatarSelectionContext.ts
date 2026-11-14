import { createContext } from 'react'
import type { AvatarId } from './__stubs__/avatarAdapter'

export interface AvatarSelectionContextValue {
  selectedAvatarId: AvatarId
  selectAvatar: (id: AvatarId) => void
}

export const AvatarSelectionContext = createContext<AvatarSelectionContextValue | null>(null)
