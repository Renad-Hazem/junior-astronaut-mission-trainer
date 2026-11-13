import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { MissionHeader } from '../components/ui/MissionHeader'
import { ResourceDashboard } from '../components/ui/ResourceDashboard'
import { AlertCard } from '../components/ui/AlertCard'
import { DecisionPanel } from '../components/ui/DecisionPanel'
import { AvatarIdentity } from '../components/ui/AvatarIdentity'
import { TaskPrompt } from '../components/ui/TaskPrompt'
import MarsScene from './__stubs__/MarsSceneAdapter'
import { missionLevels, useGameStore, type HotspotId } from './__stubs__/gameAdapter'
import { useAvatarSelection } from './useAvatarSelection'

const gameplayKeys = new Set(['w', 'a', 's', 'd', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'])

export function GameplayPage() {
  const store = useGameStore((state) => state)
  const { selectedAvatarId } = useAvatarSelection()
  const [inspectionResult, setInspectionResult] = useState<{ key: string; message: string; unlocked: boolean } | null>(null)
  const inspectButtonRef = useRef<HTMLButtonElement>(null)
  const contextPanelRef = useRef<HTMLElement>(null)
  const wasContextOpen = useRef(false)
  const level = missionLevels.find((item) => item.id === store.activeLevelId)
  const event = level?.events[store.eventIndex]

  const objectiveKey = level && event ? `${level.id}:${event.id}` : ''
  const expectedHotspot = event?.hotspotId ?? 'habitat'
  const targetName = expectedHotspot.replace('_', ' ')
  const isInspectionUnlocked = Boolean(inspectionResult?.key === objectiveKey && inspectionResult.unlocked)
  const inspectionMessage = inspectionResult?.key === objectiveKey
    ? inspectionResult.message
    : `Move toward the highlighted ${targetName} system, then press E. The accessible Inspect System control follows the same UI path.`

  useEffect(() => {
    if (isInspectionUnlocked) {
      contextPanelRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    } else if (wasContextOpen.current) {
      inspectButtonRef.current?.focus()
    }
    wasContextOpen.current = isInspectionUnlocked
  }, [isInspectionUnlocked, objectiveKey])

  useEffect(() => {
    if (!isInspectionUnlocked) return
    const blockGameplayInput = (keyboardEvent: KeyboardEvent) => {
      if (gameplayKeys.has(keyboardEvent.key.toLowerCase())) {
        keyboardEvent.preventDefault()
        keyboardEvent.stopImmediatePropagation()
      }
    }
    window.addEventListener('keydown', blockGameplayInput, true)
    return () => window.removeEventListener('keydown', blockGameplayInput, true)
  }, [isInspectionUnlocked])

  if (!level || !event) {
    return (
      <div className="page error-panel">
        <h1>Mission data is preparing…</h1>
        <button className="primary-button" onClick={store.returnToLibrary}>Return to Mission Library</button>
      </div>
    )
  }

  const inspect = (hotspot: HotspotId) => {
    const labels: Record<HotspotId, string> = {
      habitat: 'The sealed habitat keeps safe air and temperature around the crew.',
      solar: 'Solar panels turn sunlight into electrical power for base systems.',
      oxygen: 'The oxygen station monitors and supports the breathable-air reserve.',
      water: 'The water recycler cleans and recovers water for reuse.',
      greenhouse: 'The greenhouse grows food, but it also needs water and energy.',
      communications: 'The communications dish sends mission reports between Mars and Earth.',
      rover: 'The rover can inspect equipment where the crew should not travel during an alert.',
    }

    if (hotspot !== expectedHotspot) {
      setInspectionResult({
        key: objectiveKey,
        unlocked: false,
        message: `${labels[hotspot]} PIP says: useful discovery — but your current objective is the ${targetName} system.`,
      })
      return
    }

    setInspectionResult({
      key: objectiveKey,
      unlocked: true,
      message: `${labels[hotspot]} System identified! PIP has opened the contextual mission response.`,
    })
  }

  const keepFocusInContextPanel = (keyboardEvent: ReactKeyboardEvent<HTMLElement>) => {
    if (keyboardEvent.key !== 'Tab' || !contextPanelRef.current) return
    const focusable = Array.from(contextPanelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], details > summary, [tabindex]:not([tabindex="-1"])'))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault()
      last.focus()
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={`gameplay-page ${isInspectionUnlocked ? 'gameplay-page--context-open' : ''}`}>
      <section className="gameplay-stage" aria-label="Mars mission gameplay">
        <div className="gameplay-scene-surface" aria-hidden={isInspectionUnlocked ? 'true' : undefined} inert={isInspectionUnlocked ? true : undefined}>
          <MarsScene
            avatarId={selectedAvatarId}
            levelId={level.id}
            status={event.sceneStatus}
            highlightedHotspot={event.hotspotId}
            onInspect={inspect}
          />
        </div>

        <header className="gameplay-command-bar">
          <button className="gameplay-back-button" type="button" onClick={store.returnToLibrary}>
            <span aria-hidden="true">←</span>
            <span>Mission Library</span>
          </button>
          <span className="fallback-badge">UI SCENE FALLBACK</span>
          <div className="gameplay-cadet">
            <AvatarIdentity avatarId={selectedAvatarId} label="Exploring as" />
            <span className="signal"><i /> ASTER BASE ONLINE</span>
          </div>
        </header>

        <div className="gameplay-objective-hud">
          <MissionHeader
            level={level.order}
            title={level.title}
            objective={level.objective}
            currentEvent={store.eventIndex + 1}
            eventCount={level.events.length}
          />
        </div>

        <div className="gameplay-resource-hud">
          <ResourceDashboard resources={store.resources} title="Base systems" compact />
        </div>

        <div className="control-hint" aria-label="Movement controls">
          <span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span>
          <span><kbd>E</kbd> Interact</span>
        </div>

        <div className="gameplay-task-hud">
          <TaskPrompt
            targetName={targetName}
            message={inspectionMessage}
            isReady={isInspectionUnlocked}
            onInspect={() => inspect(expectedHotspot)}
            inspectButtonRef={inspectButtonRef}
          />
        </div>

        <div className="gameplay-pip-hint">
          <span className="pip-avatar" aria-hidden="true">PIP</span>
          <p><strong>{event.headline}</strong>{event.prompt}</p>
        </div>

        {isInspectionUnlocked && (
          <div className="contextual-layer">
            <section ref={contextPanelRef} className="contextual-panel" role="dialog" aria-modal="true" aria-labelledby="contextual-panel-title" onKeyDown={keepFocusInContextPanel}>
              <div className="contextual-panel__heading">
                <div>
                  <span className="section-kicker">SYSTEM INSPECTED</span>
                  <h2 id="contextual-panel-title">{targetName} response</h2>
                </div>
                <span className="contextual-panel__safety">MOVEMENT PAUSED</span>
              </div>
              <AlertCard event={event} />
              <DecisionPanel
                event={event}
                lastDecision={store.lastDecision}
                isAwaitingContinue={store.isAwaitingContinue}
                onChoose={(optionId) => {
                  if (!store.isAwaitingContinue) store.chooseOption(optionId)
                }}
                onContinue={store.continueMission}
              />
              <p className="task-contract-note">Scan, carry, install and repair presentation will connect here after Malak and Renad approve the shared runtime contract. This UI does not claim those world interactions are implemented.</p>
            </section>
          </div>
        )}
      </section>
    </div>
  )
}
