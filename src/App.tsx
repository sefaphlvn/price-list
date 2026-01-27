// App Component - Main routing setup
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

import { Layout } from './components/layout';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const PriceListPage = lazy(() => import('./pages/PriceListPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const MyPage = lazy(() => import('./pages/MyPage'));

// Intel Mode pages
const MarketPulsePage = lazy(() => import('./pages/MarketPulsePage'));
const PositioningPage = lazy(() => import('./pages/PositioningPage'));
const GapsPage = lazy(() => import('./pages/GapsPage'));
const PromosPage = lazy(() => import('./pages/PromosPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const LifecyclePage = lazy(() => import('./pages/LifecyclePage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));

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
