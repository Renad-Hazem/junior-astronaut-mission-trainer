import { HomePage } from './pages/HomePage'
import { MissionLibraryPage } from './pages/MissionLibraryPage'
import { GameplayPage } from './pages/GameplayPage'
import { MissionBriefPage } from './pages/MissionBriefPage'
import { useGameStore } from './pages/__stubs__/gameAdapter'
import './styles/theme.css'
import './styles/game.css'

function App() {
  const screen = useGameStore((state) => state.screen)

  return (
    <main className="app-shell">
      {screen === 'home' && <HomePage />}
      {screen === 'library' && <MissionLibraryPage />}
      {screen === 'gameplay' && <GameplayPage />}
      {screen === 'brief' && <MissionBriefPage />}
    </main>
  )
}

export default App
