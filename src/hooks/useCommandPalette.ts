// Command Palette Hook
// Handles keyboard shortcuts and palette state

import { useState, useEffect, useCallback } from 'react';

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggle();
        return;
      }

      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return { isOpen, open, close, toggle };
}

export default useCommandPalette;
