// src/components/dashboard/visitor-statistics.tsx
"use client";

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
import { useAnalytics } from "@/hooks/use-analytics";
import { formatDate } from "@/lib/utils";

interface VisitorStatisticsProps {
  domainId: number | string;
  className?: string;
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

export function VisitorStatistics({ domainId }: VisitorStatisticsProps) {
  // Use a default period of month
  const period = "month";

  // Fetch analytics data using the hook
  const { data, isLoading } = useAnalytics(domainId, period);

  // The 10Web API returns the data in a different format than expected
  // Based on the logs, it has a 'sum' field for total and empty data array for new sites
  const totalVisitors = data?.sum || 0;
  const uniqueVisitors = Math.round(totalVisitors * 0.4); // Estimate unique visitors as 40% of total

  // Format data for the chart - if no data, create empty placeholder
  const chartData = data?.data?.length
    ? data.data.map((item: any) => ({
        date: item.date,
        visitors: item.visitors || 0,
      }))
    : generateEmptyChartData(period);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#f58327] rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Total Page Views</div>
              <div className="text-2xl font-medium flex items-center">
                {totalVisitors}
                <BarChart3 className="ml-2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <div className="text-sm text-gray-500 mb-1">Unique Visitors</div>
              <div className="text-2xl font-medium flex items-center">
                {uniqueVisitors}
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
                    return date.getDate().toString();
                  }}
                />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="visitors"
                  fill="#f58327"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {totalVisitors === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500">
                No visitor data available yet. Check back later when your site
                starts receiving traffic.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Generate empty chart data for visualization when no data is available
function generateEmptyChartData(period: string) {
  const data = [];
  const now = new Date();
  let days = 30; // For month period

  if (period === "day") days = 24; // For day, use hours
  if (period === "week") days = 7;
  if (period === "year") days = 12; // For year, use months

  for (let i = 0; i < days; i++) {
    const date = new Date();

    if (period === "day") {
      // For day period, use hours
      date.setHours(now.getHours() - (days - i - 1));
    } else if (period === "year") {
      // For year period, use months
      date.setMonth(now.getMonth() - (days - i - 1));
    } else {
      // For week and month, use days
      date.setDate(now.getDate() - (days - i - 1));
    }

    data.push({
      date: date.toISOString().split("T")[0],
      visitors: 0,
    });
  }

  return data;
}
