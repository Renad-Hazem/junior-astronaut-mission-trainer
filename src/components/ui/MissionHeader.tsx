interface MissionHeaderProps {
  level: number
  title: string
  objective: string
  currentEvent: number
  eventCount: number
}

export function MissionHeader({ level, title, objective, currentEvent, eventCount }: MissionHeaderProps) {
  const progress = Math.round((currentEvent / eventCount) * 100)
  return (
    <header className="mission-header">
      <div>
        <span className="mission-chip">MISSION {level}</span>
        <h1>{title}</h1>
        <p><strong>Objective:</strong> {objective}</p>
      </div>
      <div className="mission-progress" aria-label={`Mission progress: step ${currentEvent} of ${eventCount}`}>
        <span>STEP {currentEvent} / {eventCount}</span>
        <div className="mission-progress__track"><span style={{ width: `${progress}%` }} /></div>
      </div>
    </header>
  )
}
