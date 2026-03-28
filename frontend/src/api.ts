import { db } from './firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

export interface EnergyRecord {
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  predicted_energy: number;
  anomaly: boolean | number;
  confidence?: number;
}

export interface SystemStatus {
  backend: string;
  ml_model: string;
  database: string;
  esp32: string;
}

export interface SettingsData {
  model: string;
  threshold: number;
  wifi_ssid: string;
  device_ip: string;
}

export async function fetchEnergyData(): Promise<EnergyRecord[]> {
  try {
    const limitCount = parseInt(localStorage.getItem('setting_dataPoints') || '50', 10);
    const q = query(
      collection(db, 'energy_data'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const data: EnergyRecord[] = [];

    snapshot.forEach((doc) => {
      const d = doc.data();
      data.push({
        timestamp: d.timestamp?.toDate?.() ? d.timestamp.toDate().toISOString() : d.timestamp,
        voltage: d.voltage ?? 0,
        current: d.current ?? 0,
        power: d.power ?? 0,
        energy: d.energy ?? 0,
        predicted_energy: d.predicted_energy ?? d.power ?? 0,
        anomaly: d.anomaly ?? false,
        confidence: d.confidence,
      });
    });

    // Reverse so oldest is first (chronological order, matching old API behavior)
    data.reverse();
    return data;
  } catch (e) {
    console.error('Firestore fetch failed:', e);
    return [];
  }
}

export async function fetchStatus(): Promise<SystemStatus> {
  // Derive status from data freshness — no backend call needed
  try {
    const data = await fetchEnergyData();
    const latest = data.length > 0 ? data[data.length - 1] : null;

    if (latest) {
      const lastTime = new Date(latest.timestamp).getTime();
      const now = Date.now();
      const ageMs = now - lastTime;

      // If last reading < 2 minutes old, backend+ESP are running
      const isRecent = ageMs < 120_000;

      return {
        backend: isRecent ? 'online' : 'offline',
        ml_model: latest.predicted_energy !== undefined ? 'loaded' : 'missing',
        database: 'connected',
        esp32: isRecent ? 'online' : 'offline',
      };
    }

    return {
      backend: 'offline',
      ml_model: 'unknown',
      database: 'connected',
      esp32: 'unknown',
    };
  } catch {
    return {
      backend: 'offline',
      ml_model: 'unknown',
      database: 'unknown',
      esp32: 'unknown',
    };
  }
}

export async function fetchAlerts(): Promise<EnergyRecord[]> {
  try {
    const data = await fetchEnergyData();
    return data.filter((d) => d.anomaly === true || d.anomaly === 1);
  } catch {
    return [];
  }
}

export async function fetchSettings(): Promise<SettingsData> {
  return {
    model: 'Naive Bayes',
    threshold: 75,
    wifi_ssid: 'EnergyNet-5G',
    device_ip: '192.168.1.105',
  };
}
