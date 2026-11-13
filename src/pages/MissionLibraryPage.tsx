import { missionLevels, useGameStore } from './__stubs__/gameAdapter'

const missionIcons = ['🚀', '☀️', 'O₂', '🛡️']

export function MissionLibraryPage() {
  const selectLevel = useGameStore((state) => state.selectLevel)
  return (
    <div className="library-page page">
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">⌁</span><span>ASTER BASE<small>MISSION NETWORK</small></span></div>
        <span className="cadet-badge">CADET NOVA · READY</span>
      </header>
      <section className="page-intro">
        <span className="eyebrow">CHOOSE YOUR NEXT CHALLENGE</span>
        <h1>Mission Library</h1>
        <p>Every mission is open for training. Start with Mission 01 or jump straight to the system you want to master.</p>
      </section>
      <section className="mission-grid" aria-label="Available missions">
        {missionLevels.map((level, index) => (
          <article className={`mission-card mission-card--${index + 1}`} key={level.id}>
            <div className="mission-card__visual"><span className="mission-card__number">0{level.order}</span><span className="mission-card__icon" aria-hidden="true">{missionIcons[index]}</span><span className="mission-card__minutes">{level.estimatedMinutes[0]}–{level.estimatedMinutes[1]} MIN TARGET</span></div>
            <div className="mission-card__body">
              <div className="mission-card__meta"><span>LEVEL {level.order}</span><span className={`difficulty difficulty--${level.difficulty.toLowerCase()}`}>{level.difficulty}</span></div>
              <h2>{level.title}</h2>
              <p className="mission-card__story">{level.storyIntro}</p>
              <div className="learning-objective"><strong>YOU’LL LEARN</strong><span>{level.objective}</span></div>
              <button type="button" className="card-button" onClick={() => selectLevel(level.id)}>Start Mission <span aria-hidden="true">→</span></button>
            </div>
          </article>
        ))}
      </section>
      <footer className="site-footer">All missions use friendly, nonviolent engineering challenges. You can replay any mission at any time.</footer>
    </div>
  )
}
