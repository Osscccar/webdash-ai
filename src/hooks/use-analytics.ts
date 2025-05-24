"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

// Cache configuration
const ANALYTICS_CACHE_KEY = "webdash_visitor_stats";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes

// Utility functions for caching
const getCachedAnalytics = (domainId: string | number, period: string) => {
  try {
    const cacheKey = `${ANALYTICS_CACHE_KEY}_${domainId}_${period}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Return data regardless of age (will refresh in background if stale)
    return { data, isStale: now - timestamp > CACHE_DURATION };
  } catch (error) {
    console.error("Error reading cached analytics:", error);
    return null;
  }
};

const setCachedAnalytics = (
  domainId: string | number,
  period: string,
  data: any
) => {
  try {
    const cacheKey = `${ANALYTICS_CACHE_KEY}_${domainId}_${period}`;
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.error("Error caching analytics:", error);
  }
};

// Updated interface to match 10Web API response
export interface AnalyticsData {
  data: Array<{
    date: string;
    visitors: number;
  }>;
  end_date: string;
  start_date: string;
  status: string;
  sum: number;
}

export function useAnalytics(
  domainId: number | string | null,
  period: "day" | "week" | "month" | "year" = "month"
) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const autoRefreshRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!domainId) return;

    // Check for recent rate limiting
    const lastRateLimit = localStorage.getItem("webdash_last_rate_limit");
    const rateLimitCooldown = lastRateLimit
      ? Date.now() - parseInt(lastRateLimit) < 10 * 60 * 1000
      : false; // 10 min cooldown

    // Load cached data immediately
    const cached = getCachedAnalytics(domainId, period);
    if (cached) {
      setData(cached.data);

      // If data is stale and not in cooldown, refresh in background
      if (cached.isStale && !rateLimitCooldown) {
        fetchAnalytics(true);
      }
    } else if (!rateLimitCooldown) {
      // No cached data and not in cooldown, fetch fresh
      fetchAnalytics(false);
    } else {
      // In cooldown, show demo data
      setData({
        data: [],
        end_date: new Date().toISOString(),
        start_date: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: "ok",
        sum: 0,
      });
    }

    // Set up auto-refresh for active users
    autoRefreshRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        const cached = getCachedAnalytics(domainId, period);
        if (!cached || cached.isStale) {
          fetchAnalytics(true);
        }
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [domainId, period]);

  const fetchAnalytics = async (isBackgroundRefresh = false) => {
    if (!domainId) return;

    if (!isBackgroundRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `/api/tenweb/visitors/${domainId}?period=${period}`
      );

      if (response.data.status === "ok") {
        setData(response.data);
        setCachedAnalytics(domainId, period, response.data);
      } else {
        throw new Error(
          response.data.error || "Failed to fetch visitor statistics"
        );
      }
    } catch (err: any) {
      console.error("Error fetching visitor statistics:", err);

      // If background refresh fails, just use cached data silently
      if (isBackgroundRefresh) {
        const cached = getCachedAnalytics(domainId, period);
        if (cached) {
          setData(cached.data);
        }
        return;
      }

      // For foreground requests, try to use cached data
      const cached = getCachedAnalytics(domainId, period);
      if (cached) {
        setData(cached.data);
        toast({
          title: "Using Cached Data",
          description: "API error. Showing cached visitor statistics.",
        });
      } else {
        setError(err.message || "Failed to fetch visitor statistics");
        toast({
          title: "Analytics Error",
          description: err.message || "Failed to fetch visitor statistics",
          variant: "destructive",
        });
      }
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  return { data, isLoading, error };
}
