// Lazy loading utilities for better performance

import { lazy, ComponentType } from 'react';

// Lazy load heavy components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return lazy(importFunc);
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

