import { vi } from 'vitest'
import type { ImportStatus, DailySummary, WeeklySummary, TrendInsight, CorrelationInsight, PersonalRecord } from '../services/api'

export const mockImportStatus: ImportStatus = {
  status: 'complete',
  progress: 100,
  records_imported: 10000,
  last_import: '2024-01-15T10:00:00Z',
  error_message: null,
  data_range: {
    min_date: '2023-01-01',
    max_date: '2024-01-15',
  },
}

export const mockDailySummary: DailySummary = {
  date: '2024-01-15',
  steps: 8500,
  active_calories: 450,
  resting_heart_rate: 62,
  weight: 75.5,
  sleep_hours: 7.5,
  workout_minutes: 45,
  distance_km: 6.2,
  flights_climbed: 12,
}

export const mockWeeklySummary: WeeklySummary = {
  period: { start: '2024-01-08', end: '2024-01-15' },
  averages: {
    steps: 7500,
    active_calories: 420,
    sleep_hours: 7.2,
    resting_heart_rate: 63,
  },
  totals: {
    steps: 52500,
    active_calories: 2940,
    workout_minutes: 180,
    flights_climbed: 75,
  },
  days_with_data: 7,
}

export const mockTrends: TrendInsight[] = [
  { metric: 'steps', current_avg: 8000, previous_avg: 7500, change_percent: 6.7, trend: 'up' },
  { metric: 'sleep', current_avg: 7.5, previous_avg: 7.0, change_percent: 7.1, trend: 'up' },
  { metric: 'heart_rate', current_avg: 62, previous_avg: 65, change_percent: -4.6, trend: 'down' },
]

export const mockCorrelations: CorrelationInsight[] = [
  { metric1: 'steps', metric2: 'sleep', correlation: 0.45, description: 'More steps may improve sleep quality', strength: 'moderate' },
  { metric1: 'workouts', metric2: 'calories', correlation: 0.72, description: 'Workouts burn more calories', strength: 'strong' },
]

export const mockRecords: PersonalRecord[] = [
  { metric: 'steps', value: 15000, date: '2024-01-10', unit: 'steps' },
  { metric: 'sleep', value: 9.5, date: '2024-01-12', unit: 'hours' },
  { metric: 'active_calories', value: 850, date: '2024-01-08', unit: 'kcal' },
]

export const mockMetricHistory = [
  { date: '2024-01-13', value: 7500 },
  { date: '2024-01-14', value: 8200 },
  { date: '2024-01-15', value: 8500 },
]

export function createFetchMock() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/status')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockImportStatus),
      })
    }
    if (url.includes('/api/health/summary')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDailySummary),
      })
    }
    if (url.includes('/api/insights/weekly-summary')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWeeklySummary),
      })
    }
    if (url.includes('/api/insights/trends')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ trends: mockTrends, period_days: 30 }),
      })
    }
    if (url.includes('/api/insights/correlations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ correlations: mockCorrelations }),
      })
    }
    if (url.includes('/api/insights/records')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ records: mockRecords }),
      })
    }
    if (url.includes('/api/health/metrics/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ metric: 'steps', data: mockMetricHistory, count: 3 }),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })
}
