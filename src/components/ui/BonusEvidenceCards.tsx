import { BONUS_MISSION_05 } from '../../data/nasa/bonusMission05';
import {
  SOLAR_STORM_REPLAY_2024,
  type EvidenceCard,
} from '../../data/nasa/solarStormWatchSnapshot';

const kindLabels: Record<EvidenceCard['kind'], string> = {
  measurement: 'Actual measurement',
  'model-prediction': 'Computer-model prediction',
  'nasa-statement': 'NASA statement',
  'design-guidance': 'NASA design guidance',
};

function evidenceForEvents(eventIds: readonly string[]): EvidenceCard[] {
  const wanted = new Set(
    eventIds.flatMap((eventId) => BONUS_MISSION_05.eventEvidence[eventId] ?? []),
  );
  return SOLAR_STORM_REPLAY_2024.evidence.filter((card) => wanted.has(card.id));
}

export function BonusEvidenceCards({
  eventIds,
  heading = 'Real NASA evidence',
}: {
  eventIds: readonly string[];
  heading?: string;
}) {
  const cards = evidenceForEvents(eventIds);
  if (cards.length === 0) return null;

  return (
    <section className="bonus-evidence" aria-labelledby={`evidence-${eventIds.join('-')}`}>
      <div className="bonus-evidence__heading">
        <span className="section-kicker">HISTORICAL REPLAY · MAY 2024</span>
        <h3 id={`evidence-${eventIds.join('-')}`}>{heading}</h3>
        <p>
          Evidence below is historical. The six 0–100 resource changes are fictional
          training values and are not NASA measurements.
        </p>
      </div>
      <div className="bonus-evidence__grid">
        {cards.map((card) => (
          <article className="bonus-evidence-card" key={card.id}>
            <div className="bonus-evidence-card__chips">
              <span>{kindLabels[card.kind]}</span>
              <span>{card.location}</span>
            </div>
            <h4>{card.heading}</h4>
            <p>{card.body}</p>
            <details>
              <summary>More for older explorers</summary>
              <p>{card.detail}</p>
            </details>
            <a href={card.url} target="_blank" rel="noreferrer">
              {card.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
            <small>
              Historical source captured {card.provenance.retrievedAt.slice(0, 10)}.
              Not live data.
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
