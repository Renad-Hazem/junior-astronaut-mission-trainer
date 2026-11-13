import { useGameStore } from './__stubs__/gameAdapter'

export function HomePage() {
  const returnToLibrary = useGameStore((state) => state.returnToLibrary)
  return (
    <div className="home-page page">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="Mars Base home"><span className="brand-mark" aria-hidden="true">⌁</span><span>ASTER BASE<small>MISSION NETWORK</small></span></a>
        <span className="signal"><i /> SIGNAL: STRONG</span>
      </header>

      <section className="home-hero" id="main-content">
        <div className="home-hero__content">
          <span className="eyebrow">WELCOME, CADET NOVA</span>
          <h1><span>MARS BASE</span>MISSION CONTROL</h1>
          <p className="hero-subtitle">Junior Astronaut Mission Trainer</p>
          <p className="hero-story">Aster Base needs a curious new Mission Controller. Explore the red planet, make smart choices, and discover how every life-support system works together.</p>
          <button type="button" className="primary-button hero-cta" onClick={returnToLibrary}>Start Your Mission <span aria-hidden="true">→</span></button>
          <p className="hero-note"><span aria-hidden="true">✦</span> No timers. No combat. Just science, teamwork, and brave ideas.</p>
        </div>
        <div className="home-planet" aria-hidden="true">
          <div className="orbit orbit--one" /><div className="orbit orbit--two" />
          <div className="planet"><span className="planet-crater planet-crater--one" /><span className="planet-crater planet-crater--two" /><span className="planet-base">⌂</span></div>
          <div className="astronaut"><span className="astronaut-helmet">• •</span><span className="astronaut-body">NOVA</span></div>
          <div className="home-pip">PIP <span>✓</span></div>
        </div>
      </section>

      <section className="journey-strip" aria-label="Your mission journey">
        {[
          ['01', 'EXPLORE', 'Meet the base systems'], ['02', 'DECIDE', 'Choose a smart response'],
          ['03', 'PROTECT', 'Keep resources balanced'], ['04', 'DISCOVER', 'Unlock the science'],
        ].map(([number, title, text], index) => <div className="journey-step" key={title}><span>{number}</span><div><strong>{title}</strong><small>{text}</small></div>{index < 3 && <b aria-hidden="true">→</b>}</div>)}
      </section>

      <footer className="site-footer">Educational simulation — resource scores are fictional game values. Verified source links appear inside each Mission Brief.</footer>
    </div>
  )
}
