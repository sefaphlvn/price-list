import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import enUS from 'antd/locale/en_US';
import App from './App';
import { antdTheme } from './theme/antdTheme';
import { useAppStore } from './store';
import { ErrorBoundary } from './components/errors';
import './i18n'; // Initialize i18n
import './index.css';

// Wrapper component to handle dynamic locale
function AppWithProviders() {
  const language = useAppStore((state) => state.language);
  const locale = language === 'tr' ? trTR : enUS;

  return (
    <ErrorBoundary>
      <ConfigProvider theme={antdTheme} locale={locale}>
        <HashRouter>
          <App />
        </HashRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
