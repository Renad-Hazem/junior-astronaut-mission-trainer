import { getAvatarDefinition, type AvatarId } from '../../pages/__stubs__/avatarAdapter'
import { useAvatarSelection } from '../../pages/useAvatarSelection'
import { AvatarPreview } from './AvatarPreview'

interface AvatarIdentityProps {
  avatarId: AvatarId
  label?: string
  customPhotoUrl?: string | null
}

export function AvatarIdentity({ avatarId, label = 'Selected astronaut', customPhotoUrl: propPhoto }: AvatarIdentityProps) {
  const { customPhotoUrl: contextPhoto } = useAvatarSelection()
  const customPhotoUrl = propPhoto !== undefined ? propPhoto : contextPhoto
  const avatar = getAvatarDefinition(avatarId)

  return (
    // role="group" makes the aria-label count when the visible copy is hidden on narrow gameplay headers.
    <div className="avatar-identity" role="group" aria-label={`${label}: ${avatar.displayName}`}>
      <AvatarPreview avatar={avatar} compact customPhotoUrl={avatarId === 'avatar-custom' ? customPhotoUrl : undefined} />
      <span className="avatar-identity__copy"><small>{label}</small><strong>{avatar.displayName}</strong></span>
    </div>
  )
}
