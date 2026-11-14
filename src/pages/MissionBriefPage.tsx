import { ResourceBar } from "../components/ui/ResourceBar";
import { ReportTimeline } from "../components/ui/ReportTimeline";
import {
  isLevelUnlocked,
  missionLevels,
  resourceMeta,
  scienceFacts,
  useGameStore,
  type ResourceKey,
} from "../game/uiAdapter";

const resourceOrder = Object.keys(resourceMeta) as ResourceKey[];

export function MissionBriefPage() {
  const report = useGameStore((state) => state.currentReport);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const restartLevel = useGameStore((state) => state.restartLevel);
  const returnToLibrary = useGameStore((state) => state.returnToLibrary);
  const completedLevelIds = useGameStore((state) => state.completedLevelIds);
  if (!report)
    return (
      <div className="page error-panel">
        <h1>Mission Brief is preparing…</h1>
        <button className="primary-button" onClick={returnToLibrary}>
          Mission Library
        </button>
      </div>
    );
  const currentIndex = missionLevels.findIndex(
    (level) => level.id === report.levelId,
  );
  const nextLevel = missionLevels[currentIndex + 1];
  const nextLevelUnlocked = nextLevel
    ? isLevelUnlocked(nextLevel.id, completedLevelIds)
    : false;
  const facts = report.scienceFactIds
    .map((id) => scienceFacts[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="brief-page page">
      <header className="brief-hero">
        <span className="brief-stars" aria-hidden="true">
          ✦ ✧ ✦
        </span>
        <span className="eyebrow">TRANSMISSION RECEIVED · ASTER BASE</span>
        <h1>MISSION BRIEF</h1>
        <p>{report.title}</p>
        <div className="completion-badge">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>
              {report.status === "reviewed"
                ? "Mission Reviewed"
                : report.status === "stabilized"
                  ? "Crew Stabilized"
                  : "Support Needed"}
            </strong>
            <small>
              {report.status === "reviewed"
                ? nextLevel
                  ? `Mission 0${nextLevel.order} is now ready to play.`
                  : "The four-mission training campaign is complete."
                : report.status === "stabilized"
                  ? "The crew stabilized the base. Review your decisions and continue training."
                  : "The crew still needs support. Review the mission and try a different strategy."}
            </small>
          </div>
        </div>
      </header>

      <div className="brief-content">
        <section
          className="brief-section resource-comparison"
          aria-labelledby="resources-review-title"
        >
          <div className="section-heading">
            <span className="section-kicker">SYSTEMS REVIEW</span>
            <h2 id="resources-review-title">How your resources changed</h2>
            <p>
              These are fictional 0–100 scores designed to show cause and
              effect.
            </p>
          </div>
          <div className="comparison-table">
            <div className="comparison-head">
              <span>RESOURCE</span>
              <span>START</span>
              <span>FINAL</span>
              <span>CHANGE</span>
            </div>
            {resourceOrder.map((key) => {
              const delta = report.ended[key] - report.started[key];
              return (
                <div className="comparison-row" key={key}>
                  <div>
                    <span aria-hidden="true">{resourceMeta[key].icon}</span>
                    <strong>{resourceMeta[key].label}</strong>
                  </div>
                  <ResourceBar
                    compact
                    resourceKey={key}
                    value={report.started[key]}
                  />
                  <ResourceBar
                    compact
                    resourceKey={key}
                    value={report.ended[key]}
                  />
                  <span
                    className={`delta-number ${delta >= 0 ? "delta-number--positive" : "delta-number--negative"}`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="brief-section" aria-labelledby="timeline-title">
          <div className="section-heading">
            <span className="section-kicker">YOUR MISSION LOG</span>
            <h2 id="timeline-title">Decisions and consequences</h2>
            <p>
              Every engineering choice changes more than one part of the base.
            </p>
          </div>
          <ReportTimeline decisions={report.decisions} />
        </section>

        <section className="brief-section" aria-labelledby="science-title">
          <div className="section-heading">
            <span className="section-kicker">WHAT SCIENCE SAYS</span>
            <h2 id="science-title">Discover the real science</h2>
            <p>
              Resource effects are fictional; these learning notes are based on
              the linked NASA sources.
            </p>
          </div>
          <div className="science-grid">
            {facts.map((fact) => (
              <article className="science-card" key={fact.id}>
                <span className="science-card__icon" aria-hidden="true">
                  ✦
                </span>
                <h3>{fact.title}</h3>
                <p>{fact.childFriendlyText}</p>
                <details>
                  <summary>Explore the deeper science</summary>
                  <p>{fact.advancedText}</p>
                </details>
                <a href={fact.sourceUrl} target="_blank" rel="noreferrer">
                  Learn more at NASA <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="strategy-card">
          <span aria-hidden="true">💡</span>
          <div>
            <span className="section-kicker">TRY THIS NEXT TIME</span>
            <h2>Think like a systems engineer</h2>
            <p>{report.suggestion}</p>
          </div>
        </section>

        <nav className="brief-actions" aria-label="Mission Brief actions">
          <button
            type="button"
            className="secondary-button"
            onClick={returnToLibrary}
          >
            ← Mission Library
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={restartLevel}
          >
            ↻ Replay Mission
          </button>
          {nextLevel && nextLevelUnlocked && (
            <button
              type="button"
              className="primary-button"
              onClick={() => selectLevel(nextLevel.id)}
            >
              Next Mission: {nextLevel.title} →
            </button>
          )}
        </nav>
      </div>
      <footer className="site-footer">
        Science sources: NASA · This educational simulation is not endorsed by
        NASA.
      </footer>
    </div>
  );
}
