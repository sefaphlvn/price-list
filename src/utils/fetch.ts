// Fetch with timeout and retry logic
import { XMLParser } from 'fast-xml-parser';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  responseType?: 'json' | 'xml';
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 15000, // 15 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  responseType: 'json',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithTimeout = async (
  url: string,
  options: FetchOptions = {}
): Promise<any> => {
  const { timeout, retries, retryDelay, responseType } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers: HeadersInit = {};
      if (responseType === 'json') {
        headers['Accept'] = 'application/json';
      } else if (responseType === 'xml') {
        headers['Accept'] = 'application/xml, text/xml';
      }

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (responseType === 'xml') {
        const xmlText = await response.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '',
        });
        const data = parser.parse(xmlText);
        return data;
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      lastError = error as Error;

      // If it's the last attempt, throw the error
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await sleep(retryDelay! * (attempt + 1));
    }
  }

  throw lastError || new Error('Fetch failed');
};
