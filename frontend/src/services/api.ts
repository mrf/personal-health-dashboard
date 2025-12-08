const API_BASE = '/api';

export interface DailySummary {
  date: string;
  steps: number | null;
  active_calories: number | null;
  resting_heart_rate: number | null;
  weight: number | null;
  sleep_hours: number | null;
  workout_minutes: number | null;
  distance_km: number | null;
  flights_climbed: number | null;
}

export interface MetricData {
  date: string;
  value: number;
}

export interface TrendInsight {
  metric: string;
  current_avg: number;
  previous_avg: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CorrelationInsight {
  metric1: string;
  metric2: string;
  correlation: number;
  description: string;
  strength: string;
}

export interface PersonalRecord {
  metric: string;
  value: number;
  date: string;
  unit: string;
}

export interface ImportStatus {
  status: 'idle' | 'parsing' | 'computing' | 'complete' | 'error';
  progress: number;
  records_imported: number;
  last_import: string | null;
  error_message: string | null;
  data_range: {
    min_date: string | null;
    max_date: string | null;
  };
}

export interface Workout {
  id: number;
  workout_type: string;
  duration_minutes: number | null;
  total_distance: number | null;
  total_energy_burned: number | null;
  start_date: string;
  end_date: string;
  source_name: string | null;
}

export interface WeeklySummary {
  period: { start: string; end: string };
  averages: {
    steps: number | null;
    active_calories: number | null;
    sleep_hours: number | null;
    resting_heart_rate: number | null;
  };
  totals: {
    steps: number | null;
    active_calories: number | null;
    workout_minutes: number | null;
    flights_climbed: number | null;
  };
  days_with_data: number;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
}

export const api = {
  // Status
  getStatus: () => fetchJson<ImportStatus>(`${API_BASE}/status`),

  getOverview: () => fetchJson<{
    import_status: string;
    last_import: string | null;
    records_count: number;
    date_range: { min: string | null; max: string | null };
  }>(`${API_BASE}/overview`),

  // Upload
  uploadFile: async (file: File): Promise<{ message: string; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  importLocalFile: () => fetchJson<{ message: string; status: string }>(`${API_BASE}/upload/local`, {
    method: 'POST',
  }),

  clearData: () => fetchJson<{ message: string }>(`${API_BASE}/data`, {
    method: 'DELETE',
  }),

  // Health data
  getDailySummary: (date?: string) => {
    const params = date ? `?target_date=${date}` : '';
    return fetchJson<DailySummary>(`${API_BASE}/health/summary${params}`);
  },

  getSummariesRange: (start: string, end: string) =>
    fetchJson<{ summaries: DailySummary[]; count: number }>(
      `${API_BASE}/health/range?start=${start}&end=${end}`
    ),

  getMetricHistory: (metric: string, days = 30) =>
    fetchJson<{ metric: string; data: MetricData[]; count: number }>(
      `${API_BASE}/health/metrics/${metric}?days=${days}`
    ),

  getWorkouts: (days = 30) =>
    fetchJson<{ workouts: Workout[]; count: number }>(
      `${API_BASE}/health/workouts?days=${days}`
    ),

  getDateRange: () =>
    fetchJson<{ min_date: string | null; max_date: string | null }>(
      `${API_BASE}/health/date-range`
    ),

  getUnits: () =>
    fetchJson<Record<string, string>>(`${API_BASE}/health/units`),

  getUnit: (metric: string) =>
    fetchJson<{ metric: string; unit: string | null }>(
      `${API_BASE}/health/units/${metric}`
    ),

  // Insights
  getTrends: (days = 30) =>
    fetchJson<{ trends: TrendInsight[]; period_days: number }>(
      `${API_BASE}/insights/trends?days=${days}`
    ),

  getCorrelations: (days = 90) =>
    fetchJson<{ correlations: CorrelationInsight[] }>(
      `${API_BASE}/insights/correlations?days=${days}`
    ),

  getRecords: () =>
    fetchJson<{ records: PersonalRecord[] }>(`${API_BASE}/insights/records`),

  getWeeklySummary: () =>
    fetchJson<WeeklySummary>(`${API_BASE}/insights/weekly-summary`),
};
