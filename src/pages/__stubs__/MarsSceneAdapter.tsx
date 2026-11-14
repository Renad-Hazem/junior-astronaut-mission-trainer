import type { HotspotId, LevelId, SceneStatus } from '../../game/uiAdapter'
import type { AvatarId } from './avatarAdapter'

export interface MarsSceneProps {
  levelId: LevelId
  status: SceneStatus
  highlightedHotspot?: HotspotId
  onInspect?: (hotspotId: HotspotId) => void
  reducedMotion?: boolean
  // TEMPORARY optional mirror of the proposed Renad-owned prop.
  avatarId?: AvatarId
}

// TEMPORARY UI fallback. Replace with Renad's default MarsScene export.
// This is a CSS illustration, not a GLB renderer or playable 3D controller.
export default function MarsScene({ status, highlightedHotspot, onInspect, reducedMotion, avatarId = 'avatar-01' }: MarsSceneProps) {
  return (
    <div className={`mars-scene mars-scene--${status} ${reducedMotion ? 'mars-scene--still' : ''}`} aria-label="Interactive illustration of Aster Base on Mars">
      <div className="mars-scene__sky"><span className="mars-moon" /><span className="mars-star mars-star--one">✦</span><span className="mars-star mars-star--two">✦</span></div>
      <div className="mars-scene__ground" />
      <div className={`scene-avatar scene-avatar--${avatarId}`} aria-hidden="true"><span className="scene-avatar__helmet" /><span className="scene-avatar__body" /></div>
      <button className={`scene-hotspot scene-hotspot--habitat ${highlightedHotspot === 'habitat' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('habitat')} aria-label="Inspect habitat"><span className="habitat-dome" /><small>HABITAT</small></button>
      <button className={`scene-hotspot scene-hotspot--solar ${highlightedHotspot === 'solar' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('solar')} aria-label="Inspect solar array"><span className="solar-panels" /><small>SOLAR</small></button>
      <button className={`scene-hotspot scene-hotspot--greenhouse ${highlightedHotspot === 'greenhouse' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('greenhouse')} aria-label="Inspect greenhouse"><span className="greenhouse" /><small>GREENHOUSE</small></button>
      <button className={`scene-hotspot scene-hotspot--comms ${highlightedHotspot === 'communications' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('communications')} aria-label="Inspect communications dish"><span className="comms-dish" /><small>COMMS</small></button>
      <button className={`scene-hotspot scene-hotspot--oxygen ${highlightedHotspot === 'oxygen' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('oxygen')} aria-label="Inspect oxygen system"><span className="oxygen-tanks" /><small>OXYGEN</small></button>
      <button className={`scene-hotspot scene-hotspot--water ${highlightedHotspot === 'water' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('water')} aria-label="Inspect water recycler"><span className="water-tank" /><small>WATER</small></button>
      <button className={`scene-hotspot scene-hotspot--rover ${highlightedHotspot === 'rover' ? 'is-highlighted' : ''}`} onClick={() => onInspect?.('rover')} aria-label="Inspect maintenance rover"><span className="rover-unit" /><small>ROVER</small></button>
      <div className="scene-status"><span aria-hidden="true">●</span> Scene status: {status.replace('_', ' ')}</div>
    </div>
  )
}
