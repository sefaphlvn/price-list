// Fetch with timeout and retry logic

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 15000, // 15 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWithTimeout = async (
  url: string,
  options: FetchOptions = {}
): Promise<any> => {
  const { timeout, retries, retryDelay } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
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
