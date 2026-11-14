import { useEffect, useRef, useState } from 'react'
import { avatarDefinitions, getAvatarDefinition, type AvatarId } from '../../pages/__stubs__/avatarAdapter'
import { AvatarPreview } from './AvatarPreview'

interface AvatarPickerProps {
  initialAvatarId: AvatarId
  onConfirm: (id: AvatarId) => void
  onCancel: () => void
}

export function AvatarPicker({ initialAvatarId, onConfirm, onCancel }: AvatarPickerProps) {
  const [draftAvatarId, setDraftAvatarId] = useState<AvatarId>(initialAvatarId)
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
    <div className="avatar-picker-backdrop" role="presentation">
      <section ref={dialogRef} className="avatar-picker" role="dialog" aria-modal="true" aria-labelledby="avatar-picker-title" aria-describedby="avatar-picker-description" tabIndex={-1}>
        <button type="button" className="avatar-picker__close" onClick={onCancel} aria-label="Close astronaut selection">×</button>
        <header className="avatar-picker__header">
          <span className="eyebrow">CADET CREW ROSTER</span>
          <h2 id="avatar-picker-title">Choose Your Astronaut</h2>
          <p id="avatar-picker-description">Pick the explorer who will represent you at Aster Base. Every astronaut has the same abilities.</p>
        </header>

        <div className="avatar-picker__grid" role="group" aria-label="Astronaut choices">
          {avatarDefinitions.map((avatar, index) => {
            const isSelected = avatar.id === draftAvatarId
            return (
              <button
                type="button"
                className={`avatar-card ${isSelected ? 'avatar-card--selected' : ''}`}
                key={avatar.id}
                aria-pressed={isSelected}
                onClick={() => setDraftAvatarId(avatar.id)}
              >
                <span className="avatar-card__number">0{index + 1}</span>
                <AvatarPreview avatar={avatar} />
                <span className="avatar-card__copy">
                  <strong>{avatar.displayName}</strong>
                  <small>{avatar.description}</small>
                </span>
                <span className="avatar-card__status">{isSelected ? '✓ Selected' : 'Choose astronaut'}</span>
              </button>
            )
          })}
        </div>

        <div className="avatar-picker__note"><span aria-hidden="true">✦</span> Temporary training callsigns and CSS previews — final verified 3D models will be connected by the 3D team.</div>
        <div className="avatar-picker__actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Back</button>
          <button type="button" className="primary-button" onClick={() => onConfirm(draftAvatarId)}>Confirm {selected.displayName} <span aria-hidden="true">→</span></button>
        </div>
      </section>
    </div>
  )
}
