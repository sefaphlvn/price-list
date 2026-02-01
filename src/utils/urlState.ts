// URL State Utilities
// Type-safe encoding/decoding of filter state to/from URL query string

export interface PriceListUrlState {
  brand?: string;
  q?: string; // search text
  model?: string;
  transmission?: string;
  fuel?: string;
  powertrain?: string; // electric, pluginHybrid, mildHybrid, hybrid, ice
  driveType?: string; // AWD, FWD, RWD
  date?: string; // YYYY-MM-DD
  sort?: string; // column:direction (e.g., "price:asc")
  page?: number;
  pageSize?: number;
}

const PARAM_KEYS = {
  brand: 'b',
  q: 'q',
  model: 'm',
  transmission: 'tr',
  fuel: 'f',
  powertrain: 'pt',
  driveType: 'dt',
  date: 'd',
  sort: 's',
  page: 'p',
  pageSize: 'ps',
} as const;

/**
 * Parse URL search string to state object
 */
export const parseQueryToState = (search: string): PriceListUrlState => {
  const state: PriceListUrlState = {};

  try {
    const params = new URLSearchParams(search);

    const brand = params.get(PARAM_KEYS.brand);
    if (brand) state.brand = brand;

    const q = params.get(PARAM_KEYS.q);
    if (q) state.q = q;

    const model = params.get(PARAM_KEYS.model);
    if (model) state.model = model;

    const transmission = params.get(PARAM_KEYS.transmission);
    if (transmission) state.transmission = transmission;

    const fuel = params.get(PARAM_KEYS.fuel);
    if (fuel) state.fuel = fuel;

    const powertrain = params.get(PARAM_KEYS.powertrain);
    if (powertrain) state.powertrain = powertrain;

    const driveType = params.get(PARAM_KEYS.driveType);
    if (driveType) state.driveType = driveType;

    const date = params.get(PARAM_KEYS.date);
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      state.date = date;
    }

    const sort = params.get(PARAM_KEYS.sort);
    if (sort && /^[a-z]+:(asc|desc)$/i.test(sort)) {
      state.sort = sort;
    }

    const page = params.get(PARAM_KEYS.page);
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) state.page = pageNum;
    }

    const pageSize = params.get(PARAM_KEYS.pageSize);
    if (pageSize) {
      const ps = parseInt(pageSize, 10);
      if (!isNaN(ps) && [50, 100, 200, 500].includes(ps)) state.pageSize = ps;
    }
  } catch (e) {
    console.warn('Failed to parse URL state:', e);
  }

  return state;
};

/**
 * Convert state to URL search string
 */
export const stateToQuery = (state: PriceListUrlState): string => {
  const params = new URLSearchParams();

  if (state.brand) params.set(PARAM_KEYS.brand, state.brand);
  if (state.q) params.set(PARAM_KEYS.q, state.q);
  if (state.model) params.set(PARAM_KEYS.model, state.model);
  if (state.transmission) params.set(PARAM_KEYS.transmission, state.transmission);
  if (state.fuel) params.set(PARAM_KEYS.fuel, state.fuel);
  if (state.powertrain) params.set(PARAM_KEYS.powertrain, state.powertrain);
  if (state.driveType) params.set(PARAM_KEYS.driveType, state.driveType);
  if (state.date) params.set(PARAM_KEYS.date, state.date);
  if (state.sort) params.set(PARAM_KEYS.sort, state.sort);
  if (state.page && state.page > 1) params.set(PARAM_KEYS.page, state.page.toString());
  if (state.pageSize && state.pageSize !== 100) {
    params.set(PARAM_KEYS.pageSize, state.pageSize.toString());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Get full shareable URL for HashRouter
 */
export const getShareableUrl = (state: PriceListUrlState): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  const query = stateToQuery(state);
  return `${baseUrl}#/fiyat-listesi${query}`;
};

/**
 * Copy URL to clipboard
 */
export const copyUrlToClipboard = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};
