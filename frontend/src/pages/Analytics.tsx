import { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useEnergyData } from '../hooks';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type FilterRange = 'day' | 'week' | 'month';

// Custom tooltip for glowing dark theme persona
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-cyan)',
        boxShadow: 'var(--glow-cyan)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-glow)', textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>
          {payload[0].value ? payload[0].value.toFixed(4) : '0.0000'} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kWh</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { data, loading } = useEnergyData();
  const [filter, setFilter] = useState<FilterRange>('day');

  // Filter & calculate stats
  const { chartData, peakPower, avgPower, minPower, totalEnergy } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], peakPower: 0, avgPower: 0, minPower: 0, totalEnergy: 0 };
    }

    // Determine the cutoff date based on the filter
    const now = new Date();
    const cutoff = new Date(now);
    if (filter === 'day') cutoff.setHours(cutoff.getHours() - 24);
    else if (filter === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (filter === 'month') cutoff.setDate(cutoff.getDate() - 28);

    // Get basic stats for filtered range
    const filteredRecords = data.filter(d => new Date(d.timestamp) >= cutoff);
    const pPower = filteredRecords.length > 0 ? Math.max(...filteredRecords.map(d => d.power)) : 0;
    const aPower = filteredRecords.length > 0 ? filteredRecords.reduce((s, d) => s + d.power, 0) / filteredRecords.length : 0;
    const mPower = filteredRecords.length > 0 ? Math.min(...filteredRecords.map(d => d.power)) : 0;

    // Calculate incremental energy chunks for the BarChart
    const increments = [];
    for (let i = 1; i < data.length; i++) {
      const diff = (data[i].energy || 0) - (data[i - 1].energy || 0);
      increments.push({
        timestamp: new Date(data[i].timestamp),
        energyStep: diff > 0 ? diff : 0
      });
    }

    const grouped = new Map<string, number>();
    let tEnergy = 0;

    for (const inc of increments) {
      if (inc.timestamp >= cutoff) {
        tEnergy += inc.energyStep;

        if (filter === 'day') {
          // Group by hour
          const hourLabel = inc.timestamp.toLocaleTimeString([], { hour: 'numeric', hour12: true });
          grouped.set(hourLabel, (grouped.get(hourLabel) || 0) + inc.energyStep);
        } else if (filter === 'week') {
          // Group by day of week
          const dayLabel = inc.timestamp.toLocaleDateString([], { weekday: 'short' });
          grouped.set(dayLabel, (grouped.get(dayLabel) || 0) + inc.energyStep);
        } else if (filter === 'month') {
          // Group by week (last 4 weeks)
          const diffDays = (now.getTime() - inc.timestamp.getTime()) / (24 * 3600 * 1000);
          const weekNum = 4 - Math.floor(diffDays / 7);
          const weekLabel = `Wk ${weekNum}`;
          grouped.set(weekLabel, (grouped.get(weekLabel) || 0) + inc.energyStep);
        }
      }
    }

    const cData = Array.from(grouped).map(([name, energy]) => ({ name, energy }));

    return { chartData: cData, peakPower: pPower, avgPower: aPower, minPower: mPower, totalEnergy: tEnergy };
  }, [data, filter]);

  const handleDownload = () => {
    const csv = [
      'Period,Energy (kWh)',
      ...chartData.map(d => `${d.name},${d.energy.toFixed(6)}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `energy_analytics_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Historical energy consumption analysis</p>
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
        <button className="btn btn-secondary" onClick={handleDownload} style={{ boxShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
          📥 Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <Card title="Peak Power" icon="🔺" animationDelay={1}>
          <div className="card-value" style={{ color: 'var(--status-warning)', textShadow: '0 0 15px rgba(255,165,2,0.3)' }}>
            {peakPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Average Power" icon="📊" animationDelay={2}>
          <div className="card-value" style={{ color: 'var(--text-primary)' }}>
            {avgPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Minimum Power" icon="🔻" animationDelay={3}>
          <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>
            {minPower.toFixed(0)}
            <span className="card-unit">W</span>
          </div>
        </Card>

        <Card title="Total Energy" icon="⚡" glow="green" animationDelay={4}>
          <div className="card-value accent" style={{ textShadow: '0 0 20px rgba(0,255,136,0.3)' }}>
            {totalEnergy.toFixed(3)}
            <span className="card-unit">kWh</span>
          </div>
        </Card>
      </div>

      {/* Main chart */}
      <Card title={`Energy Consumption (${filter.toUpperCase()})`} icon="📈" animationDelay={5}>
        {loading ? (
          <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading chart data...
          </div>
        ) : (
          <div style={{ height: 450, width: '100%', marginTop: '20px', paddingRight: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                barSize={24}
              >
                <defs>
                  <linearGradient id="barGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={1} />
                  </linearGradient>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--accent-green)" floodOpacity="0.5"/>
                  </filter>
                </defs>
                <XAxis 
                  type="number" 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }} 
                  axisLine={{ stroke: 'var(--border-primary)', strokeWidth: 2 }}
                  tickLine={false}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fill: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }} 
                  width={100}
                  axisLine={{ stroke: 'var(--border-primary)', strokeWidth: 2 }}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(0, 255, 136, 0.08)' }} content={<CustomTooltip />} />
                <Bar 
                  dataKey="energy" 
                  radius={[0, 6, 6, 0]} 
                  fill="url(#barGlow)" 
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} style={{ filter: 'url(#shadow)' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
