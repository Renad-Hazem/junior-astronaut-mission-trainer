// TEMPORARY UI-ONLY CONTRACT ADAPTER.
// TODO(integration): replace these definitions with Malak's approved
// AvatarId / AvatarDefinition exports when the shared contract lands.
export type AvatarId = 'avatar-01' | 'avatar-02' | 'avatar-03' | 'avatar-04'

export interface AvatarDefinition {
  id: AvatarId
  displayName: string
  description: string
  accentColor: string
  previewClass: string
}

// These callsigns and CSS silhouettes are temporary UI labels, not claims
// about final GLB filenames, character names, appearance, rigging, or clips.
export const avatarDefinitions: readonly AvatarDefinition[] = [
  {
    id: 'avatar-01',
    displayName: 'Nova',
    description: 'A bright orange explorer ready for the first steps on Mars.',
    accentColor: '#ff913d',
    previewClass: 'avatar-preview--nova',
  },
  {
    id: 'avatar-02',
    displayName: 'Orion',
    description: 'A cool blue systems scout with a sharp mission-ready look.',
    accentColor: '#55bdeb',
    previewClass: 'avatar-preview--orion',
  },
  {
    id: 'avatar-03',
    displayName: 'Lumi',
    description: 'A curious purple science cadet who loves discovering clues.',
    accentColor: '#b995ff',
    previewClass: 'avatar-preview--lumi',
  },
  {
    id: 'avatar-04',
    displayName: 'Comet',
    description: 'A teal trailblazer built for calm thinking and bold ideas.',
    accentColor: '#63e6c1',
    previewClass: 'avatar-preview--comet',
  },
] as const

export const defaultAvatarId: AvatarId = 'avatar-01'

export function isAvatarId(value: unknown): value is AvatarId {
  return avatarDefinitions.some((avatar) => avatar.id === value)
}

export function getAvatarDefinition(id: AvatarId): AvatarDefinition {
  return avatarDefinitions.find((avatar) => avatar.id === id) ?? avatarDefinitions[0]
}
