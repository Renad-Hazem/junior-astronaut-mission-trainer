import { useState } from 'react';
import SolarPanelCleaningGame from '../SolarPanelCleaningGame';
import type { Difficulty, SolarPanelCleaningResult } from '../types';

export default function SolarGamePreview() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<SolarPanelCleaningResult | null>(null);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', background: '#090d1f', color: '#f1f5f9' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Controls Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: 16,
            border: '1px solid rgba(85, 189, 235, 0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Difficulty:{' '}
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value as Difficulty);
                  addLog(`Difficulty switched to: ${e.target.value}`);
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 8,
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #334155',
                }}
              >
                <option value="easy">Easy (12 cells)</option>
                <option value="normal">Normal (24 cells)</option>
                <option value="hard">Hard (36 cells)</option>
              </select>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => {
                  setReducedMotion(e.target.checked);
                  addLog(`reducedMotion: ${e.target.checked}`);
                }}
              />
              Reduced Motion
            </label>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Standalone Dev Prototype (No Game Store Dependency)
          </div>
        </div>

        {/* The Mini-Game */}
        <SolarPanelCleaningGame
          difficulty={difficulty}
          reducedMotion={reducedMotion}
          onComplete={(res) => {
            setLastResult(res);
            addLog(`onComplete: success=${res.success}, cleaned=${res.cleanedPercentage}%, duration=${res.durationMs}ms`);
          }}
          onCancel={() => {
            addLog('onCancel() triggered by player');
          }}
          onSoundEffect={(effect) => {
            addLog(`audio cue: ${effect}`);
          }}
        />

        {/* Callback Inspection Deck */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            borderRadius: 16,
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#38e1ff', fontSize: '0.9rem' }}>
            Developer Callback & Event Log
          </h4>
          {lastResult && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                marginBottom: '0.8rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: 8,
                fontSize: '0.82rem',
              }}
            >
              <strong>Latest Result:</strong> {JSON.stringify(lastResult)}
            </div>
          )}
          <pre
            data-testid="preview-log"
            style={{
              margin: 0,
              padding: '0.75rem',
              background: '#020617',
              borderRadius: 8,
              fontSize: '0.75rem',
              color: '#cbd5e1',
              maxHeight: 140,
              overflowY: 'auto',
            }}
          >
            {log.length ? log.join('\n') : 'Events will appear here when interacting with the game'}
          </pre>
        </div>
      </div>
    </div>
  );
}
