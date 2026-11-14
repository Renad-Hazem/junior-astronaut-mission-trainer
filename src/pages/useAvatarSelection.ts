import { use } from 'react'
import { AvatarSelectionContext } from './avatarSelectionContext'

export function useAvatarSelection() {
  const context = use(AvatarSelectionContext)
  if (!context) throw new Error('useAvatarSelection must be used inside AvatarSelectionProvider')
  return context
}
