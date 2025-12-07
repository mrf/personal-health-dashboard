import { useMetricHistory } from '../../hooks/useHealthData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightChartProps {
  days?: number;
}

export function WeightChart({ days = 90 }: WeightChartProps) {
  const { data, loading, error } = useMetricHistory('weight', days);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading weight data...
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
        No weight data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const current = values[values.length - 1];
  const first = values[0];
  const change = current - first;

  return (
    <div>
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Current: </span>
          <span className="font-medium">{current.toFixed(1)} kg</span>
        </div>
        <div>
          <span className="text-gray-500">Change: </span>
          <span className={`font-medium ${change < 0 ? 'text-green-600' : change > 0 ? 'text-red-600' : ''}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
          </span>
        </div>
        <div>
          <span className="text-gray-500">Range: </span>
          <span className="font-medium">{min.toFixed(1)} - {max.toFixed(1)} kg</span>
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
            domain={[Math.floor(min - 1), Math.ceil(max + 1)]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(w) => `${w}kg`}
          />
          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
