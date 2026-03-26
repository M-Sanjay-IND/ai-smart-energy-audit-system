const API_BASE = '/api';

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
    const limit = localStorage.getItem('setting_dataPoints') || '50';
    const res = await fetch(`${API_BASE}/get-data?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
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
