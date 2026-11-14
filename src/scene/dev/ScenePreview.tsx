// Dev-only harness for MarsScene (see previewMain.tsx / preview.html).
// Lets QA/teammates exercise every prop without the game store or pages.

import { useState } from "react";
import type { HotspotId, LevelId, SceneStatus } from "../../game/types";
import MarsScene from "../MarsScene";

const LEVELS: LevelId[] = [
  "first-day-on-mars",
  "power-crisis",
  "oxygen-emergency",
  "mars-survival-challenge",
];
const STATUSES: SceneStatus[] = [
  "normal",
  "dust",
  "oxygen_alert",
  "radiation_alert",
  "restored",
];
const HOTSPOT_IDS: HotspotId[] = [
  "habitat",
  "solar",
  "oxygen",
  "water",
  "greenhouse",
  "communications",
  "rover",
];

export default function ScenePreview() {
  const [levelId, setLevelId] = useState<LevelId>("first-day-on-mars");
  const [status, setStatus] = useState<SceneStatus>("normal");
  const [highlighted, setHighlighted] = useState<HotspotId | "">("solar");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 8 }}>
        <label>
          Level{" "}
          <select
            value={levelId}
            onChange={(e) => setLevelId(e.target.value as LevelId)}
          >
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Status{" "}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SceneStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          highlightedHotspot{" "}
          <select
            value={highlighted}
            onChange={(e) => setHighlighted(e.target.value as HotspotId | "")}
          >
            <option value="">(none)</option>
            {HOTSPOT_IDS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />{" "}
          reducedMotion
        </label>
      </div>
      <MarsScene
        levelId={levelId}
        status={status}
        avatarId="avatar-01"
        highlightedHotspot={highlighted || undefined}
        reducedMotion={reducedMotion}
        onInspect={(id) =>
          setLog((prev) =>
            [
              `${new Date().toLocaleTimeString()} onInspect("${id}")`,
              ...prev,
            ].slice(0, 6),
          )
        }
      />
      <pre
        data-testid="inspect-log"
        style={{ margin: 0, padding: 8, minHeight: 60 }}
      >
        {log.length ? log.join("\n") : "onInspect calls appear here"}
      </pre>
    </div>
  );
}
