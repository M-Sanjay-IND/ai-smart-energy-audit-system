import { useState } from 'react';
import Card from '../components/Card';

export default function Settings() {
  const [saved, setSaved] = useState(false);

  // Load initial states from localStorage or defaults
  const [dataPoints, setDataPoints] = useState(localStorage.getItem('setting_dataPoints') || '50');

  const handleSave = () => {
    localStorage.setItem('setting_dataPoints', dataPoints);
    setSaved(true);

    // Reload the app momentarily to apply the hook intervals
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration</p>
      </div>

      {/* ML Configuration */}
      <Card title="ML Model Configuration" icon="🧠" glow="cyan" animationDelay={1}>
        <div className="settings-group">
          <div className="settings-row">
            <div>
              <div className="settings-label">Prediction Model</div>
              <div className="settings-description">Predicting future energy consumption</div>
            </div>
            <div className="settings-value" style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
              Random Forest
            </div>
          </div>

          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <div>
              <div className="settings-label">Anomaly Detection</div>
              <div className="settings-description">Detecting abnormal power patterns</div>
            </div>
            <div className="settings-value" style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
              Isolation Forest
            </div>
          </div>
        </div>
      </Card>

      <Card title="Dashboard Preferences" icon="⚙️" animationDelay={2}>
        <div className="settings-group">
          <div className="settings-row" style={{ borderBottom: 'none' }}>
            <div>
              <div className="settings-label">Chart Data Points Limit</div>
              <div className="settings-description">Number of historical records loaded into the UI</div>
            </div>
            <div>
              <select
                className="form-input"
                style={{ width: 140, cursor: 'pointer' }}
                value={dataPoints}
                onChange={(e) => setDataPoints(e.target.value)}
              >
                <option value="20">Latest 20</option>
                <option value="50">Last 50 (Default)</option>
                <option value="100">Last 100</option>
                <option value="500">Last 500 (Heavy)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Configuration'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', animation: 'fade-in 0.3s ease-out' }}>
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
