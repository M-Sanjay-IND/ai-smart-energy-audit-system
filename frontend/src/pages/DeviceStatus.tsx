import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { useDeviceStatus, useEnergyData } from '../hooks';

export default function DeviceStatus() {
  const { status } = useDeviceStatus(10000);
  const { data } = useEnergyData();

  // Determine ESP32 online status based on last data timestamp freshness
  const lastRecord = data.length > 0 ? data[data.length - 1] : null;
  const lastTimestamp = lastRecord ? new Date(lastRecord.timestamp) : null;
  const now = new Date();
  const isEspOnline = lastTimestamp ? (now.getTime() - lastTimestamp.getTime()) < 120000 : false; // within 2 min

  const isBackendOnline = status?.backend === 'online';

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Device Status</h1>
        <p className="page-subtitle">Monitor connected devices and system components</p>
      </div>

      <div className="dashboard-grid-2">
        {/* ESP32 */}
        <Card title="ESP32 Sensor Node" icon="📡" glow={isEspOnline ? 'green' : 'red'} animationDelay={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Status</span>
              <StatusBadge status={isEspOnline ? 'online' : 'offline'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Last Data</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {lastTimestamp ? lastTimestamp.toLocaleString() : 'No data'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Readings</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.length} records</span>
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}>
              Board: ESP32 Devkit V1<br />
              Voltage: ZMPT101B Module<br />
              Current: SCT-013 (100A:50mA)
            </div>
          </div>
        </Card>

        {/* Raspberry Pi */}
        <Card title="Raspberry Pi Gateway" icon="🖥️" glow={isBackendOnline ? 'green' : 'red'} animationDelay={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Status</span>
              <StatusBadge status={isBackendOnline ? 'online' : 'offline'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Backend</span>
              <StatusBadge
                status={isBackendOnline ? 'online' : 'offline'}
                label={isBackendOnline ? 'Flask Running' : 'Offline'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>ML Model</span>
              <StatusBadge
                status={status?.ml_model === 'loaded' ? 'online' : 'warning'}
                label={status?.ml_model === 'loaded' ? 'Loaded' : 'Not Loaded'}
              />
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}>
              Model: Raspberry Pi Zero 2 W<br />
              OS: Raspberry Pi OS 32bit (Latest)<br />
              Python: 3.9+
            </div>
          </div>
        </Card>


      </div>

      {/* System Event Timeline */}
      <Card title="System Activity Log" icon="⏱️" animationDelay={2}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { 
              tag: 'APP', 
              time: now.toLocaleString(), 
              event: 'Dashboard heartbeat ping', 
              status: 'online' as const 
            },
            { 
              tag: 'ESP', 
              time: lastTimestamp ? lastTimestamp.toLocaleString() : '--:--', 
              event: lastTimestamp ? 'Received ESP32 packet' : 'Awaiting ESP32 connection', 
              status: isEspOnline ? 'online' as const : (lastTimestamp ? 'warning' as const : 'offline' as const) 
            },
            { 
              tag: 'API', 
              time: isBackendOnline ? now.toLocaleString() : '--:--', 
              event: isBackendOnline ? 'Backend server running' : 'Backend connection failed', 
              status: isBackendOnline ? 'online' as const : 'offline' as const 
            },
            { 
              tag: 'ML', 
              time: status?.ml_model === 'loaded' ? now.toLocaleString() : '--:--', 
              event: status?.ml_model === 'loaded' ? 'AI models online' : 'AI models offline', 
              status: status?.ml_model === 'loaded' ? 'online' as const : 'warning' as const 
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
                borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{
                width: 80,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                lineHeight: 1.1
              }}>
                {item.time === '--:--' ? (
                  <span>--:--</span>
                ) : (
                  <>
                    <span>{item.time.split(',')[0]}</span>
                    <span>{item.time.split(',')[1]?.trim()}</span>
                  </>
                )}
              </div>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.status === 'online' ? 'var(--status-online)' : item.status === 'warning' ? 'var(--status-warning)' : 'var(--status-offline)',
                flexShrink: 0,
                boxShadow: `0 0 8px ${item.status === 'online' ? 'var(--status-online)' : item.status === 'warning' ? 'var(--status-warning)' : 'var(--status-offline)'}80`,
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.event}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>[{item.tag}]</span>
              </div>
              <div style={{ flex: 1 }} />
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
