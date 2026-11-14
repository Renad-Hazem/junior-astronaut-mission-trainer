import type { MissionEvent, DecisionRecord } from '../../game/uiAdapter'

interface DecisionPanelProps {
  event: MissionEvent
  lastDecision: DecisionRecord | null
  isAwaitingContinue: boolean
  onChoose: (optionId: string) => void
  onContinue: () => void
}

export function DecisionPanel({ event, lastDecision, isAwaitingContinue, onChoose, onContinue }: DecisionPanelProps) {
  return (
    <section className="decision-panel panel" aria-labelledby="decision-title">
      <span className="section-kicker">YOUR DECISION</span>
      <h2 id="decision-title">What should Mission Control do?</h2>
      <div className="decision-options">
        {event.options.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`decision-option ${lastDecision?.optionId === item.id ? 'decision-option--selected' : ''}`}
            disabled={isAwaitingContinue}
            onClick={() => onChoose(item.id)}
          >
            <span className="decision-option__number">{index + 1}</span>
            <span><strong>{item.label}</strong><small>{item.preview}</small></span>
          </button>
        ))}
      </div>

      {lastDecision && (
        <div className="consequence-card" role="status" aria-live="polite">
          <span aria-hidden="true">✦</span>
          <div><strong>PIP’s mission note</strong><p>{lastDecision.consequence}</p></div>
        </div>
      )}

      <button type="button" className="primary-button decision-continue" disabled={!isAwaitingContinue} onClick={onContinue}>
        Continue Mission <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}
