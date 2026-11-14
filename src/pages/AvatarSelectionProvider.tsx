import { useMemo, useState, type ReactNode } from 'react'
import { AvatarSelectionContext } from './avatarSelectionContext'
import { defaultAvatarId, isAvatarId, type AvatarId } from './__stubs__/avatarAdapter'

const STORAGE_KEY = 'mars-base:selected-avatar:v1'
const PHOTO_STORAGE_KEY = 'mars-base:custom-avatar-photo:v1'

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

function readStoredPhoto(): string | null {
  try {
    return window.localStorage.getItem(PHOTO_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistPhoto(photo: string | null) {
  try {
    if (photo) {
      window.localStorage.setItem(PHOTO_STORAGE_KEY, photo)
    } else {
      window.localStorage.removeItem(PHOTO_STORAGE_KEY)
    }
  } catch {
    // Storage blocked
  }
}

export function AvatarSelectionProvider({ children }: { children: ReactNode }) {
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(readStoredPhoto)
  const [selectedAvatarId, setSelectedAvatarId] = useState<AvatarId>(() => {
    const storedAvatar = readStoredAvatar()
    const storedPhoto = readStoredPhoto()
    return storedAvatar === 'avatar-custom' && !storedPhoto ? defaultAvatarId : storedAvatar
  })

  const value = useMemo(() => ({
    selectedAvatarId,
    selectAvatar: (id: AvatarId) => {
      setSelectedAvatarId(id)
      persistAvatar(id)
    },
    customPhotoUrl,
    setCustomPhoto: (dataUrl: string | null) => {
      setCustomPhotoUrl(dataUrl)
      persistPhoto(dataUrl)
      if (dataUrl) {
        setSelectedAvatarId('avatar-custom')
        persistAvatar('avatar-custom')
      } else if (selectedAvatarId === 'avatar-custom') {
        setSelectedAvatarId(defaultAvatarId)
        persistAvatar(defaultAvatarId)
      }
    },
  }), [selectedAvatarId, customPhotoUrl])

  return <AvatarSelectionContext value={value}>{children}</AvatarSelectionContext>
}
