import { useMetricHistory } from '../../hooks/useHealthData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface HeartRateChartProps {
  days?: number;
}

export function HeartRateChart({ days = 30 }: HeartRateChartProps) {
  const { data, loading, error } = useMetricHistory('heart_rate', days);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading heart rate data...
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
        No heart rate data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <div>
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Min: </span>
          <span className="font-medium">{Math.round(min)} bpm</span>
        </div>
        <div>
          <span className="text-gray-500">Avg: </span>
          <span className="font-medium">{Math.round(average)} bpm</span>
        </div>
        <div>
          <span className="text-gray-500">Max: </span>
          <span className="font-medium">{Math.round(max)} bpm</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={['dataMin - 5', 'dataMax + 5']}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            formatter={(value: number) => [`${Math.round(value)} bpm`, 'Resting HR']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine
            y={average}
            stroke="#9ca3af"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
