import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { useEnergyData } from '../hooks';

export default function Alerts() {
  const { data, loading } = useEnergyData();

  // Filter anomalies
  const anomalies = data.filter((d) => d.anomaly === true || d.anomaly === 1);

  // Assign severity
  const getSeverity = (power: number, voltage: number): 'warning' | 'critical' | 'normal' => {
    if (power > 2000 || voltage < 200) return 'critical';
    if (power > 1000 || voltage < 210) return 'warning';
    return 'normal';
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Alerts</h1>
            <p className="page-subtitle">Anomaly detection log</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge
              status={anomalies.length > 0 ? 'warning' : 'normal'}
              label={`${anomalies.length} anomal${anomalies.length === 1 ? 'y' : 'ies'}`}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading alerts...
          </div>
        </Card>
      ) : anomalies.length === 0 ? (
        <Card animationDelay={1}>
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">No Anomalies Detected</div>
            <div className="empty-state-desc">
              All readings are within normal parameters. The system is monitoring continuously.
            </div>
          </div>
        </Card>
      ) : (
        <Card animationDelay={1}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Power</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {anomalies
                  .slice()
                  .reverse()
                  .map((record, i) => {
                    const severity = getSeverity(record.power, record.voltage);
                    return (
                      <tr key={i} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: severity === 'critical' ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                            {record.power.toFixed(1)} W
                          </span>
                        </td>
                        <td>{record.voltage.toFixed(1)} V</td>
                        <td>{record.current.toFixed(2)} A</td>
                        <td>
                          <StatusBadge status={severity} />
                        </td>
                        <td>
                          <StatusBadge
                            status="critical"
                            label="Anomaly"
                            showDot={false}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
