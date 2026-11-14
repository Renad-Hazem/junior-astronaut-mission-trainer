# Gameplay state transitions

This report documents the reliability behavior implemented by the game engine.
It does not change mission content or the UI/scene ownership boundaries.

## Mission selection and progression

- A fresh or rejected save has no completed mission IDs. Level 1 is the only
  unlocked mission.
- `selectLevel(id)` rejects unknown and locked IDs inside the engine, even when
  called without the Mission Library UI.
- Completing every authored event in a mission adds that mission to the
  completed prefix and unlocks the next mission.
- Replaying a completed mission keeps all previously completed progress.
- `restartLevel()` resets only the active run. `returnToLibrary()` clears only
  the active run. Both preserve completed progress.

## Decision transition

1. An unresolved event accepts one valid choice ID.
2. Its opening effects and choice effects are applied together and clamped to
   0-100.
3. One immutable choice record is stored and further choices are rejected.
4. The explicit Continue action either advances exactly one event or finishes
   the mission and builds its Mission Brief.

Invalid choice IDs and repeated Choice/Continue actions are no-ops.

## Stabilization transition

When a choice exhausts any resource, the engine records the decision, applies
the effects once, and builds a child-friendly Stabilization Brief. It then
enters a terminal-pending state:

- `isStabilizationTriggered` is true;
- `resolvedChoiceForCurrentEvent` and its consequence remain visible;
- `isMissionComplete` stays false so the existing Continue control remains
  available;
- further choices are rejected.

The next explicit Continue marks the run terminal so the navigation adapter
opens the Stabilization Brief. It does not advance the event and does not add a
completed mission ID, so no later mission is unlocked. Replay and return to the
Mission Library remain available.

## Persistence contract

- Storage key: `mars-base:game-progress:v1`.
- Schema version: `1`.
- Persisted data: only the ordered `completedLevelIds` array.
- Unknown, duplicated, non-string, or out-of-order values cannot unlock later
  missions. The engine accepts only the valid consecutive completion prefix.
- Missing, blocked, or malformed storage falls back to a fresh in-memory state.
