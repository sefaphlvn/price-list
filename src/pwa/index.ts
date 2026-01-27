// PWA Module Exports

export { db, cacheVehicleData, getCachedVehicleData, cacheIndex, getCachedIndex, cacheSearchIndex, getCachedSearchIndex, clearAllCache, getCacheStats } from './db';
export type { CachedVehicleData, CachedIndex, SearchIndexEntry, CachedSearchIndex } from './db';

export { useOffline, useServiceWorker } from './useOffline';
export { default as OfflineBanner } from './OfflineBanner';
export { default as InstallPrompt } from './InstallPrompt';
