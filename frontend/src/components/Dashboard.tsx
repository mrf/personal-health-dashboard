import { useState } from 'react';
import { useImportStatus, useWeeklySummary, useTrends, useCorrelations, useRecords } from '../hooks/useHealthData';
import { StepsChart } from './charts/StepsChart';
import { HeartHealthView } from './charts/HeartHealthView';
import { SleepChart } from './charts/SleepChart';
import { WeightChart } from './charts/WeightChart';
import { TodaySummary } from './insights/TodaySummary';
import { Trends } from './insights/Trends';
import { Correlations } from './insights/Correlations';
import { PersonalRecords } from './insights/PersonalRecords';
import { ImportPanel } from './ImportPanel';
import { Activity, Heart, Moon, Scale, TrendingUp, Trophy, Zap } from 'lucide-react';

type TabType = 'overview' | 'activity' | 'sleep' | 'heart' | 'weight' | 'insights';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [days, setDays] = useState(30);
  const { status, refresh } = useImportStatus();

  const hasData = status?.data_range?.min_date != null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Zap size={18} /> },
    { id: 'sleep', label: 'Sleep', icon: <Moon size={18} /> },
    { id: 'heart', label: 'Heart', icon: <Heart size={18} /> },
    { id: 'weight', label: 'Weight', icon: <Scale size={18} /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="text-red-500" size={28} />
              <h1 className="text-xl font-semibold text-gray-900">Health Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
              {status?.last_import && (
                <span className="text-sm text-gray-500">
                  Last import: {new Date(status.last_import).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!hasData ? (
          <ImportPanel status={status} onImportComplete={refresh} />
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab days={days} />}
            {activeTab === 'activity' && <ActivityTab days={days} />}
            {activeTab === 'sleep' && <SleepTab days={days} />}
            {activeTab === 'heart' && <HeartTab days={days} />}
            {activeTab === 'weight' && <WeightTab days={days} />}
            {activeTab === 'insights' && <InsightsTab days={days} />}
          </>
        )}
      </main>
    </div>
  );
}

function OverviewTab({ days }: { days: number }) {
  const { summary, loading: summaryLoading } = useWeeklySummary();
  const { records, loading: recordsLoading } = useRecords();

  return (
    <div className="space-y-6">
      <TodaySummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Steps</h3>
          <StepsChart days={days} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Sleep</h3>
          <SleepChart days={days} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Personal Records
          </h3>
          {recordsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <PersonalRecords records={records} />
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Summary</h3>
          {summaryLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Avg Daily Steps</p>
                <p className="text-2xl font-bold">{summary.averages.steps?.toLocaleString() ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Sleep</p>
                <p className="text-2xl font-bold">{summary.averages.sleep_hours?.toFixed(1) ?? '-'}h</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Calories</p>
                <p className="text-2xl font-bold">{summary.totals.active_calories?.toLocaleString() ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Workout Minutes</p>
                <p className="text-2xl font-bold">{summary.totals.workout_minutes?.toFixed(0) ?? '-'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ days }: { days: number }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Steps</h3>
        <StepsChart days={days} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Active Calories</h3>
          <CaloriesChart days={days} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Distance (km)</h3>
          <DistanceChart days={days} />
        </div>
      </div>
    </div>
  );
}

function SleepTab({ days }: { days: number }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Sleep Duration</h3>
        <SleepChart days={days} />
      </div>
    </div>
  );
}

function HeartTab({ days }: { days: number }) {
  return <HeartHealthView days={days} />;
}

function WeightTab({ days }: { days: number }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Weight Trend</h3>
        <WeightChart days={days} />
      </div>
    </div>
  );
}

function InsightsTab({ days }: { days: number }) {
  const { trends, loading: trendsLoading } = useTrends(days);
  const { correlations, loading: corrLoading } = useCorrelations(days);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Trends ({days} day comparison)</h3>
        {trendsLoading ? (
          <p className="text-gray-500">Analyzing trends...</p>
        ) : (
          <Trends trends={trends} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Correlations</h3>
        {corrLoading ? (
          <p className="text-gray-500">Finding patterns...</p>
        ) : (
          <Correlations correlations={correlations} />
        )}
      </div>
    </div>
  );
}

// Simple chart components for calories and distance
import { useMetricHistory } from '../hooks/useHealthData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CaloriesChart({ days }: { days: number }) {
  const { data, loading } = useMetricHistory('calories', days);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>;
  if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-500">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(d) => new Date(d).toLocaleDateString()}
          formatter={(value: number) => [`${value.toLocaleString()} kcal`, 'Calories']}
        />
        <Area type="monotone" dataKey="value" stroke="#f97316" fill="#fed7aa" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DistanceChart({ days }: { days: number }) {
  const { data, loading } = useMetricHistory('distance', days);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>;
  if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-500">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          labelFormatter={(d) => new Date(d).toLocaleDateString()}
          formatter={(value: number) => [`${value.toFixed(2)} km`, 'Distance']}
        />
        <Area type="monotone" dataKey="value" stroke="#10b981" fill="#a7f3d0" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
