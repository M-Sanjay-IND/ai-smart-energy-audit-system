import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import PowerChart from '../components/PowerChart';
import { useEnergyData } from '../hooks';

export default function Dashboard() {
  const { data, loading } = useEnergyData();

  // Latest record
  const latest = data.length > 0 ? data[data.length - 1] : null;
  const prevRecord = data.length > 1 ? data[data.length - 2] : null;

  // Compute energy today (sum of energy from records)
  const energyToday = data.reduce((sum, d) => sum + (d.energy || 0), 0);

  // Chart data — show all available points with smart timestamp labels
  const chartData = data.slice(-50).map((d) => {
    const ts = new Date(d.timestamp);
    const now = new Date();
    const isToday = ts.toDateString() === now.toDateString();
    const timeStr = isToday
      ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ts.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { time: timeStr, value: d.power, energy: d.energy };
  });

  // Detect anomaly
  const hasAnomaly = latest ? (latest.anomaly === true || latest.anomaly === 1) : false;

  // Power trend
  const powerTrend = latest && prevRecord ? latest.power - prevRecord.power : 0;

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loading real-time data...</p>
        </div>
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} animationDelay={i}>
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Loading...
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Real-time power monitoring overview</p>
          </div>
          <div className="live-indicator">
            <span className="live-dot" />
            Live
          </div>
        </div>
      </div>

      {/* Top 4 metric cards */}
      <div className="dashboard-grid">
        <Card title="Current Power" icon="⚡" glow="green" animationDelay={1}>
          <div className="card-value accent">
            {latest ? latest.power.toFixed(0) : '—'}
            <span className="card-unit">W</span>
          </div>
          <div className="card-footer">
            {powerTrend >= 0 ? (
              <span className="card-trend-up">↑ +{Math.abs(powerTrend).toFixed(1)}W</span>
            ) : (
              <span className="card-trend-down">↓ {powerTrend.toFixed(1)}W</span>
            )}
            <span>from last reading</span>
          </div>
        </Card>

        <Card title="Voltage" icon="🔌" animationDelay={2}>
          <div className="card-value">
            {latest ? latest.voltage.toFixed(1) : '—'}
            <span className="card-unit">V</span>
          </div>
          <div className="card-footer">
            <StatusBadge
              status={latest && latest.voltage >= 210 ? 'normal' : 'warning'}
              label={latest && latest.voltage >= 210 ? 'Stable' : 'Low'}
            />
          </div>
        </Card>

        <Card title="Current" icon="🔄" animationDelay={3}>
          <div className="card-value">
            {latest ? latest.current.toFixed(2) : '—'}
            <span className="card-unit">A</span>
          </div>
          <div className="card-footer">
            <span style={{ color: 'var(--text-muted)' }}>RMS measured</span>
          </div>
        </Card>

        <Card title="Energy Today" icon="📊" animationDelay={4}>
          <div className="card-value">
            {energyToday.toFixed(2)}
            <span className="card-unit">kWh</span>
          </div>
          <div className="card-footer">
            <span style={{ color: 'var(--text-muted)' }}>Accumulated usage</span>
          </div>
        </Card>
      </div>

      {/* Power chart + ML status */}
      <div className="dashboard-grid-2">
        <Card title="Power Consumption" icon="📈" span={2} animationDelay={5}>
          <PowerChart
            data={chartData}
            color="#00ff88"
            gradientId="dashboardPower"
            unit="W"
          />
        </Card>
      </div>

      <div className="dashboard-grid-2">
        <Card title="ML Prediction" icon="🧠" glow="cyan" animationDelay={5}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Status</div>
              <StatusBadge
                status={hasAnomaly ? 'critical' : 'normal'}
                label={hasAnomaly ? 'Anomaly Detected' : 'Normal'}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Predicted Energy</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                {latest ? latest.predicted_energy.toFixed(1) : '—'}
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: 4 }}>W</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Confidence</div>
              <div style={{ 
                height: 6, 
                background: 'var(--border-primary)', 
                borderRadius: 3, 
                overflow: 'hidden',
                maxWidth: 200
              }}>
                <div style={{
                  height: '100%',
                  width: `${latest?.confidence ?? (hasAnomaly ? 35 : 100)}%`,
                  background: hasAnomaly ? 'var(--status-critical)' : 'var(--accent-green)',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {latest?.confidence ? latest.confidence.toFixed(1) : (hasAnomaly ? '35.0' : '100.0')}% confidence
              </div>
            </div>
          </div>
        </Card>

        {/* Alert card — only shows on anomaly */}
        {hasAnomaly ? (
          <Card title="Active Alert" icon="🚨" glow="red" className="alert-card" animationDelay={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatusBadge status="critical" label="Anomaly Detected" />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                Unusual power consumption pattern detected. Current reading of{' '}
                <strong style={{ color: 'var(--status-critical)' }}>{latest?.power.toFixed(1)}W</strong>{' '}
                exceeds normal thresholds.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Detected at {latest ? new Date(latest.timestamp).toLocaleTimeString() : '—'}
              </div>
            </div>
          </Card>
        ) : (
          <Card title="System Health" icon="✅" glow="green" animationDelay={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-heading)' }}>
                All Systems Normal
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No anomalies detected. Power consumption is within expected parameters.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
