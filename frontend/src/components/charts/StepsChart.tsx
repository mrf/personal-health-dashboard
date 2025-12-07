import { useMetricHistory } from '../../hooks/useHealthData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface StepsChartProps {
  days?: number;
}

export function StepsChart({ days = 30 }: StepsChartProps) {
  const { data, loading, error } = useMetricHistory('steps', days);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading step data...
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
        No step data available
      </div>
    );
  }

  const average = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  return (
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
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          formatter={(value: number) => [value.toLocaleString(), 'Steps']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <ReferenceLine
          y={average}
          stroke="#9ca3af"
          strokeDasharray="5 5"
          label={{ value: `Avg: ${Math.round(average).toLocaleString()}`, position: 'right', fontSize: 12, fill: '#6b7280' }}
        />
        <ReferenceLine
          y={10000}
          stroke="#22c55e"
          strokeDasharray="3 3"
          label={{ value: '10k goal', position: 'right', fontSize: 12, fill: '#22c55e' }}
        />
        <Bar
          dataKey="value"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
