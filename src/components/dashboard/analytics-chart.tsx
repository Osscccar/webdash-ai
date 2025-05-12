"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { BarChart3, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AnalyticsData {
  total: number;
  unique: number;
  time_series: Array<{
    date: string;
    visitors: number;
  }>;
}

interface AnalyticsChartProps {
  data: AnalyticsData | null;
  isLoading: boolean;
  period: "day" | "week" | "month" | "year";
  onChange: (period: "day" | "week" | "month" | "year") => void;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="font-semibold">{formatDate(label)}</p>
        <p className="text-[#f58327]">{`Visitors: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export function AnalyticsChart({
  data,
  isLoading,
  period,
  onChange,
}: AnalyticsChartProps) {
  // Format data for the chart
  const chartData =
    data?.time_series?.map((item) => ({
      date: item.date,
      visitors: item.visitors,
    })) || [];

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-gray-500" />
            Website Analytics
          </CardTitle>
          <Tabs
            defaultValue={period}
            onValueChange={(value) => onChange(value as any)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-2">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">
                Month
              </TabsTrigger>
              <TabsTrigger value="year" className="text-xs px-2">
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-[#f58327] rounded-full border-t-transparent"></div>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-2" />
            <h3 className="text-lg font-normal mb-1">
              No analytics data available
            </h3>
            <p className="text-gray-500 max-w-md">
              We couldn't find any visitor data for this website yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-sm text-gray-500 mb-1">
                  Total Page Views
                </div>
                <div className="text-2xl font-medium flex items-center">
                  {data.total}
                  <BarChart3 className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="text-sm text-gray-500 mb-1">
                  Unique Visitors
                </div>
                <div className="text-2xl font-medium flex items-center">
                  {data.unique}
                  <Users className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      // Format based on period
                      const date = new Date(value);
                      if (period === "day") return date.getHours() + ":00";
                      if (period === "week")
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                      if (period === "month") return date.getDate().toString();
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                      });
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="visitors"
                    fill="#f58327"
                    radius={[4, 4, 0, 0]}
                    barSize={
                      period === "year" ? 16 : period === "month" ? 12 : 8
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
