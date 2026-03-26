import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [unitId, setUnitId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (unitId === 'TE0001' && password === 'TE0001XAEw') {
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('unitId', unitId);
      navigate('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-base)'
    }}>
      <div className="card" style={{
        width: 400,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: 'fade-in 0.6s ease-out'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚡</div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>EnergyPulse</h1>
          <p className="page-subtitle">Machine Unit Authentication</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Unit ID</label>
            <input
              type="text"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              placeholder="Enter Unit Name"
              style={{
                background: 'var(--bg-panel)',
                border: `1px solid ${error ? 'var(--status-critical)' : 'var(--border-primary)'}`,
                color: 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Unit Password"
              style={{
                background: 'var(--bg-panel)',
                border: `1px solid ${error ? 'var(--status-critical)' : 'var(--border-primary)'}`,
                color: 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--status-critical)', fontSize: '0.875rem', textAlign: 'center' }}>
              Invalid Unit ID or Password
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: '1rem', fontWeight: 600 }}
          >
            Authenticate Unit
          </button>
        </form>
      </div>
    </div>
  );
}
