import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MissionHeader } from "../components/ui/MissionHeader";
import { ResourceDashboard } from "../components/ui/ResourceDashboard";
import { AlertCard } from "../components/ui/AlertCard";
import { DecisionPanel } from "../components/ui/DecisionPanel";
import { AvatarIdentity } from "../components/ui/AvatarIdentity";
import { TaskPrompt } from "../components/ui/TaskPrompt";
import { AstroChatbot } from "../components/ui/AstroChatbot";
import { AudioSettings } from "../components/ui/AudioSettings";
import { BRAND } from "../components/ui/brand";
import {
  installGlobalAudio,
  playSound,
  useGameplayAudio,
  type SfxId,
} from "../audio";
import { generateContextualHint } from "../science/astroBotService";
// import MarsScene from './__stubs__/MarsSceneAdapter'
import MarsScene from "../scene/MarsScene";
import {
  bonusMission,
  missionLevels,
  useGameStore,
  type HotspotId,
} from "../game/uiAdapter";
import { BONUS_MISSION_05, BONUS_MISSION_05_ID } from "../data/nasa/bonusMission05";
import type { RoverConsoleCloseReason } from "../minigames/solar-panel/SolarRoverConsole";
import type { SolarSoundEffect } from "../minigames/solar-panel/types";
import { useAvatarSelection } from "./useAvatarSelection";

const gameplayKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "e",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

const BonusEvidenceCards = lazy(() =>
  import("../components/ui/BonusEvidenceCards").then((module) => ({
    default: module.BonusEvidenceCards,
  })),
);

// Optional Level 2 activity: remotely operate the base's solar-panel cleaning
// rover (Solar Panel Dust Rescue). Practice only: it never changes resources and
// never chooses a decision. The event's three decisions stay authoritative.
const SOLAR_ROVER_EVENT_ID = "l2-e2-solar-cleanup";
const SolarRoverConsole = lazy(
  () => import("../minigames/solar-panel/SolarRoverConsole"),
);
/**
 * Existing registry sounds only: a quiet tick per brush stroke, a scan on retry,
 * and the soft "card opens" swipe when the science card appears on success.
 * (Not "game-startup": it shares a cooldown with the audio-unlock chime and means "game starting".)
 */
const ROVER_SOUNDS: Record<SolarSoundEffect, SfxId> = {
  brush: "menu-navigate",
  power_up: "inspect-system",
  complete: "brief-open",
};

interface RoverActivity {
  /** Objective (`level:event`) this state belongs to; any other objective ignores it. */
  key: string;
  open: boolean;
  /** Successful cleaning passes. Display only: never converted into resources. */
  passes: number;
  lastClose: RoverConsoleCloseReason | null;
}

// App imports this page statically, so this runs at app start. It attaches the
// passive gesture/visibility/menu-click listeners once (idempotent). Nothing plays
// until the first user gesture. Move this to App.tsx if its owner prefers.
installGlobalAudio();

export function GameplayPage() {
  const store = useGameStore((state) => state);
  const { selectedAvatarId, customPhotoUrl } = useAvatarSelection();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | null>(null);
  const [inspectionResult, setInspectionResult] = useState<{
    key: string;
    message: string;
    unlocked: boolean;
  } | null>(null);
  const [roverActivity, setRoverActivity] = useState<RoverActivity | null>(null);
  const inspectButtonRef = useRef<HTMLButtonElement>(null);
  const contextPanelRef = useRef<HTMLElement>(null);
  const roverButtonRef = useRef<HTMLButtonElement>(null);
  const wasContextOpen = useRef(false);
  const wasRoverOpen = useRef(false);
  const level = [...missionLevels, bonusMission].find(
    (item) => item.id === store.activeLevelId,
  );
  const event = level?.events[store.eventIndex];

  const objectiveKey = level && event ? `${level.id}:${event.id}` : "";
  const expectedHotspot = event?.hotspotId ?? "habitat";
  const targetName = expectedHotspot.replace("_", " ");
  const isInspectionUnlocked = Boolean(
    inspectionResult?.key === objectiveKey && inspectionResult.unlocked,
  );
  const inspectionMessage =
    inspectionResult?.key === objectiveKey
      ? inspectionResult.message
      : `Move toward the highlighted ${targetName} system, then press E. The accessible Inspect System control follows the same UI path.`;
  // Rover state only applies to the objective it was opened for (replays start fresh).
  const rover = roverActivity?.key === objectiveKey ? roverActivity : null;
  const isRoverOpen = Boolean(rover?.open);
  // Movement, touch d-pad, E-inspect and footsteps all stop while any panel is open.
  const sceneInputLocked = isInspectionUnlocked || isChatOpen || isRoverOpen;

  useEffect(() => {
    if (isInspectionUnlocked) {
      const panel = contextPanelRef.current;
      // The first decision option keeps the initial focus (as before); the optional
      // rover button above it is one Shift+Tab away.
      (
        panel?.querySelector<HTMLButtonElement>(".decision-option:not(:disabled)") ??
        panel?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      )?.focus();
    } else if (wasContextOpen.current) {
      inspectButtonRef.current?.focus();
    }
    wasContextOpen.current = isInspectionUnlocked;
  }, [isInspectionUnlocked, objectiveKey]);

  // Leaving the rover console returns focus to the button that opened it.
  useEffect(() => {
    if (wasRoverOpen.current && !isRoverOpen) {
      (
        roverButtonRef.current ??
        contextPanelRef.current?.querySelector<HTMLButtonElement>(".decision-option:not(:disabled)")
      )?.focus();
    }
    wasRoverOpen.current = isRoverOpen;
  }, [isRoverOpen]);

  useEffect(() => {
    if (!isInspectionUnlocked) return;
    const blockGameplayInput = (keyboardEvent: KeyboardEvent) => {
      // The rover console needs arrows and Space for its own controls. The scene
      // is input-locked while it is open, so these keys cannot move the astronaut.
      if (
        keyboardEvent.target instanceof Element &&
        keyboardEvent.target.closest("[data-rover-console]")
      ) {
        return;
      }
      if (gameplayKeys.has(keyboardEvent.key.toLowerCase())) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopImmediatePropagation();
      }
    };
    window.addEventListener("keydown", blockGameplayInput, true);
    return () =>
      window.removeEventListener("keydown", blockGameplayInput, true);
  }, [isInspectionUnlocked]);

  // Sound only observes the game; it never changes resources or decisions.
  const { observeRoot: observeAudioRoot, onMovementChange } = useGameplayAudio({
    sceneStatus: event?.sceneStatus ?? "normal",
    inputLocked: sceneInputLocked,
  });

  // The console reports each successful pass once. Counting it is display-only.
  const recordRoverPass = useCallback(() => {
    setRoverActivity((current) =>
      current ? { ...current, passes: current.passes + 1 } : current,
    );
  }, []);
  const playRoverSound = useCallback((effect: SolarSoundEffect) => {
    playSound(ROVER_SOUNDS[effect]);
  }, []);
  const closeRoverConsole = useCallback((reason: RoverConsoleCloseReason) => {
    setRoverActivity((current) =>
      current ? { ...current, open: false, lastClose: reason } : current,
    );
  }, []);

  if (!level || !event) {
    return (
      <div className="page error-panel">
        <h1>Mission data is preparing…</h1>
        <button className="primary-button" onClick={store.returnToLibrary}>
          Return to Mission Library
        </button>
      </div>
    );
  }

  const inspect = (hotspot: HotspotId) => {
    playSound("inspect-system");
    const labels: Record<HotspotId, string> = {
      habitat:
        "The sealed habitat keeps safe air and temperature around the crew.",
      solar:
        "Solar panels turn sunlight into electrical power for base systems.",
      oxygen:
        "The oxygen station monitors and supports the breathable-air reserve.",
      water: "The water recycler cleans and recovers water for reuse.",
      greenhouse:
        "The greenhouse grows food, but it also needs water and energy.",
      communications:
        "The communications dish sends mission reports between Mars and Earth.",
      rover:
        "The rover can inspect equipment where the crew should not travel during an alert.",
    };

    if (hotspot !== expectedHotspot) {
      setInspectionResult({
        key: objectiveKey,
        unlocked: false,
        message: `${labels[hotspot]} PIP says: useful discovery — but your current objective is the ${targetName} system.`,
      });
      return;
    }

    setInspectionResult({
      key: objectiveKey,
      unlocked: true,
      message: `${labels[hotspot]} System identified! PIP has opened the contextual mission response.`,
    });
  };

  const keepFocusInContextPanel = (
    keyboardEvent: ReactKeyboardEvent<HTMLElement>,
  ) => {
    if (keyboardEvent.key !== "Tab" || !contextPanelRef.current) return;
    const focusable = Array.from(
      contextPanelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], details > summary, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  };

  const isRoverEvent = event.id === SOLAR_ROVER_EVENT_ID;
  const openRoverConsole = () => {
    setRoverActivity((current) => ({
      key: objectiveKey,
      open: true,
      passes: current?.key === objectiveKey ? current.passes : 0,
      lastClose: current?.key === objectiveKey ? current.lastClose : null,
    }));
  };

  return (
    <div
      ref={observeAudioRoot}
      className={`gameplay-page ${isInspectionUnlocked ? "gameplay-page--context-open" : ""}`}
      // While the rover console (portalled to <body>) is open, the rest of the page is inert.
      inert={isRoverOpen ? true : undefined}
    >
      <section className="gameplay-stage" aria-label="Mars mission gameplay">
        <div
          className="gameplay-scene-surface"
          aria-hidden={isInspectionUnlocked ? "true" : undefined}
          inert={isInspectionUnlocked ? true : undefined}
        >
          <MarsScene
            avatarId={selectedAvatarId}
            customPhotoUrl={customPhotoUrl}
            levelId={level.id}
            status={event.sceneStatus}
            highlightedHotspot={event.hotspotId}
            onInspect={inspect}
            inputLocked={sceneInputLocked}
            // Footsteps follow the scene's real-displacement signal (see src/scene/sceneCallbacks.ts).
            onMovementChange={onMovementChange}
          />
        </div>

        <header className="gameplay-command-bar">
          <button
            className="gameplay-back-button"
            type="button"
            data-audio="nav"
            onClick={store.returnToLibrary}
          >
            <span aria-hidden="true">←</span>
            <span>Mission Library</span>
          </button>
          <span className="fallback-badge">3D MARS LINK</span>
          <div className="gameplay-cadet">
            <AvatarIdentity avatarId={selectedAvatarId} label="Exploring as" />
            <span className="signal">
              <i /> {BRAND.siteName} · LOCAL SESSION
            </span>
            <AudioSettings />
            <button
              type="button"
              className="astrobot-command-btn"
              onClick={() => {
                const hintQuery = generateContextualHint(
                  level.title,
                  event.headline,
                  event.prompt,
                  targetName,
                  store.resources
                );
                setChatInitialPrompt(hintQuery);
                setIsChatOpen(true);
              }}
              title={`Open ${BRAND.assistantName} science guide`}
            >
              <span className="astrobot-btn-icon">🤖</span>
              <span><strong>{BRAND.assistantName}</strong><small>Source-linked mission guide</small></span>
            </button>
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

        {level.id === BONUS_MISSION_05_ID && (
          <div className="bonus-replay-badge" role="note">
            <strong>Real event replay · 20 May 2024</strong>
            <span>Historical NASA evidence · not live space-weather data</span>
            <p>{BONUS_MISSION_05.pipOpening}</p>
          </div>
        )}

        <div className="gameplay-resource-hud">
          <ResourceDashboard
            resources={store.resources}
            title="Base systems"
            compact
          />
        </div>

        <div className="control-hint" aria-label="Movement controls">
          <span>
            <kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move
          </span>
          <span>
            <kbd>E</kbd> Interact
          </span>
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
          <span className="pip-avatar" aria-hidden="true">
            PIP
          </span>
          <p>
            <strong>{event.headline}</strong>
            {event.prompt}
          </p>
          <button
            type="button"
            className="pip-ask-astrobot-btn"
            onClick={() => {
              const hintQuery = generateContextualHint(
                level.title,
                event.headline,
                event.prompt,
                targetName,
                store.resources
              );
              setChatInitialPrompt(hintQuery);
              setIsChatOpen(true);
            }}
          >
            💡 Ask AstroBot for Hint
          </button>
        </div>

        {isInspectionUnlocked && (
          <div className="contextual-layer">
            <section
              ref={contextPanelRef}
              className="contextual-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contextual-panel-title"
              onKeyDown={keepFocusInContextPanel}
            >
              <div className="contextual-panel__heading">
                <div>
                  <span className="section-kicker">SYSTEM INSPECTED</span>
                  <h2 id="contextual-panel-title">{targetName} response</h2>
                </div>
                <span className="contextual-panel__safety">
                  MOVEMENT PAUSED
                </span>
              </div>
              <AlertCard event={event} />
              {isRoverEvent && !store.isAwaitingContinue && (
                <section
                  className="rover-activity-card"
                  aria-labelledby="rover-activity-title"
                  data-rover-passes={rover?.passes ?? 0}
                >
                  <div className="rover-activity-card__copy">
                    <span className="section-kicker">
                      OPTIONAL · REMOTE ROVER PRACTICE
                    </span>
                    <h3 id="rover-activity-title">
                      Steer the cleaning rover from inside the habitat
                    </h3>
                    <p>
                      Drive the base&rsquo;s small cleaning rover by remote control
                      and brush dust off the solar array. It is practice only: it
                      never changes a resource or picks a decision for you. Skip it
                      any time and choose below.
                    </p>
                    {rover && rover.passes > 0 ? (
                      <p className="rover-activity-card__status" role="status">
                        ✓ Cleaning pass complete. Practice only: your decision
                        below still sets the Energy result.
                      </p>
                    ) : rover?.lastClose === "cancelled" ? (
                      <p className="rover-activity-card__status" role="status">
                        Rover console closed. Nothing changed.
                      </p>
                    ) : null}
                  </div>
                  <button
                    ref={roverButtonRef}
                    type="button"
                    className="secondary-button rover-activity-card__button"
                    data-audio="nav"
                    onClick={openRoverConsole}
                  >
                    Operate Cleaning Rover
                  </button>
                </section>
              )}
              <DecisionPanel
                event={event}
                lastDecision={store.lastDecision}
                isAwaitingContinue={store.isAwaitingContinue}
                onChoose={(optionId) => {
                  if (!store.isAwaitingContinue) store.chooseOption(optionId);
                }}
                onContinue={store.continueMission}
              />
              {level.id === BONUS_MISSION_05_ID && store.lastDecision && (
                <Suspense fallback={<p className="bonus-evidence-loading">Loading historical evidence…</p>}>
                  <BonusEvidenceCards
                    eventIds={[event.id]}
                    heading="Evidence for this decision"
                  />
                </Suspense>
              )}
              <div className="contextual-hint-row">
                <button
                  type="button"
                  className="secondary-button ask-astrobot-context-btn"
                  onClick={() => {
                    const hintQuery = `We are responding to the ${targetName} crisis in "${level.title} - ${event.headline}". What are the critical science factors to consider for the crew?`;
                    setChatInitialPrompt(hintQuery);
                    setIsChatOpen(true);
                  }}
                >
                  🤖 Consult AstroBot before deciding
                </button>
              </div>
              <p className="task-contract-note">
                Scan, carry, install and repair presentation will connect here
                after Malak and Renad approve the shared runtime contract. This
                UI does not claim those world interactions are implemented.
              </p>
            </section>
          </div>
        )}
      </section>

      <AstroChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentMissionContext={`${level.title} · Sol ${store.eventIndex + 1} · ${targetName} System`}
        initialPrompt={chatInitialPrompt}
        onClearInitialPrompt={() => setChatInitialPrompt(null)}
      />

      {isRoverOpen && (
        <Suspense
          fallback={
            <div className="rover-console-loading" role="status">
              Connecting to the cleaning rover…
            </div>
          }
        >
          <SolarRoverConsole
            onComplete={recordRoverPass}
            onClose={closeRoverConsole}
            onSoundEffect={playRoverSound}
            returnLabel="Back to mission decisions"
            resultNote="This practice does not change base resources: your mission decision still decides the Energy result."
          />
        </Suspense>
      )}
    </div>
  );
}
