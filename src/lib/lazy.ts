// Lazy loading utilities for better performance

import { lazy, ComponentType } from 'react';

// Lazy load component with automatic retry on chunk fetch failures
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | { default: ComponentType<any> }>
) => {
  return lazy(async () => {
    try {
      const component = await importFunc();
      return component as { default: T };
    } catch (error: any) {
      // Check if it's a dynamic import failure
      const isChunkLoadFailed =
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Error loading chunk') ||
        (error.name === 'TypeError' && error.message?.includes('import'));
      
      if (isChunkLoadFailed) {
        console.warn('Dynamic import failed, attempting page reload...', error);
        
        // Use a flag in sessionStorage to prevent infinite reloads
        const reloadKey = 'chunk-load-failed-reload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        
        // Only auto-reload if we haven't reloaded in the last 10 seconds to avoid loops
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
          // Return a promise that never resolves so we don't render a broken page while reloading
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
};

// Lazy load heavy components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazyWithRetry(importFunc);
};

// Preload component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const preloadComponent = (lazyComponent: any) => {
  if (lazyComponent._payload) {
    return lazyComponent._payload._result;
  }
  return null;
};

// Lazy load images
export const lazyLoadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};
