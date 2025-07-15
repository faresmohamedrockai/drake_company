import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
      <App />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>
);
