import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <FeatureErrorBoundary featureName="PDF EDU STUDIO">
    <App />
  </FeatureErrorBoundary>
);
