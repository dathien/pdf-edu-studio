import React, { type ComponentType } from 'react';

type ModuleLoader<T extends ComponentType<any>> = () => Promise<{ default: T }>;

/**
 * Wraps React.lazy with automatic retry on transient dynamic import failures
 * and avoids permanently caching a rejected import promise when the user clicks "Thử lại".
 *
 * When a retryable wrapper is re-mounted (via ErrorBoundary resetKey), it creates
 * a fresh dynamic import attempt instead of re-throwing a stale rejected Promise.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  loader: ModuleLoader<T>,
  retries = 2
): React.LazyExoticComponent<T> {
  const attemptLoad = async (): Promise<{ default: T }> => {
    let lastError: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await loader();
      } catch (err) {
        lastError = err;
        if (i < retries) {
          await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        }
      }
    }
    throw lastError;
  };

  return React.lazy(attemptLoad);
}

/**
 * Factory for retryable lazy components where clicking "Thử lại" in
 * FeatureErrorBoundary genuinely clears the failed React.lazy cache
 * by creating a fresh lazy component instance when retryNonce increments.
 */
export function createRetryableLazy<T extends ComponentType<any>>(
  loader: ModuleLoader<T>
): React.FC<React.ComponentProps<T> & { retryNonce?: number }> {
  let cachedNonce = -1;
  let cachedLazy: React.LazyExoticComponent<T> | null = null;

  const RetryableWrapper: React.FC<React.ComponentProps<T> & { retryNonce?: number }> = ({
    retryNonce = 0,
    ...props
  }) => {
    if (!cachedLazy || cachedNonce !== retryNonce) {
      cachedNonce = retryNonce;
      cachedLazy = lazyWithRetry(loader, 1);
    }
    const LazyComp = cachedLazy;
    return React.createElement(LazyComp, props as React.ComponentProps<T>);
  };

  return RetryableWrapper;
}
