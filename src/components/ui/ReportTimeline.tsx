import { resourceMeta, type DecisionRecord, type ResourceKey } from '../../pages/integration/gameUi'

const deltaText = (record: DecisionRecord) => {
  const entries = Object.entries(record.deltaApplied) as [ResourceKey, number][]
  return entries.map(([key, value]) => `${resourceMeta[key].label} ${value > 0 ? '+' : ''}${value}`).join(' · ')
}

export function ReportTimeline({ decisions }: { decisions: DecisionRecord[] }) {
  return (
    <ol className="report-timeline">
      {decisions.map((decision, index) => (
        <li key={decision.eventId}>
          <span className="timeline-number">{index + 1}</span>
          <div>
            <span className="section-kicker">{decision.eventTitle}</span>
            <h3>{decision.optionLabel}</h3>
            <p>{decision.consequence}</p>
            <div className="delta-pill">{deltaText(decision) || 'No resource change'}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
