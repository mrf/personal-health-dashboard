import { WeeklySummary } from '../../services/api';

interface SummaryProps {
  summary: WeeklySummary;
}

export function Summary({ summary }: SummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">Daily Averages</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Steps</p>
            <p className="text-xl font-bold">{summary.averages.steps?.toLocaleString() ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Calories</p>
            <p className="text-xl font-bold">{summary.averages.active_calories?.toFixed(0) ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sleep</p>
            <p className="text-xl font-bold">{summary.averages.sleep_hours?.toFixed(1) ?? '-'}h</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Resting Heart Rate</p>
            <p className="text-xl font-bold">{summary.averages.resting_heart_rate?.toFixed(0) ?? '-'} bpm</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-3">Weekly Totals</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Steps</p>
            <p className="text-xl font-bold">{summary.totals.steps?.toLocaleString() ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Calories</p>
            <p className="text-xl font-bold">{summary.totals.active_calories?.toFixed(0) ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Workout Minutes</p>
            <p className="text-xl font-bold">{summary.totals.workout_minutes?.toFixed(0) ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Flights Climbed</p>
            <p className="text-xl font-bold">{summary.totals.flights_climbed ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        {summary.days_with_data} days of data in this period
      </div>
    </div>
  );
}
