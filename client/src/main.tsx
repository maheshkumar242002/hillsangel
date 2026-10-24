import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// Clear legacy mock data keys from browser localStorage
[
  'ha_mock_packages',
  'ha_mock_settings',
  'ha_mock_bookings',
  'ha_mock_assets',
  'ha_mock_gallery',
  'ha_mock_enquiries',
].forEach((key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in DOM');
}

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
