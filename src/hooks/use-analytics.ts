"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

export interface AnalyticsData {
  total: number;
  unique: number;
  time_series: Array<{
    date: string;
    visitors: number;
  }>;
}

export function useAnalytics(
  domainId: number | string | null,
  period: "day" | "week" | "month" | "year" = "month"
) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!domainId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `/api/tenweb/analytics?domain_id=${domainId}&period=${period}`
        );

        if (response.data.status === "ok") {
          setData(response.data.data);
        } else {
          throw new Error(
            response.data.error || "Failed to fetch analytics data"
          );
        }
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to fetch analytics data");
        toast({
          title: "Analytics Error",
          description: err.message || "Failed to fetch analytics data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [domainId, period, toast]);

  return { data, isLoading, error };
}
