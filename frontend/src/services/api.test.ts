import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStatus', () => {
    it('should fetch import status', async () => {
      const mockStatus = {
        status: 'complete',
        progress: 100,
        records_imported: 10000,
        last_import: '2024-01-15T10:00:00Z',
        error_message: null,
        data_range: { min_date: '2023-01-01', max_date: '2024-01-15' },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      } as Response)

      const result = await api.getStatus()

      expect(fetch).toHaveBeenCalledWith('/api/status', undefined)
      expect(result).toEqual(mockStatus)
    })

    it('should throw on error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Server error' }),
      } as Response)

      await expect(api.getStatus()).rejects.toThrow('Server error')
    })
  })

  describe('getDailySummary', () => {
    it('should fetch daily summary without date', async () => {
      const mockSummary = {
        date: '2024-01-15',
        steps: 8500,
        active_calories: 450,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      } as Response)

      const result = await api.getDailySummary()

      expect(fetch).toHaveBeenCalledWith('/api/health/summary', undefined)
      expect(result.steps).toBe(8500)
    })

    it('should fetch daily summary with specific date', async () => {
      const mockSummary = { date: '2024-01-10', steps: 7000 }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      } as Response)

      await api.getDailySummary('2024-01-10')

      expect(fetch).toHaveBeenCalledWith('/api/health/summary?target_date=2024-01-10', undefined)
    })
  })

  describe('getMetricHistory', () => {
    it('should fetch metric history with default days', async () => {
      const mockHistory = {
        metric: 'steps',
        data: [{ date: '2024-01-15', value: 8500 }],
        count: 1,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      } as Response)

      const result = await api.getMetricHistory('steps')

      expect(fetch).toHaveBeenCalledWith('/api/health/metrics/steps?days=30', undefined)
      expect(result.metric).toBe('steps')
    })

    it('should fetch metric history with custom days', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ metric: 'steps', data: [], count: 0 }),
      } as Response)

      await api.getMetricHistory('steps', 90)

      expect(fetch).toHaveBeenCalledWith('/api/health/metrics/steps?days=90', undefined)
    })
  })

  describe('getTrends', () => {
    it('should fetch trends', async () => {
      const mockTrends = {
        trends: [
          { metric: 'steps', current_avg: 8000, previous_avg: 7500, change_percent: 6.7, trend: 'up' },
        ],
        period_days: 30,
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTrends),
      } as Response)

      const result = await api.getTrends()

      expect(result.trends).toHaveLength(1)
      expect(result.trends[0].trend).toBe('up')
    })
  })

  describe('getCorrelations', () => {
    it('should fetch correlations', async () => {
      const mockCorrelations = {
        correlations: [
          { metric1: 'steps', metric2: 'sleep', correlation: 0.45, description: 'Test', strength: 'moderate' },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCorrelations),
      } as Response)

      const result = await api.getCorrelations()

      expect(result.correlations).toHaveLength(1)
      expect(result.correlations[0].correlation).toBe(0.45)
    })
  })

  describe('getRecords', () => {
    it('should fetch personal records', async () => {
      const mockRecords = {
        records: [
          { metric: 'steps', value: 15000, date: '2024-01-10', unit: 'steps' },
        ],
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecords),
      } as Response)

      const result = await api.getRecords()

      expect(result.records).toHaveLength(1)
      expect(result.records[0].value).toBe(15000)
    })
  })

  describe('uploadFile', () => {
    it('should upload file with FormData', async () => {
      const file = new File(['test'], 'export.xml', { type: 'application/xml' })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Import started', status: 'parsing' }),
      } as Response)

      const result = await api.uploadFile(file)

      expect(fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }))
      expect(result.status).toBe('parsing')
    })
  })

  describe('clearData', () => {
    it('should clear all data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'All data cleared' }),
      } as Response)

      const result = await api.clearData()

      expect(fetch).toHaveBeenCalledWith('/api/data', { method: 'DELETE' })
      expect(result.message).toContain('cleared')
    })
  })
})
