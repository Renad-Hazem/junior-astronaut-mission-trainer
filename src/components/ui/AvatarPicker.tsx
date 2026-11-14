import { useEffect, useRef, useState } from 'react'
import { avatarDefinitions, getAvatarDefinition, type AvatarId } from '../../pages/__stubs__/avatarAdapter'
import { useAvatarSelection } from '../../pages/useAvatarSelection'
import { AvatarPreview } from './AvatarPreview'
import { CustomCharacterModal } from './CustomCharacterModal'

interface AvatarPickerProps {
  initialAvatarId: AvatarId
  onConfirm: (id: AvatarId) => void
  onCancel: () => void
}

export function AvatarPicker({ initialAvatarId, onConfirm, onCancel }: AvatarPickerProps) {
  const { customPhotoUrl, setCustomPhoto } = useAvatarSelection()
  const [draftAvatarId, setDraftAvatarId] = useState<AvatarId>(initialAvatarId)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const selected = getAvatarDefinition(draftAvatarId)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled])')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onCancel])

  return (
    <>
      <div className="avatar-picker-backdrop" role="presentation">
        <section ref={dialogRef} className="avatar-picker" role="dialog" aria-modal="true" aria-labelledby="avatar-picker-title" aria-describedby="avatar-picker-description" tabIndex={-1}>
          <button type="button" className="avatar-picker__close" onClick={onCancel} aria-label="Close astronaut selection">×</button>
          <header className="avatar-picker__header">
            <span className="eyebrow">CADET CREW ROSTER</span>
            <h2 id="avatar-picker-title">Choose Your Astronaut</h2>
            <p id="avatar-picker-description">Pick an explorer or add a local photo to your own spacesuit at ASTER BASE.</p>
            <div className="avatar-custom-hero-banner">
              <div className="avatar-custom-hero-text">
                <strong>Want to see YOUR face inside the astronaut helmet?</strong>
                <span>The camera is optional and starts only after permission. Photos stay in this browser.</span>
              </div>
              <button
                type="button"
                className="primary-button avatar-custom-btn"
                onClick={() => setIsCustomizing(true)}
              >
                📸 {customPhotoUrl ? 'Update Face Photo' : 'Open Camera / Photo'}
              </button>
            </div>
          </header>

          <div className="avatar-picker__grid avatar-picker__grid--5" role="group" aria-label="Astronaut choices">
            {avatarDefinitions.map((avatar, index) => {
              const isSelected = avatar.id === draftAvatarId
              const isCustom = avatar.id === 'avatar-custom'
              return (
                <button
                  type="button"
                  className={`avatar-card ${isSelected ? 'avatar-card--selected' : ''} ${isCustom ? 'avatar-card--custom' : ''}`}
                  key={avatar.id}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (isCustom && !customPhotoUrl) {
                      setIsCustomizing(true)
                    } else {
                      setDraftAvatarId(avatar.id)
                    }
                  }}
                >
                  <span className="avatar-card__number">0{index + 1}</span>
                  <AvatarPreview
                    avatar={avatar}
                    customPhotoUrl={isCustom ? customPhotoUrl : undefined}
                  />
                  <span className="avatar-card__copy">
                    <strong>{avatar.displayName}</strong>
                    <small>
                      {isCustom && !customPhotoUrl
                        ? 'Tap to open camera or upload photo for your visor.'
                        : avatar.description}
                    </small>
                  </span>
                  <span className="avatar-card__status">
                    {isCustom && !customPhotoUrl
                      ? '📷 Setup Photo'
                      : isSelected
                      ? '✓ Selected'
                      : 'Choose astronaut'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="avatar-picker__note"><span aria-hidden="true">✦</span> Your selected astronaut appears in menus, the HUD, and 3D Mars exploration. Custom photos remain local to this browser.</div>
          <div className="avatar-picker__actions">
            <button type="button" className="secondary-button" onClick={onCancel}>Back</button>
            <button type="button" className="primary-button" onClick={() => onConfirm(draftAvatarId)}>Confirm {selected.displayName} <span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>

      {isCustomizing && (
        <CustomCharacterModal
          currentPhoto={customPhotoUrl}
          onSave={(photo) => {
            setCustomPhoto(photo)
            setDraftAvatarId('avatar-custom')
          }}
          onClear={() => {
            setCustomPhoto(null)
            if (draftAvatarId === 'avatar-custom') {
              setDraftAvatarId('avatar-01')
            }
          }}
          onClose={() => setIsCustomizing(false)}
        />
      )}
    </>
  )
}
