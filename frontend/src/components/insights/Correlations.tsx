import { CorrelationInsight } from '../../services/api';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CorrelationsProps {
  correlations: CorrelationInsight[];
}

const metricLabels: Record<string, string> = {
  steps: 'Steps',
  calories: 'Calories',
  sleep: 'Sleep',
  heart_rate: 'Heart Rate',
  workouts: 'Workouts',
  weight: 'Weight',
};

export function Correlations({ correlations }: CorrelationsProps) {
  if (!correlations.length) {
    return (
      <p className="text-gray-500 text-center py-8">
        No significant correlations found yet. More data may reveal patterns!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {correlations.map((corr, index) => {
        const isPositive = corr.correlation > 0;
        const strengthColor =
          corr.strength === 'strong' ? 'text-green-600' :
          corr.strength === 'moderate' ? 'text-yellow-600' : 'text-gray-500';

        const bgColor =
          corr.strength === 'strong' ? 'bg-green-50 border-green-200' :
          corr.strength === 'moderate' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200';

        return (
          <div key={index} className={`rounded-lg p-4 border ${bgColor}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-medium text-gray-900">
                {metricLabels[corr.metric1] || corr.metric1}
              </span>
              {isPositive ? (
                <ArrowUpRight className="text-green-500" size={20} />
              ) : (
                <ArrowDownRight className="text-red-500" size={20} />
              )}
              <span className="font-medium text-gray-900">
                {metricLabels[corr.metric2] || corr.metric2}
              </span>
              <span className={`ml-auto text-sm font-medium ${strengthColor}`}>
                {corr.strength} ({(corr.correlation * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="text-sm text-gray-600">{corr.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              {isPositive
                ? 'When one increases, the other tends to increase too'
                : 'When one increases, the other tends to decrease'
              }
            </p>
          </div>
        );
      })}
    </div>
  );
}
