import { useState } from 'react'
import { MissionHeader } from '../components/ui/MissionHeader'
import { ResourceDashboard } from '../components/ui/ResourceDashboard'
import { AlertCard } from '../components/ui/AlertCard'
import { DecisionPanel } from '../components/ui/DecisionPanel'
import { AvatarIdentity } from '../components/ui/AvatarIdentity'
import MarsScene from './__stubs__/MarsSceneAdapter'
import { missionLevels, resourceMeta, useGameStore, type HotspotId } from './__stubs__/gameAdapter'
import { useAvatarSelection } from './useAvatarSelection'

export function GameplayPage() {
  const store = useGameStore((state) => state)
  const { selectedAvatarId } = useAvatarSelection()
  const [inspectionResult, setInspectionResult] = useState<{ key: string; message: string; unlocked: boolean } | null>(null)
  const level = missionLevels.find((item) => item.id === store.activeLevelId)
  const event = level?.events[store.eventIndex]
  if (!level || !event) return <div className="page error-panel"><h1>Mission data is preparing…</h1><button className="primary-button" onClick={store.returnToLibrary}>Return to Mission Library</button></div>

  const objectiveKey = `${level.id}:${event.id}`
  const expectedHotspot = event.hotspotId ?? 'habitat'
  const isInspectionUnlocked = inspectionResult?.key === objectiveKey && inspectionResult.unlocked
  const inspectionMessage = inspectionResult?.key === objectiveKey
    ? inspectionResult.message
    : `Move toward the highlighted ${expectedHotspot.replace('_', ' ')} system, then press E. You can also use the accessible Inspect System control.`

  const inspect = (hotspot: HotspotId) => {
    const labels: Record<HotspotId, string> = {
      habitat: 'The sealed habitat keeps safe air and temperature around the crew.', solar: 'Solar panels turn sunlight into electrical power for base systems.',
      oxygen: 'The oxygen station monitors and supports the breathable-air reserve.', water: 'The water recycler cleans and recovers water for reuse.',
      greenhouse: 'The greenhouse grows food, but it also needs water and energy.', communications: 'The communications dish sends mission reports between Mars and Earth.',
      rover: 'The rover can inspect equipment where the crew should not travel during an alert.',
    }
    if (hotspot !== expectedHotspot) {
      setInspectionResult({
        key: objectiveKey,
        unlocked: false,
        message: `${labels[hotspot]} PIP says: useful discovery — but your current objective is the ${expectedHotspot.replace('_', ' ')} system.`,
      })
      return
    }

    setInspectionResult({
      key: objectiveKey,
      unlocked: true,
      message: `${labels[hotspot]} System identified! PIP has opened the mission response choices.`,
    })
  }

  return (
    <div className="gameplay-page page">
      <div className="gameplay-topbar">
        <button className="text-button" type="button" onClick={store.returnToLibrary}>← Mission Library</button>
        <div className="gameplay-cadet"><AvatarIdentity avatarId={selectedAvatarId} label="Exploring as" /><span className="signal"><i /> ASTER BASE ONLINE</span></div>
      </div>
      <MissionHeader level={level.order} title={level.title} objective={level.objective} currentEvent={store.eventIndex + 1} eventCount={level.events.length} />
      <div className="gameplay-layout">
        <ResourceDashboard resources={store.resources} />
        <section className="scene-panel panel" aria-label="Mars base inspection area">
          <div className="control-hint" aria-label="Movement controls"><span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span><span><kbd>E</kbd> Interact</span></div>
          <MarsScene avatarId={selectedAvatarId} levelId={level.id} status={event.sceneStatus} highlightedHotspot={event.hotspotId} onInspect={inspect} />
          <div className="inspection-control">
            <div><strong>{isInspectionUnlocked ? 'System ready' : 'Current objective'}</strong><p aria-live="polite">{inspectionMessage}</p></div>
            <button type="button" className="secondary-button" onClick={() => inspect(expectedHotspot)}>◎ Inspect {expectedHotspot.replace('_', ' ')}</button>
          </div>
        </section>
        <div className="gameplay-decisions">
          <AlertCard event={event} />
          {isInspectionUnlocked ? (
            <DecisionPanel
              event={event}
              lastDecision={store.lastDecision}
              isAwaitingContinue={store.isAwaitingContinue}
              onChoose={(optionId) => { if (!store.isAwaitingContinue) store.chooseOption(optionId) }}
              onContinue={store.continueMission}
            />
          ) : (
            <section className="decision-lock panel" aria-labelledby="decision-lock-title">
              <span className="decision-lock__icon" aria-hidden="true">⌖</span>
              <span className="section-kicker">EXPLORE FIRST</span>
              <h2 id="decision-lock-title">Find the {expectedHotspot.replace('_', ' ')} system</h2>
              <p>PIP will reveal your response choices after you inspect the correct equipment. Wrong systems never change your resources.</p>
              <div className="decision-lock__steps"><span>1 · Move</span><span>2 · Press E</span><span>3 · Decide</span></div>
            </section>
          )}
          <div className="current-focus"><span aria-hidden="true">⌖</span><div><strong>Current focus</strong><p>{event.hotspotId ? resourceMeta[event.hotspotId === 'solar' ? 'energy' : event.hotspotId === 'greenhouse' ? 'food' : event.hotspotId === 'water' ? 'water' : event.hotspotId === 'oxygen' ? 'oxygen' : 'temperature'].description : 'Connected base systems'}</p></div></div>
        </div>
      </div>
    </div>
  )
}
