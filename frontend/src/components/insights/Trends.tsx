import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TrendInsight } from '../../services/api';

interface TrendsProps {
  trends: TrendInsight[];
}

const metricLabels: Record<string, string> = {
  steps: 'Daily Steps',
  calories: 'Active Calories',
  sleep: 'Sleep Duration',
  heart_rate: 'Resting Heart Rate',
  workouts: 'Workout Minutes',
};

const metricUnits: Record<string, string> = {
  steps: 'steps',
  calories: 'kcal',
  sleep: 'hours',
  heart_rate: 'bpm',
  workouts: 'min',
};

export function Trends({ trends }: TrendsProps) {
  if (!trends.length) {
    return (
      <p className="text-gray-500 text-center py-8">
        Not enough data to calculate trends. Keep tracking for a few weeks!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {trends.map((trend) => {
        const isPositive = trend.trend === 'up';
        const isNegative = trend.trend === 'down';

        // For heart rate, lower is better
        const isGood = trend.metric === 'heart_rate'
          ? isNegative
          : isPositive;

        const TrendIcon = isPositive
          ? TrendingUp
          : isNegative
            ? TrendingDown
            : Minus;

        const trendColor = trend.trend === 'stable'
          ? 'text-gray-500'
          : isGood
            ? 'text-green-500'
            : 'text-red-500';

        const bgColor = trend.trend === 'stable'
          ? 'bg-gray-50'
          : isGood
            ? 'bg-green-50'
            : 'bg-red-50';

        return (
          <div key={trend.metric} className={`rounded-lg p-4 ${bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">
                {metricLabels[trend.metric] || trend.metric}
              </span>
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon size={18} />
                <span className="text-sm font-medium">
                  {Math.abs(trend.change_percent).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {trend.current_avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm text-gray-500">
                {metricUnits[trend.metric] || ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Previous: {trend.previous_avg.toLocaleString(undefined, { maximumFractionDigits: 1 })} {metricUnits[trend.metric] || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
