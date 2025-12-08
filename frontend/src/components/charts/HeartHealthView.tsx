import { useState, useEffect, useMemo } from 'react';
import { useMetricHistory } from '../../hooks/useHealthData';
import { api } from '../../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart, Bar, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Heart, Droplets, Coffee, Activity } from 'lucide-react';

interface HeartHealthViewProps {
  days?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}

function MetricCard({ title, value, unit, icon, color, subtext }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="text-2xl font-bold">
        {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </div>
      {subtext && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

export function HeartHealthView({ days = 30 }: HeartHealthViewProps) {
  const { data: heartRateData, loading: hrLoading } = useMetricHistory('heart_rate', days);
  const { data: systolicData, loading: sysLoading } = useMetricHistory('blood_pressure_systolic', days);
  const { data: diastolicData, loading: diaLoading } = useMetricHistory('blood_pressure_diastolic', days);
  const { data: caffeineData, loading: caffLoading } = useMetricHistory('caffeine', days);
  const { data: waterData, loading: waterLoading } = useMetricHistory('water', days);

  const [units, setUnits] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getUnits().then(setUnits).catch(() => {});
  }, []);

  const loading = hrLoading || sysLoading || diaLoading || caffLoading || waterLoading;

  // Merge all data by date for correlation view
  const mergedData = useMemo(() => {
    const dataMap = new Map<string, {
      date: string;
      heartRate?: number;
      systolic?: number;
      diastolic?: number;
      caffeine?: number;
      water?: number;
    }>();

    heartRateData.forEach(d => {
      const existing = dataMap.get(d.date) || { date: d.date };
      existing.heartRate = d.value;
      dataMap.set(d.date, existing);
    });

    systolicData.forEach(d => {
      const existing = dataMap.get(d.date) || { date: d.date };
      existing.systolic = d.value;
      dataMap.set(d.date, existing);
    });

    diastolicData.forEach(d => {
      const existing = dataMap.get(d.date) || { date: d.date };
      existing.diastolic = d.value;
      dataMap.set(d.date, existing);
    });

    caffeineData.forEach(d => {
      const existing = dataMap.get(d.date) || { date: d.date };
      existing.caffeine = d.value;
      dataMap.set(d.date, existing);
    });

    waterData.forEach(d => {
      const existing = dataMap.get(d.date) || { date: d.date };
      existing.water = d.value;
      dataMap.set(d.date, existing);
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [heartRateData, systolicData, diastolicData, caffeineData, waterData]);

  // Calculate averages
  const avgHeartRate = heartRateData.length
    ? Math.round(heartRateData.reduce((a, b) => a + b.value, 0) / heartRateData.length)
    : null;
  const avgSystolic = systolicData.length
    ? Math.round(systolicData.reduce((a, b) => a + b.value, 0) / systolicData.length)
    : null;
  const avgDiastolic = diastolicData.length
    ? Math.round(diastolicData.reduce((a, b) => a + b.value, 0) / diastolicData.length)
    : null;
  const avgCaffeine = caffeineData.length
    ? Math.round(caffeineData.reduce((a, b) => a + b.value, 0) / caffeineData.length)
    : null;
  const avgWater = waterData.length
    ? Math.round(waterData.reduce((a, b) => a + b.value, 0) / waterData.length)
    : null;

  // Calculate simple correlation between caffeine and heart rate
  const correlationData = useMemo(() => {
    return mergedData
      .filter(d => d.caffeine !== undefined && d.heartRate !== undefined)
      .map(d => ({
        caffeine: d.caffeine,
        heartRate: d.heartRate,
        date: d.date
      }));
  }, [mergedData]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Loading heart health data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Resting Heart Rate"
          value={avgHeartRate ?? '-'}
          unit="bpm"
          icon={<Heart size={18} className="text-red-500" />}
          color="bg-red-50"
          subtext={`${days} day avg`}
        />
        <MetricCard
          title="Blood Pressure"
          value={avgSystolic && avgDiastolic ? `${avgSystolic}/${avgDiastolic}` : '-'}
          unit="mmHg"
          icon={<Activity size={18} className="text-purple-500" />}
          color="bg-purple-50"
          subtext={avgSystolic ? (avgSystolic < 120 ? 'Normal' : avgSystolic < 130 ? 'Elevated' : 'High') : undefined}
        />
        <MetricCard
          title="Daily Caffeine"
          value={avgCaffeine ?? '-'}
          unit={units.caffeine || 'mg'}
          icon={<Coffee size={18} className="text-amber-600" />}
          color="bg-amber-50"
          subtext={`${days} day avg`}
        />
        <MetricCard
          title="Daily Water"
          value={avgWater ? Math.round(avgWater / 1000 * 10) / 10 : '-'}
          unit="L"
          icon={<Droplets size={18} className="text-blue-500" />}
          color="bg-blue-50"
          subtext={`${days} day avg`}
        />
      </div>

      {/* Heart Rate & Blood Pressure Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Heart Rate & Blood Pressure</h3>
        {mergedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                yAxisId="hr"
                orientation="left"
                domain={[40, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'HR (bpm)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <YAxis
                yAxisId="bp"
                orientation="right"
                domain={[60, 160]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'BP (mmHg)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="heartRate"
                name="Resting HR"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                yAxisId="bp"
                type="monotone"
                dataKey="systolic"
                name="Systolic"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                yAxisId="bp"
                type="monotone"
                dataKey="diastolic"
                name="Diastolic"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              {avgHeartRate && (
                <ReferenceLine yAxisId="hr" y={avgHeartRate} stroke="#fca5a5" strokeDasharray="5 5" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No heart rate or blood pressure data available
          </div>
        )}
      </div>

      {/* Caffeine & Water Intake */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Caffeine & Water Intake</h3>
        {mergedData.some(d => d.caffeine || d.water) ? (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                yAxisId="caffeine"
                orientation="left"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'Caffeine (mg)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <YAxis
                yAxisId="water"
                orientation="right"
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}L`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'Water (L)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                formatter={(value: number, name: string) => {
                  if (name === 'Water') return [`${(value / 1000).toFixed(2)} L`, name];
                  return [`${Math.round(value)} mg`, name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar yAxisId="caffeine" dataKey="caffeine" name="Caffeine" fill="#d97706" opacity={0.8} />
              <Line
                yAxisId="water"
                type="monotone"
                dataKey="water"
                name="Water"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No caffeine or water data available
          </div>
        )}
      </div>

      {/* Caffeine vs Heart Rate Correlation */}
      {correlationData.length > 5 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Caffeine vs Heart Rate</h3>
          <p className="text-sm text-gray-500 mb-4">
            Each point represents a day. Look for patterns between caffeine intake and resting heart rate.
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="caffeine"
                name="Caffeine"
                unit=" mg"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'Caffeine (mg)', position: 'bottom', style: { fontSize: 12 } }}
              />
              <YAxis
                dataKey="heartRate"
                name="Heart Rate"
                unit=" bpm"
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'Resting HR (bpm)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <ZAxis range={[50, 50]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Caffeine') return [`${Math.round(value)} mg`, name];
                  return [`${Math.round(value)} bpm`, name];
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Scatter name="Daily Data" data={correlationData} fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
