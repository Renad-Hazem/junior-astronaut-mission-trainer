import type { MissionEvent } from '../../pages/integration/gameUi'

export function AlertCard({ event }: { event: MissionEvent }) {
  return (
    <div className="alert-card" role="status" aria-live="polite">
      <div className="pip-avatar" aria-hidden="true">PIP</div>
      <div>
        <span className="section-kicker">SYSTEM UPDATE</span>
        <h2>{event.headline}</h2>
        <p>{event.prompt}</p>
      </div>
    </div>
  )
}
