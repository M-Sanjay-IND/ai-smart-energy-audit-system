import { useState, useMemo } from 'react';
import Card from '../components/Card';
import PowerChart from '../components/PowerChart';
import { useEnergyData } from '../hooks';

type FilterRange = 'day' | 'week' | 'month';

export default function Analytics() {
  const { data, loading } = useEnergyData();
  const [filter, setFilter] = useState<FilterRange>('day');

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);

    switch (filter) {
      case 'day':
        cutoff.setHours(cutoff.getHours() - 24);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
    }

    return data.filter((d) => new Date(d.timestamp) >= cutoff);
  }, [data, filter]);

  const chartData = filteredData.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: d.power,
  }));

  // Stats
  const peakPower = filteredData.length > 0 ? Math.max(...filteredData.map((d) => d.power)) : 0;
  const avgPower = filteredData.length > 0 ? filteredData.reduce((s, d) => s + d.power, 0) / filteredData.length : 0;
  const minPower = filteredData.length > 0 ? Math.min(...filteredData.map((d) => d.power)) : 0;
  const totalEnergy = filteredData.reduce((s, d) => s + (d.energy || 0), 0);

  const handleDownload = () => {
    const csv = [
      'Timestamp,Voltage,Current,Power,Energy,Anomaly',
      ...filteredData.map(
        (d) => `${d.timestamp},${d.voltage},${d.current},${d.power},${d.energy},${d.anomaly}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy_data_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Historical power consumption analysis</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {(['day', 'week', 'month'] as FilterRange[]).map((f) => (
          <button
            key={f}
            className={`btn btn-ghost ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={handleDownload}>
          📥 Download CSV
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <Card title="Peak Power" icon="🔺" glow="cyan" animationDelay={1}>
          <div className="card-value" style={{ color: 'var(--status-warning)' }}>
            {peakPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Average Power" icon="📊" animationDelay={2}>
          <div className="card-value">
            {avgPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Minimum Power" icon="🔻" animationDelay={3}>
          <div className="card-value">
            {minPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Total Energy" icon="⚡" animationDelay={4}>
          <div className="card-value accent">
            {totalEnergy.toFixed(2)}
            <span className="card-unit">kWh</span>
          </div>
        </Card>
      </div>

      {/* Main chart */}
      <Card title="Power vs Time" icon="📈" animationDelay={5}>
        {loading ? (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading chart data...
          </div>
        ) : (
          <PowerChart
            data={chartData}
            color="#00d4ff"
            gradientId="analyticsChart"
            height={400}
            unit="W"
            referenceLine={peakPower > 0 ? peakPower * 0.9 : undefined}
            referenceLabel="Peak Threshold"
          />
        )}
      </Card>
    </div>
  );
}
