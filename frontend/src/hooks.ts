import { useState, useEffect, useCallback } from 'react';
import { fetchEnergyData, fetchStatus, type EnergyRecord, type SystemStatus } from './api';

const CACHE_KEY = 'energypulse_data';

function loadCachedData(): EnergyRecord[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore parse errors */ }
  return [];
}

function saveCachedData(data: EnergyRecord[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

export function useEnergyData() {
  const intervalMs = 5000;
  const [data, setData] = useState<EnergyRecord[]>(loadCachedData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchEnergyData();
      // Only update if we got actual data; keep last data when offline
      if (result.length > 0) {
        setData(result);
        saveCachedData(result);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
      // Don't clear data — keep displaying the last known values
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}

export function useDeviceStatus(intervalMs: number = 10000) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchStatus();
      setStatus(result);
    } catch {
      setStatus({
        backend: 'offline',
        ml_model: 'unknown',
        database: 'unknown',
        esp32: 'unknown',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { status, loading, refresh };
}
