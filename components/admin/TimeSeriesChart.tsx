'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeSeriesChartProps {
  data: Array<{ _id: string; count: number }>;
  title: string;
  valueLabel?: string;
  color?: string;
  height?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  days?: number; // Number of days in the period
}

export default function TimeSeriesChart({
  data,
  title,
  valueLabel = 'Value',
  color = 'hsl(var(--primary))',
  height = 300,
  startDate,
  endDate,
  days,
}: TimeSeriesChartProps) {
  // Create a map of existing data points for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach((item) => {
    dataMap.set(item._id, item.count);
  });

  // Determine date range and format
  let actualStart: Date;
  let actualEnd: Date;
  let actualDays: number;

  if (startDate && endDate) {
    actualStart = new Date(startDate + 'T00:00:00.000Z');
    actualEnd = new Date(endDate + 'T23:59:59.999Z');
    actualDays = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
  } else if (days !== undefined) {
    actualEnd = new Date();
    actualEnd.setUTCHours(23, 59, 59, 999);
    actualStart = new Date();
    actualStart.setUTCDate(actualStart.getUTCDate() - days);
    actualStart.setUTCHours(0, 0, 0, 0);
    actualDays = days;
  } else if (data.length > 0) {
    // Fallback: use data range
    const dates = data.map((item) => new Date(item._id + 'T00:00:00.000Z')).sort((a, b) => a.getTime() - b.getTime());
    actualStart = dates[0];
    actualEnd = dates[dates.length - 1];
    actualDays = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // No data and no range info
    actualDays = 0;
    actualStart = new Date();
    actualEnd = new Date();
  }

  // Determine date format based on actual time span
  let dateFormat: (date: Date) => string;
  if (actualDays <= 7) {
    // Show day name for 7 days or less
    dateFormat = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  } else if (actualDays <= 30) {
    // Show month and day for 30 days
    dateFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (actualDays <= 90) {
    // Show month and day for 90 days
    dateFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    // Show month and year for longer periods
    dateFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  // Generate complete date series with filled gaps
  const chartData: Array<{ date: string; value: number; fullDate: string }> = [];
  const currentDate = new Date(actualStart);
  
  // Determine step size based on period length
  let stepDays = 1; // Default: daily
  if (actualDays > 365) {
    stepDays = 30; // Monthly for very long periods
  } else if (actualDays > 90) {
    stepDays = 7; // Weekly for 3+ months
  }

  while (currentDate <= actualEnd) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const value = dataMap.get(dateStr) || 0;
    
    chartData.push({
      date: dateFormat(currentDate),
      value,
      fullDate: dateStr,
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + stepDays);
  }

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-lg p-6" style={{ height }}>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] mb-4 text-[hsl(var(--muted-foreground))]">
          {title}
        </h3>
        <div className="flex items-center justify-center h-full text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.12em]">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-lg p-4 sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] mb-4 text-[hsl(var(--foreground))]">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-strong))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border-strong))',
              borderRadius: '4px',
              color: 'hsl(var(--foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', textTransform: 'uppercase' }}
            formatter={(value: number | undefined) => {
              if (value === undefined) return ['0', valueLabel];
              return [value.toLocaleString(), valueLabel];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
