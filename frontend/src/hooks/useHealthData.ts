import { useState, useEffect, useCallback } from 'react';
import { api, ImportStatus, DailySummary, WeeklySummary, TrendInsight, CorrelationInsight, PersonalRecord } from '../services/api';

export function useImportStatus() {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while importing
  useEffect(() => {
    if (status?.status === 'parsing' || status?.status === 'computing') {
      const interval = setInterval(refresh, 1000);
      return () => clearInterval(interval);
    }
  }, [status?.status, refresh]);

  return { status, loading, error, refresh };
}

export function useDailySummary(date?: string) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getDailySummary(date)
      .then(data => {
        setSummary(data);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [date]);

  return { summary, loading, error };
}

export function useWeeklySummary() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getWeeklySummary()
      .then(data => {
        setSummary(data);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading, error };
}

export function useTrends(days = 30) {
  const [trends, setTrends] = useState<TrendInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getTrends(days)
      .then(data => {
        setTrends(data.trends);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [days]);

  return { trends, loading, error };
}

export function useCorrelations(days = 90) {
  const [correlations, setCorrelations] = useState<CorrelationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCorrelations(days)
      .then(data => {
        setCorrelations(data.correlations);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [days]);

  return { correlations, loading, error };
}

export function useRecords() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRecords()
      .then(data => {
        setRecords(data.records);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  return { records, loading, error };
}

export function useMetricHistory(metric: string, days = 30) {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getMetricHistory(metric, days)
      .then(result => {
        setData(result.data);
        setError(null);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [metric, days]);

  return { data, loading, error };
}
