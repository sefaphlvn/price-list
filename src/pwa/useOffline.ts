// Offline Detection Hook
// Monitors network status and provides offline state

import { useState, useEffect, useCallback } from 'react';
import { DATA_URLS } from '../utils/fetchData';

interface OfflineState {
  isOffline: boolean;
  wasOffline: boolean; // Was offline at some point in this session
  lastOnline: Date | null;
}

export function useOffline(): OfflineState & {
  checkConnection: () => Promise<boolean>;
} {
  const [state, setState] = useState<OfflineState>({
    isOffline: !navigator.onLine,
    wasOffline: !navigator.onLine,
    lastOnline: navigator.onLine ? new Date() : null,
  });

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch(DATA_URLS.index, {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOffline: false,
        lastOnline: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOffline: true,
        wasOffline: true,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setState((prev) => ({
        ...prev,
        isOffline: true,
        wasOffline: true,
      }));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...state,
    checkConnection,
  };
}

// Hook for service worker registration status
export function useServiceWorker(): {
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  updateServiceWorker: () => void;
} {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setIsRegistered(true);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    isRegistered,
    isUpdateAvailable,
    updateServiceWorker,
  };
}
