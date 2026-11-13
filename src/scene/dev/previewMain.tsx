// Dev-only entry: open http://localhost:5173/src/scene/dev/preview.html while
// `npm run dev` is running. Not part of the production build (index.html only).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ScenePreview from './ScenePreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScenePreview />
  </StrictMode>,
);
