import { createContext } from 'react'
import type { AvatarId } from './__stubs__/avatarAdapter'

export interface AvatarSelectionContextValue {
  selectedAvatarId: AvatarId
  selectAvatar: (id: AvatarId) => void
  customPhotoUrl: string | null
  setCustomPhoto: (dataUrl: string | null) => void
}

export const AvatarSelectionContext = createContext<AvatarSelectionContextValue | null>(null)
