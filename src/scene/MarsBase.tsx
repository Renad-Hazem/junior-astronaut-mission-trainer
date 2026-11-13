import type { HotspotId, SceneStatus } from '../game/types';
import { HOTSPOTS, STATUS_VISUALS, indicatorColor } from './sceneConfig';
import SceneHotspot from './SceneHotspot';
import {
  CommunicationsDish,
  Greenhouse,
  Habitat,
  OxygenUnit,
  Rover,
  SolarArray,
  WaterRecycler,
} from './MarsLandmarks';

interface MarsBaseProps {
  status: SceneStatus;
  highlightedHotspot?: HotspotId;
  nearbyHotspot: HotspotId | null;
  reducedMotion: boolean;
  onInspect: (id: HotspotId) => void;
}

function SystemModel({ id, status, reducedMotion }: { id: HotspotId; status: SceneStatus; reducedMotion: boolean }) {
  switch (id) {
    case 'habitat':
      return <Habitat shield={status === 'radiation_alert'} />;
    case 'solar':
      return <SolarArray dusty={status === 'dust'} />;
    case 'oxygen':
      return <OxygenUnit alert={status === 'oxygen_alert'} reducedMotion={reducedMotion} />;
    case 'water':
      return <WaterRecycler />;
    case 'greenhouse':
      return <Greenhouse />;
    case 'communications':
      return <CommunicationsDish reducedMotion={reducedMotion} />;
    case 'rover':
      return <Rover />;
  }
}

/** All seven mission systems at their fixed map positions (same map for every level). */
export default function MarsBase({ status, highlightedHotspot, nearbyHotspot, reducedMotion, onInspect }: MarsBaseProps) {
  const visual = STATUS_VISUALS[status];
  return (
    <group>
      {HOTSPOTS.map((layout) => (
        <SceneHotspot
          key={layout.id}
          layout={layout}
          isNearby={nearbyHotspot === layout.id}
          isObjective={highlightedHotspot === layout.id}
          alertColor={visual.alertHotspot === layout.id ? visual.accent : null}
          indicatorColor={indicatorColor(status, layout.id)}
          reducedMotion={reducedMotion}
          onInspect={onInspect}
        >
          <SystemModel id={layout.id} status={status} reducedMotion={reducedMotion} />
        </SceneHotspot>
      ))}
    </group>
  );
}
