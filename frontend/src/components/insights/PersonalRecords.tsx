import { PersonalRecord } from '../../services/api';
import { Trophy } from 'lucide-react';

interface PersonalRecordsProps {
  records: PersonalRecord[];
}

const metricLabels: Record<string, string> = {
  steps: 'Most Steps',
  active_calories: 'Most Calories Burned',
  sleep: 'Longest Sleep',
  workout_minutes: 'Longest Workout Day',
  distance: 'Longest Distance',
  flights_climbed: 'Most Flights Climbed',
};

const metricColors: Record<string, string> = {
  steps: 'bg-blue-100 text-blue-700',
  active_calories: 'bg-orange-100 text-orange-700',
  sleep: 'bg-indigo-100 text-indigo-700',
  workout_minutes: 'bg-green-100 text-green-700',
  distance: 'bg-emerald-100 text-emerald-700',
  flights_climbed: 'bg-purple-100 text-purple-700',
};

export function PersonalRecords({ records }: PersonalRecordsProps) {
  if (!records.length) {
    return (
      <p className="text-gray-500 text-center py-4">
        No records yet. Start tracking to see your personal bests!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.metric}
          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
        >
          <div className="p-2 bg-amber-100 rounded-full">
            <Trophy className="text-amber-600" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {metricLabels[record.metric] || record.metric}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(record.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${metricColors[record.metric] || 'bg-gray-100 text-gray-700'}`}>
            {record.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {record.unit}
          </div>
        </div>
      ))}
    </div>
  );
}
