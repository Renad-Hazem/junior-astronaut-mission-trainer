import type { CSSProperties, PointerEvent } from "react";
import type { InputState } from "./sceneMath";

interface TouchControlsProps {
  onDirection: (direction: keyof InputState, pressed: boolean) => void;
  onInspect: () => void;
  canInspect: boolean;
}

const BUTTON_SIZE = 52;

const padStyle: CSSProperties = {
  position: "absolute",
  right: 16,
  bottom: 130,
  display: "grid",
  gridTemplateColumns: `repeat(3, ${BUTTON_SIZE}px)`,
  gridTemplateRows: `repeat(3, ${BUTTON_SIZE}px)`,
  gap: 4,
  touchAction: "none",
  userSelect: "none",
  zIndex: 20,
};

const buttonStyle: CSSProperties = {
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.6)",
  background: "rgba(20, 24, 40, 0.55)",
  color: "#fff",
  fontSize: 22,
  touchAction: "none",
  padding: 0,
  position: "relative",
  zIndex: 21,
};

const DIRECTIONS: readonly {
  dir: keyof InputState;
  label: string;
  glyph: string;
  area: string;
}[] = [
  { dir: "up", label: "Move up", glyph: "▲", area: "1 / 2" },
  { dir: "left", label: "Move left", glyph: "◀", area: "2 / 1" },
  { dir: "right", label: "Move right", glyph: "▶", area: "2 / 3" },
  { dir: "down", label: "Move down", glyph: "▼", area: "3 / 2" },
];

/** On-screen D-pad and Inspect button for touch devices (keyboard path is unchanged). */
export default function TouchControls({
  onDirection,
  onInspect,
  canInspect,
}: TouchControlsProps) {
  const press =
    (dir: keyof InputState) => (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onDirection(dir, true);
    };
  const release = (dir: keyof InputState) => () => onDirection(dir, false);

  return (
    <>
      <div style={padStyle}>
        {DIRECTIONS.map(({ dir, label, glyph, area }) => (
          <button
            key={dir}
            type="button"
            aria-label={label}
            style={{
              ...buttonStyle,
              gridRow: area.split(" / ")[0],
              gridColumn: area.split(" / ")[1],
            }}
            onPointerDown={press(dir)}
            onPointerUp={release(dir)}
            onPointerCancel={release(dir)}
            onLostPointerCapture={release(dir)}
            onContextMenu={(event) => event.preventDefault()}
          >
            {glyph}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onInspect}
        disabled={!canInspect}
        style={{
          ...buttonStyle,
          position: "absolute",
          zIndex: 21,
          right: 16,
          bottom: 16,
          width: 96,
          height: 64,
          fontSize: 16,
          fontWeight: 700,
          opacity: canInspect ? 1 : 0.45,
          display: "none",
        }}
      >
        Inspect
      </button>
    </>
  );
}
