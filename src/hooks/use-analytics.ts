"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";

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

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!domainId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use the correct endpoint for visitor statistics
        const response = await axios.get(
          `/api/tenweb/visitors/${domainId}?period=${period}`
        );

        if (response.data.status === "ok") {
          // The data is already in the format we expect
          setData(response.data);
        } else {
          throw new Error(
            response.data.error || "Failed to fetch visitor statistics"
          );
        }
      } catch (err: any) {
        console.error("Error fetching visitor statistics:", err);
        setError(err.message || "Failed to fetch visitor statistics");
        toast({
          title: "Analytics Error",
          description: err.message || "Failed to fetch visitor statistics",
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
