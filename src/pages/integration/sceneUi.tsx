import type { ComponentType } from 'react'
import type { AvatarId } from '../__stubs__/avatarAdapter'
import FallbackMarsScene from '../__stubs__/MarsSceneAdapter'
import type { HotspotId, LevelId, SceneStatus } from './gameUiContract'

export interface MarsSceneUiProps {
  levelId: LevelId
  status: SceneStatus
  highlightedHotspot?: HotspotId
  onInspect?: (hotspotId: HotspotId) => void
  reducedMotion?: boolean
  /**
   * Existing UI selection input. The shared scene prop remains
   * REQUIRES TEAM APPROVAL; the real bridge may omit/map it until approved.
   */
  avatarId?: AvatarId
}

export interface SceneUiPort {
  Component: ComponentType<MarsSceneUiProps>
}

const fallbackSceneUiPort = {
  Component: FallbackMarsScene,
} satisfies SceneUiPort

// Single replacement seam for Renad's real scene export. Do not add scene
// props here until the actual implementation and approved contract exist.
const MarsScene = fallbackSceneUiPort.Component

export default MarsScene
