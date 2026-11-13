import { getAvatarDefinition, type AvatarId } from '../../pages/__stubs__/avatarAdapter'
import { AvatarPreview } from './AvatarPreview'

interface AvatarIdentityProps {
  avatarId: AvatarId
  label?: string
}

export function AvatarIdentity({ avatarId, label = 'Selected astronaut' }: AvatarIdentityProps) {
  const avatar = getAvatarDefinition(avatarId)
  return (
    <div className="avatar-identity" aria-label={`${label}: ${avatar.displayName}`}>
      <AvatarPreview avatar={avatar} compact />
      <span><small>{label}</small><strong>{avatar.displayName}</strong></span>
    </div>
  )
}
