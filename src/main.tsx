import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/500.css';
import '@fontsource/questrial/400.css';
import '@fontsource/tajawal/300.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import 'leaflet/dist/leaflet.css';
import './theme/base.css';
import './components/components.css';

import { ThemeProvider } from './theme/theme';
import { I18nProvider } from './i18n';
import { FiltersProvider } from './layout/filters';
import { AuthProvider } from './layout/auth';
import { DemoDataProvider, useDemo } from './data/store';
import App from './App';

function WiredScope() {
  const { clubs, districts } = useDemo();
  return (
    <FiltersProvider clubs={clubs} districts={districts}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </FiltersProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <DemoDataProvider>
          <WiredScope />
        </DemoDataProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
