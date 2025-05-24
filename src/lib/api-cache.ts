// src/lib/api-cache.ts
"use client";

// Cache configuration
export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes
  AUTO_REFRESH_INTERVAL: 3 * 60 * 1000, // 3 minutes
};

// Cache keys for different API endpoints
export const CACHE_KEYS = {
  CACHE_STATUS: 'webdash_cache_status',
  PERFORMANCE_METRICS: 'webdash_performance_metrics',
  STORAGE_INFO: 'webdash_storage_info',
  VISITOR_STATS: 'webdash_visitor_stats',
  BACKUP_STATUS: 'webdash_backup_status',
  SSL_STATUS: 'webdash_ssl_status',
  USER_INFO: 'webdash_user_info',
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheResult<T> {
  data: T;
  isStale: boolean;
}

// Generic cache utilities
export const getCachedData = <T>(key: string): CacheResult<T> | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp }: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Return data regardless of age (will refresh in background if stale)
    return { 
      data, 
      isStale: now - timestamp > CACHE_CONFIG.DURATION 
    };
  } catch (error) {
    console.error('Error reading cached data:', error);
    return null;
  }
};

export const setCachedData = <T>(key: string, data: T): void => {
  try {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

export const isCacheStale = (key: string): boolean => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return true;
    
    const { timestamp }: CacheEntry<any> = JSON.parse(cached);
    const now = Date.now();
    
    return now - timestamp > CACHE_CONFIG.DURATION;
  } catch (error) {
    return true;
  }
};

export const clearCache = (pattern?: string): void => {
  try {
    if (pattern) {
      // Clear specific cache entries matching pattern
      Object.keys(localStorage).forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear all webdash cache entries
      Object.values(CACHE_KEYS).forEach(key => {
        Object.keys(localStorage).forEach(storageKey => {
          if (storageKey.includes(key)) {
            localStorage.removeItem(storageKey);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Domain-specific cache key generator
export const getDomainCacheKey = (baseKey: string, domainId: string | number): string => {
  return `${baseKey}_${domainId}`;
};

// Utility for making cached API requests
export const makeCachedRequest = async <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: any, cachedData?: T) => void,
  isBackgroundRefresh = false
): Promise<T | null> => {
  try {
    const response = await apiCall();
    setCachedData(cacheKey, response);
    onSuccess?.(response);
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Try to use cached data
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      onError?.(error, cached.data);
      return cached.data;
    } else {
      onError?.(error);
      return null;
    }
  }
};