import { useState } from 'react'
import { MissionHeader } from '../components/ui/MissionHeader'
import { ResourceDashboard } from '../components/ui/ResourceDashboard'
import { AlertCard } from '../components/ui/AlertCard'
import { DecisionPanel } from '../components/ui/DecisionPanel'
import MarsScene from './__stubs__/MarsSceneAdapter'
import { missionLevels, resourceMeta, useGameStore, type HotspotId } from './__stubs__/gameAdapter'

export function GameplayPage() {
  const store = useGameStore((state) => state)
  const [inspection, setInspection] = useState('Select a glowing system or use the Inspect System button for a text description.')
  const level = missionLevels.find((item) => item.id === store.activeLevelId)
  const event = level?.events[store.eventIndex]
  if (!level || !event) return <div className="page error-panel"><h1>Mission data is preparing…</h1><button className="primary-button" onClick={store.returnToLibrary}>Return to Mission Library</button></div>

  const inspect = (hotspot: HotspotId) => {
    const labels: Record<HotspotId, string> = {
      habitat: 'The sealed habitat keeps safe air and temperature around the crew.', solar: 'Solar panels turn sunlight into electrical power for base systems.',
      oxygen: 'The oxygen station monitors and supports the breathable-air reserve.', water: 'The water recycler cleans and recovers water for reuse.',
      greenhouse: 'The greenhouse grows food, but it also needs water and energy.', communications: 'The communications dish sends mission reports between Mars and Earth.',
      rover: 'The rover can inspect equipment where the crew should not travel during an alert.',
    }
    setInspection(labels[hotspot])
  }

  return (
    <div className="gameplay-page page">
      <div className="gameplay-topbar">
        <button className="text-button" type="button" onClick={store.returnToLibrary}>← Mission Library</button>
        <span className="signal"><i /> ASTER BASE ONLINE</span>
      </div>
      <MissionHeader level={level.order} title={level.title} objective={level.objective} currentEvent={store.eventIndex + 1} eventCount={level.events.length} />
      <div className="gameplay-layout">
        <ResourceDashboard resources={store.resources} />
        <section className="scene-panel panel" aria-label="Mars base inspection area">
          <MarsScene levelId={level.id} status={event.sceneStatus} highlightedHotspot={event.hotspotId} onInspect={inspect} />
          <div className="inspection-control">
            <div><strong>Inspection log</strong><p aria-live="polite">{inspection}</p></div>
            <button type="button" className="secondary-button" onClick={() => inspect(event.hotspotId ?? 'habitat')}>◎ Inspect System</button>
          </div>
        </section>
        <div className="gameplay-decisions">
          <AlertCard event={event} />
          <DecisionPanel event={event} lastDecision={store.lastDecision} isAwaitingContinue={store.isAwaitingContinue} onChoose={store.chooseOption} onContinue={store.continueMission} />
          <div className="current-focus"><span aria-hidden="true">⌖</span><div><strong>Current focus</strong><p>{event.hotspotId ? resourceMeta[event.hotspotId === 'solar' ? 'energy' : event.hotspotId === 'greenhouse' ? 'food' : event.hotspotId === 'water' ? 'water' : event.hotspotId === 'oxygen' ? 'oxygen' : 'temperature'].description : 'Connected base systems'}</p></div></div>
        </div>
      </div>
    </div>
  )
}
