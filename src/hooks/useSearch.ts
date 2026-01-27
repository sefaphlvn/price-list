// Search Hook with Fuse.js
// Provides fuzzy search functionality for vehicles

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Fuse, { IFuseOptions, FuseResultMatch, FuseResult } from 'fuse.js';

export interface SearchItem {
  id: string;
  brand: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  transmission: string;
  price: number;
  priceFormatted: string;
  searchText: string; // Combined searchable text
}

export interface SearchResult {
  item: SearchItem;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

const fuseOptions: IFuseOptions<SearchItem> = {
  keys: [
    { name: 'searchText', weight: 1.0 },
    { name: 'brand', weight: 0.7 },
    { name: 'model', weight: 0.9 },
    { name: 'trim', weight: 0.5 },
    { name: 'engine', weight: 0.4 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

export interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useSearch(items: SearchItem[]): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fuse = useMemo(() => {
    return new Fuse(items, fuseOptions);
  }, [items]);

  // Use useEffect for search to avoid setState in useMemo
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce search for better performance
    searchTimeoutRef.current = setTimeout(() => {
      const searchResults: FuseResult<SearchItem>[] = fuse.search(query).slice(0, 20);
      setResults(searchResults);
      setIsSearching(false);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fuse, query]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch,
  };
}

// Create SearchItem from vehicle data
export const createSearchItem = (
  brand: string,
  model: string,
  trim: string,
  engine: string,
  fuel: string,
  transmission: string,
  price: number,
  priceFormatted: string
): SearchItem => {
  const id = `${brand}-${model}-${trim}-${engine}`.toLowerCase().replace(/\s+/g, '-');
  const searchText = `${brand} ${model} ${trim} ${engine} ${fuel} ${transmission}`;

  return {
    id,
    brand,
    model,
    trim,
    engine,
    fuel,
    transmission,
    price,
    priceFormatted,
    searchText,
  };
};

export default useSearch;
