import { useDailySummary } from '../../hooks/useHealthData';
import { Footprints, Flame, Moon, Heart, Route, Mountain } from 'lucide-react';

export function TodaySummary() {
  const { summary, loading } = useDailySummary();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: 'Steps',
      value: summary?.steps,
      format: (v: number) => v.toLocaleString(),
      icon: <Footprints size={20} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Calories',
      value: summary?.active_calories,
      format: (v: number) => `${Math.round(v)}`,
      unit: 'kcal',
      icon: <Flame size={20} />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Sleep',
      value: summary?.sleep_hours,
      format: (v: number) => v.toFixed(1),
      unit: 'hours',
      icon: <Moon size={20} />,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Heart Rate',
      value: summary?.resting_heart_rate,
      format: (v: number) => Math.round(v).toString(),
      unit: 'bpm',
      icon: <Heart size={20} />,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Distance',
      value: summary?.distance_km,
      format: (v: number) => v.toFixed(1),
      unit: 'km',
      icon: <Route size={20} />,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Flights',
      value: summary?.flights_climbed,
      format: (v: number) => Math.round(v).toString(),
      icon: <Mountain size={20} />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${metric.bgColor} ${metric.color}`}>
                {metric.icon}
              </div>
              <span className="text-sm text-gray-500">{metric.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value != null ? metric.format(metric.value) : '-'}
              </span>
              {metric.unit && metric.value != null && (
                <span className="text-sm text-gray-500">{metric.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
