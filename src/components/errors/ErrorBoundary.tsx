// Error Boundary Component
// Catches JavaScript errors and displays fallback UI

import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error log storage (localStorage, max 50 entries)
const ERROR_LOG_KEY = 'otofiyatlist-error-log';
const MAX_ERROR_LOG_ENTRIES = 50;

interface ErrorLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

function logError(error: Error, errorInfo: ErrorInfo | null): void {
  try {
    const existingLog = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]') as ErrorLogEntry[];

    const newEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Add new entry at the beginning
    existingLog.unshift(newEntry);

    // Keep only the last MAX_ERROR_LOG_ENTRIES
    const trimmedLog = existingLog.slice(0, MAX_ERROR_LOG_ENTRIES);

    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLog));
  } catch (e) {
    // Silently fail if localStorage is not available
    console.error('Failed to log error:', e);
  }
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logError(error, errorInfo);
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
