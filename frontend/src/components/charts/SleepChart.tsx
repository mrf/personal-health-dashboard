import { useMetricHistory } from '../../hooks/useHealthData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface SleepChartProps {
  days?: number;
}

export function SleepChart({ days = 30 }: SleepChartProps) {
  const { data, loading, error } = useMetricHistory('sleep', days);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading sleep data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No sleep data available
      </div>
    );
  }

  const average = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  // Color based on sleep quality (7-9 hours is ideal)
  const getBarColor = (hours: number) => {
    if (hours >= 7 && hours <= 9) return '#22c55e'; // Good - green
    if (hours >= 6 && hours < 7) return '#eab308'; // OK - yellow
    if (hours > 9 && hours <= 10) return '#eab308'; // OK - yellow
    return '#ef4444'; // Poor - red
  };

  return (
    <div>
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Average: </span>
          <span className="font-medium">{average.toFixed(1)} hours</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded"></span> 7-9h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-500 rounded"></span> 6-7h / 9-10h
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded"></span> &lt;6h / &gt;10h
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 12]}
            ticks={[0, 2, 4, 6, 8, 10, 12]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(h) => `${h}h`}
          />
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Sleep']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={9} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine
            y={average}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            label={{ value: `Avg: ${average.toFixed(1)}h`, position: 'right', fontSize: 12, fill: '#6b7280' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
