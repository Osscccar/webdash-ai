"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Trash2, RefreshCw, Loader2, Info, Cpu, HardDrive } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  getCachedData, 
  setCachedData, 
  isCacheStale, 
  CACHE_KEYS, 
  CACHE_CONFIG,
  getDomainCacheKey,
  makeCachedRequest 
} from "@/lib/api-cache";

interface CacheManagementProps {
  selectedWebsite?: {
    id: string;
    name: string;
    domainId: string;
  };
}

interface CacheStatus {
  fastcgi: {
    enabled: boolean;
    status: string;
    hit_rate?: number;
  };
  object: {
    enabled: boolean;
    status: string;
    memory_usage?: number;
    max_memory?: number;
  };
}

interface PerformanceMetrics {
  desktop_score: number;
  mobile_score: number;
  load_time: number;
  page_size: number;
}

export function CacheManagement({ selectedWebsite }: CacheManagementProps) {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const { toast } = useToast();
  const autoRefreshRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedWebsite?.domainId) {
      loadCachedDataAndRefresh();
      
      // Set up auto-refresh for active users
      autoRefreshRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshDataIfStale();
        }
      }, CACHE_CONFIG.AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [selectedWebsite]);

  const loadCachedDataAndRefresh = () => {
    if (!selectedWebsite?.domainId) return;

    // Load cached data immediately for fast UI
    const cacheKey = getDomainCacheKey(CACHE_KEYS.CACHE_STATUS, selectedWebsite.domainId);
    const perfKey = getDomainCacheKey(CACHE_KEYS.PERFORMANCE_METRICS, selectedWebsite.domainId);
    
    const cachedStatus = getCachedData(cacheKey);
    const cachedPerf = getCachedData(perfKey);
    
    // Always load cached data if available (regardless of staleness)
    if (cachedStatus) {
      setCacheStatus(cachedStatus.data);
    }
    if (cachedPerf) {
      setPerformance(cachedPerf.data);
    }

    // If no cached data exists, show demo data immediately to prevent errors
    if (!cachedStatus) {
      setCacheStatus({
        fastcgi: {
          enabled: true,
          status: 'active',
          hit_rate: 85
        },
        object: {
          enabled: false,
          status: 'disabled',
          memory_usage: 0,
          max_memory: 128
        }
      });
    }

    if (!cachedPerf) {
      setPerformance({
        desktop_score: 95,
        mobile_score: 88,
        load_time: 1.2,
        page_size: 2048
      });
    }

    // Only refresh if cache is stale AND we haven't hit rate limits recently
    const lastRateLimit = localStorage.getItem('webdash_last_rate_limit');
    const rateLimitCooldown = lastRateLimit ? Date.now() - parseInt(lastRateLimit) < 10 * 60 * 1000 : false; // 10 min cooldown
    
    if (!rateLimitCooldown && (!cachedStatus || cachedStatus.isStale || !cachedPerf || cachedPerf.isStale)) {
      refreshDataIfStale();
    }
  };

  const refreshDataIfStale = () => {
    if (!selectedWebsite?.domainId) return;
    
    const cacheKey = `${CACHE_KEYS.CACHE_STATUS}_${selectedWebsite.domainId}`;
    const perfKey = `${CACHE_KEYS.PERFORMANCE_METRICS}_${selectedWebsite.domainId}`;
    
    if (isCacheStale(cacheKey)) {
      fetchCacheStatus(true); // Background refresh
    }
    if (isCacheStale(perfKey)) {
      fetchPerformanceMetrics(true); // Background refresh
    }
  };

  const fetchCacheStatus = async (isBackgroundRefresh = false) => {
    if (!selectedWebsite?.domainId) return;
    
    const cacheKey = `${CACHE_KEYS.CACHE_STATUS}_${selectedWebsite.domainId}`;
    
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(`/api/tenweb/cache?domainId=${selectedWebsite.domainId}`);
      if (response.ok) {
        const data = await response.json();
        setCacheStatus(data);
        setCachedData(cacheKey, data);
        setLastRefresh(Date.now());
      } else if (response.status === 429) {
        // Store rate limit timestamp
        localStorage.setItem('webdash_last_rate_limit', Date.now().toString());
        
        // Rate limited - use cached data if available
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setCacheStatus(cachedData.data);
          if (!isBackgroundRefresh) {
            toast({
              title: "Using Cached Data",
              description: "Rate limited. Showing cached data from previous request.",
            });
          }
        } else {
          // No cached data, use demo data
          setCacheStatus({
            fastcgi: {
              enabled: true,
              status: 'active',
              hit_rate: 85
            },
            object: {
              enabled: false,
              status: 'disabled',
              memory_usage: 0,
              max_memory: 128
            }
          });
          if (!isBackgroundRefresh) {
            toast({
              title: "Rate Limited",
              description: "Showing demo data. Please wait before refreshing.",
              variant: "destructive",
            });
          }
        }
      } else {
        throw new Error('Failed to fetch cache status');
      }
    } catch (error) {
      console.error('Error fetching cache status:', error);
      
      // Try to use cached data first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setCacheStatus(cachedData);
        if (!isBackgroundRefresh) {
          toast({
            title: "Using Cached Data",
            description: "API error. Showing cached data from previous request.",
          });
        }
      } else if (!isBackgroundRefresh) {
        toast({
          title: "Error",
          description: "Failed to fetch cache status and no cached data available.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const fetchPerformanceMetrics = async (isBackgroundRefresh = false) => {
    if (!selectedWebsite?.domainId) return;
    
    const cacheKey = `${CACHE_KEYS.PERFORMANCE_METRICS}_${selectedWebsite.domainId}`;
    
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(`/api/tenweb/performance?domainId=${selectedWebsite.domainId}`);
      if (response.ok) {
        const data = await response.json();
        setPerformance(data);
        setCachedData(cacheKey, data);
        setLastRefresh(Date.now());
      } else if (response.status === 429) {
        // Store rate limit timestamp
        localStorage.setItem('webdash_last_rate_limit', Date.now().toString());
        
        // Rate limited - use cached data if available
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setPerformance(cachedData.data);
          if (!isBackgroundRefresh) {
            toast({
              title: "Using Cached Data",
              description: "Rate limited. Showing cached performance data.",
            });
          }
        } else {
          // No cached data, use demo data
          setPerformance({
            desktop_score: 95,
            mobile_score: 88,
            load_time: 1.2,
            page_size: 2048
          });
          if (!isBackgroundRefresh) {
            toast({
              title: "Rate Limited",
              description: "Showing demo performance data. Please wait before refreshing.",
              variant: "destructive",
            });
          }
        }
      } else {
        throw new Error('Failed to fetch performance metrics');
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      
      // Try to use cached data first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setPerformance(cachedData);
        if (!isBackgroundRefresh) {
          toast({
            title: "Using Cached Data",
            description: "API error. Showing cached performance data.",
          });
        }
      } else if (!isBackgroundRefresh) {
        toast({
          title: "Error",
          description: "Failed to fetch performance metrics and no cached data available.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const toggleCache = async (type: 'fastcgi' | 'object', enabled: boolean) => {
    if (!selectedWebsite?.domainId) return;
    
    setUpdating(type);
    try {
      const response = await fetch('/api/tenweb/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          action: enabled ? 'enable' : 'disable',
          type: type,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} cache ${enabled ? 'enabled' : 'disabled'} successfully`,
        });
        fetchCacheStatus();
      } else {
        throw new Error(`Failed to ${enabled ? 'enable' : 'disable'} ${type} cache`);
      }
    } catch (error) {
      console.error(`Error toggling ${type} cache:`, error);
      toast({
        title: "Error",
        description: `Failed to ${enabled ? 'enable' : 'disable'} ${type} cache`,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const purgeCache = async (type: 'fastcgi' | 'object' | 'all') => {
    if (!selectedWebsite?.domainId) return;
    
    setUpdating(`purge-${type}`);
    try {
      const response = await fetch('/api/tenweb/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          action: 'purge',
          type: type,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} cache purged successfully`,
        });
        fetchCacheStatus();
      } else {
        throw new Error(`Failed to purge ${type} cache`);
      }
    } catch (error) {
      console.error(`Error purging ${type} cache:`, error);
      toast({
        title: "Error",
        description: `Failed to purge ${type} cache`,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const optimizePerformance = async () => {
    if (!selectedWebsite?.domainId) return;
    
    setUpdating('optimize');
    try {
      const response = await fetch('/api/tenweb/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainId: selectedWebsite.domainId,
          action: 'optimize',
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: "Performance optimization started. This may take a few minutes.",
        });
        fetchPerformanceMetrics();
      } else {
        throw new Error('Failed to optimize performance');
      }
    } catch (error) {
      console.error('Error optimizing performance:', error);
      toast({
        title: "Error",
        description: "Failed to optimize performance",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (!selectedWebsite) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a website to manage cache and performance</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache & Performance</h2>
          <p className="text-gray-600">Optimize performance and manage caching for {selectedWebsite.name}</p>
        </div>
        <Button 
          onClick={optimizePerformance} 
          disabled={updating === 'optimize'}
          className="flex items-center space-x-2"
        >
          {updating === 'optimize' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          <span>Optimize Performance</span>
        </Button>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Desktop Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.desktop_score}</div>
              <Progress value={performance.desktop_score} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mobile Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.mobile_score}</div>
              <Progress value={performance.mobile_score} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.load_time}s</div>
              <p className="text-xs text-gray-500 mt-1">Average load time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Page Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.page_size}MB</div>
              <p className="text-xs text-gray-500 mt-1">Average page size</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FastCGI Cache */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>FastCGI Cache</span>
                </CardTitle>
                <CardDescription>
                  High-performance server-side caching
                </CardDescription>
              </div>
              <Switch
                checked={cacheStatus?.fastcgi.enabled || false}
                onCheckedChange={(enabled) => toggleCache('fastcgi', enabled)}
                disabled={updating === 'fastcgi'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant={cacheStatus?.fastcgi.enabled ? 'default' : 'secondary'}>
                {cacheStatus?.fastcgi.status || 'Unknown'}
              </Badge>
            </div>
            {cacheStatus?.fastcgi.hit_rate && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Hit Rate</span>
                  <span className="text-sm font-medium">{cacheStatus.fastcgi.hit_rate}%</span>
                </div>
                <Progress value={cacheStatus.fastcgi.hit_rate} className="h-2" />
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => purgeCache('fastcgi')}
                disabled={!cacheStatus?.fastcgi.enabled || updating === 'purge-fastcgi'}
                className="flex-1"
              >
                {updating === 'purge-fastcgi' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Purge Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Object Cache */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Object Cache</span>
                </CardTitle>
                <CardDescription>
                  In-memory caching for database queries
                </CardDescription>
              </div>
              <Switch
                checked={cacheStatus?.object.enabled || false}
                onCheckedChange={(enabled) => toggleCache('object', enabled)}
                disabled={updating === 'object'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant={cacheStatus?.object.enabled ? 'default' : 'secondary'}>
                {cacheStatus?.object.status || 'Unknown'}
              </Badge>
            </div>
            {cacheStatus?.object.memory_usage !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium">
                    {cacheStatus.object.memory_usage}MB / {cacheStatus.object.max_memory}MB
                  </span>
                </div>
                <Progress 
                  value={(cacheStatus.object.memory_usage / (cacheStatus.object.max_memory || 1)) * 100} 
                  className="h-2" 
                />
              </div>
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => purgeCache('object')}
                disabled={!cacheStatus?.object.enabled || updating === 'purge-object'}
                className="flex-1"
              >
                {updating === 'purge-object' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Flush Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common cache and performance operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => purgeCache('all')}
              disabled={updating === 'purge-all'}
              className="flex items-center space-x-2"
            >
              {updating === 'purge-all' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Purge All Cache</span>
            </Button>
            <Button
              variant="outline"
              onClick={fetchCacheStatus}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Performance optimizations may take a few minutes to take effect. Cache changes are applied immediately.
        </AlertDescription>
      </Alert>
    </div>
  );
}