import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDeviceStatus, useEnergyData } from '../hooks';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⚡', section: 'Overview' },
  { path: '/analytics', label: 'Analytics', icon: '📊', section: 'Overview' },
  { path: '/devices', label: 'Devices', icon: '🔌', section: 'Monitoring' },
  { path: '/alerts', label: 'Alerts', icon: '🚨', section: 'Monitoring' },
  { path: '/settings', label: 'Settings', icon: '⚙️', section: 'System' },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Compute live system health across all 4 criteria
  const { status } = useDeviceStatus(10000);
  const { data } = useEnergyData();
  
  const lastRecord = data.length > 0 ? data[data.length - 1] : null;
  const lastTimestamp = lastRecord ? new Date(lastRecord.timestamp) : null;
  const now = new Date();
  
  const isEspOnline = lastTimestamp ? (now.getTime() - lastTimestamp.getTime()) < 120000 : false;
  const isBackendOnline = status?.backend === 'online';
  const isMlOnline = status?.ml_model === 'loaded';
  // 4th criteria is the dashboard itself, which is always online if this code runs
  
  const isSystemOnline = isEspOnline && isBackendOnline && isMlOnline;

  const unitName = sessionStorage.getItem('unitId') || 'EnergyPulse';

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('unitId');
    navigate('/login');
  };

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{unitName}</div>
            <div className="sidebar-subtitle">Monitoring Dashboard</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="sidebar-section-label">{section}</div>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" style={{ 
              background: isSystemOnline ? 'var(--status-online)' : 'var(--status-critical)',
              boxShadow: `0 0 8px ${isSystemOnline ? 'var(--status-online)' : 'var(--status-critical)'}`
            }} />
            <span style={{ 
              color: isSystemOnline ? 'var(--accent-green)' : 'var(--status-critical)', 
              fontSize: '0.7rem', 
              fontWeight: 500 
            }}>
              {isSystemOnline ? 'System Active' : 'System Degraded'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)} · v1.0
            </div>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                fontSize: '0.75rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Logout"
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
