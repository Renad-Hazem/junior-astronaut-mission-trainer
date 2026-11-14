// Dev-only entry for Solar Panel Dust Rescue mini-game prototype.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SolarGamePreview from './SolarGamePreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolarGamePreview />
  </StrictMode>,
);
