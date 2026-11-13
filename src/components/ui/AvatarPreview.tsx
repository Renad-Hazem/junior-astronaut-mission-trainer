import type { CSSProperties } from 'react'
import type { AvatarDefinition } from '../../pages/__stubs__/avatarAdapter'

interface AvatarPreviewProps {
  avatar: AvatarDefinition
  compact?: boolean
}

export function AvatarPreview({ avatar, compact = false }: AvatarPreviewProps) {
  return (
    <div
      className={`avatar-preview ${avatar.previewClass} ${compact ? 'avatar-preview--compact' : ''}`}
      style={{ '--avatar-accent': avatar.accentColor } as CSSProperties}
      aria-hidden="true"
    >
      <span className="avatar-preview__antenna" />
      <span className="avatar-preview__backpack" />
      <span className="avatar-preview__helmet"><i /><b /></span>
      <span className="avatar-preview__body"><i /></span>
      <span className="avatar-preview__arm avatar-preview__arm--left" />
      <span className="avatar-preview__arm avatar-preview__arm--right" />
      <span className="avatar-preview__leg avatar-preview__leg--left" />
      <span className="avatar-preview__leg avatar-preview__leg--right" />
    </div>
  )
}
