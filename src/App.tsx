// App Component - Main routing setup
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, ComponentType } from 'react';
import { Spin } from 'antd';

import { Layout } from './components/layout';

// Lazy load with retry for chunk loading failures
function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const tryImport = async (attempt: number): Promise<{ default: T }> => {
      try {
        return await importFn();
      } catch (error) {
        if (attempt < retries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          return tryImport(attempt + 1);
        }
        // If all retries failed, reload the page to get fresh chunks
        console.error('Chunk loading failed after retries:', error);
        window.location.reload();
        throw error;
      }
    };
    return tryImport(1);
  });
}

// Lazy load pages with retry mechanism
const HomePage = lazyWithRetry(() => import('./pages/HomePage'));
const PriceListPage = lazyWithRetry(() => import('./pages/PriceListPage'));
const StatisticsPage = lazyWithRetry(() => import('./pages/StatisticsPage'));
const ComparisonPage = lazyWithRetry(() => import('./pages/ComparisonPage'));
const InsightsPage = lazyWithRetry(() => import('./pages/InsightsPage'));
const MyPage = lazyWithRetry(() => import('./pages/MyPage'));

// Intel Mode pages
const MarketPulsePage = lazyWithRetry(() => import('./pages/MarketPulsePage'));
const PositioningPage = lazyWithRetry(() => import('./pages/PositioningPage'));
const GapsPage = lazyWithRetry(() => import('./pages/GapsPage'));
const PromosPage = lazyWithRetry(() => import('./pages/PromosPage'));
const ArchitecturePage = lazyWithRetry(() => import('./pages/ArchitecturePage'));
const LifecyclePage = lazyWithRetry(() => import('./pages/LifecyclePage'));
const AlertsPage = lazyWithRetry(() => import('./pages/AlertsPage'));

// Loading fallback
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Spin size="large" />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="fiyat-listesi" element={<PriceListPage />} />
          <Route path="istatistikler" element={<StatisticsPage />} />
          <Route path="karsilastirma" element={<ComparisonPage />} />
          <Route path="analizler" element={<InsightsPage />} />
          <Route path="benim" element={<MyPage />} />
          {/* Intel Mode pages */}
          <Route path="market-pulse" element={<MarketPulsePage />} />
          <Route path="positioning" element={<PositioningPage />} />
          <Route path="gaps" element={<GapsPage />} />
          <Route path="promos" element={<PromosPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="lifecycle" element={<LifecyclePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          {/* Redirect old paths if any */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
