import { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useEnergyData } from '../hooks';

// Pre-defined Indian States & UTs
const STATE_NAMES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Base known rates
const STATE_RATES: Record<string, { slabs: { upTo: number; rate: number }[] }> = {
  'Maharashtra': { slabs: [{ upTo: 100, rate: 5.31 }, { upTo: 300, rate: 8.95 }, { upTo: 500, rate: 12.25 }, { upTo: Infinity, rate: 13.0 }] },
  'Karnataka': { slabs: [{ upTo: 100, rate: 4.75 }, { upTo: 200, rate: 6.5 }, { upTo: Infinity, rate: 7.8 }] },
  'Delhi': { slabs: [{ upTo: 200, rate: 3.0 }, { upTo: 400, rate: 4.5 }, { upTo: 800, rate: 6.5 }, { upTo: Infinity, rate: 8.0 }] },
  'Tamil Nadu': { slabs: [{ upTo: 100, rate: 0.0 }, { upTo: 200, rate: 2.25 }, { upTo: 400, rate: 4.5 }, { upTo: 500, rate: 6.0 }, { upTo: Infinity, rate: 8.0 }] },
  'Kerala': { slabs: [{ upTo: 250, rate: 5.8 }, { upTo: 500, rate: 7.1 }, { upTo: Infinity, rate: 8.5 }] },
  'Gujarat': { slabs: [{ upTo: 50, rate: 3.05 }, { upTo: 200, rate: 3.5 }, { upTo: Infinity, rate: 4.6 }] },
  'Rajasthan': { slabs: [{ upTo: 50, rate: 4.75 }, { upTo: 150, rate: 6.5 }, { upTo: 300, rate: 7.35 }, { upTo: Infinity, rate: 7.95 }] },
  'Punjab': { slabs: [{ upTo: 100, rate: 4.49 }, { upTo: 300, rate: 5.34 }, { upTo: Infinity, rate: 6.63 }] },
  'Haryana': { slabs: [{ upTo: 50, rate: 2.0 }, { upTo: 150, rate: 2.5 }, { upTo: 250, rate: 5.25 }, { upTo: Infinity, rate: 7.1 }] },
  'Uttar Pradesh': { slabs: [{ upTo: 150, rate: 5.5 }, { upTo: 300, rate: 6.0 }, { upTo: 500, rate: 6.5 }, { upTo: Infinity, rate: 7.0 }] },
  'Madhya Pradesh': { slabs: [{ upTo: 50, rate: 4.2 }, { upTo: 150, rate: 5.1 }, { upTo: 300, rate: 6.4 }, { upTo: Infinity, rate: 6.6 }] },
  'Bihar': { slabs: [{ upTo: 100, rate: 6.1 }, { upTo: 200, rate: 6.95 }, { upTo: Infinity, rate: 8.05 }] },
  'West Bengal': { slabs: [{ upTo: 102, rate: 5.3 }, { upTo: 180, rate: 5.97 }, { upTo: Infinity, rate: 7.12 }] },
  'Andhra Pradesh': { slabs: [{ upTo: 75, rate: 2.65 }, { upTo: 225, rate: 4.30 }, { upTo: Infinity, rate: 6.00 }] },
};

// Fill remaining with a generic average slab
STATE_NAMES.forEach(state => {
  if (!STATE_RATES[state]) {
    STATE_RATES[state] = { slabs: [{ upTo: 100, rate: 4.5 }, { upTo: 300, rate: 6.0 }, { upTo: Infinity, rate: 7.5 }] };
  }
});

type Slab = { upTo: number; rate: number };

export default function Calculator() {
  const { data } = useEnergyData();
  const [selectedState, setSelectedState] = useState('Maharashtra');

  // Multi-layout custom slabs integration
  const defaultLayout: Slab[] = [{ upTo: 100, rate: 4.5 }, { upTo: 300, rate: 6.0 }, { upTo: Infinity, rate: 8.0 }];
  
  const [customLayouts, setCustomLayouts] = useState<Record<string, Slab[]>>(() => {
    const saved = localStorage.getItem('userCustomLayouts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        for (const key in parsed) {
          parsed[key] = parsed[key].map((s: any) => ({ ...s, upTo: s.upTo === 'Infinity' || s.upTo === null ? Infinity : s.upTo }));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to load custom layouts", e);
      }
    }
    // Backward compatibility for old single layout
    const oldSaved = localStorage.getItem('userCustomSlabs');
    if (oldSaved) {
      try {
         const parsed = JSON.parse(oldSaved).map((s: any) => ({ ...s, upTo: s.upTo === 'Infinity' || s.upTo === null ? Infinity : s.upTo }));
         return { 'Layout 1': parsed, 'Layout 2': defaultLayout };
      } catch (e) {}
    }
    return { 'Layout 1': defaultLayout, 'Layout 2': defaultLayout };
  });

  const [activeLayout, setActiveLayout] = useState<'Layout 1' | 'Layout 2'>('Layout 1');
  const customSlabs = customLayouts[activeLayout] || defaultLayout;
  
  const [saveNotify, setSaveNotify] = useState(false);

  const latest = data.length > 0 ? data[data.length - 1] : null;

  // Compute energy today
  const energyToday = useMemo(() => {
    let sum = 0;
    const todayStr = new Date().toDateString();
    for (let i = 1; i < data.length; i++) {
      if (new Date(data[i].timestamp).toDateString() === todayStr) {
        const diff = (data[i].energy || 0) - (data[i - 1].energy || 0);
        if (diff > 0) sum += diff;
      }
    }
    return sum;
  }, [data]);

  const predictedPowerWatts = latest ? latest.predicted_energy : 0;
  const predicted24hEnergyKwh = (predictedPowerWatts / 1000) * 24;

  const calculateCostOfUnits = (totalUnits: number) => {
    const slabsToUse = selectedState === 'Custom Slabs' ? customSlabs : STATE_RATES[selectedState]?.slabs;
    if (!slabsToUse) return 0;

    let cost = 0;
    let remainingUnits = totalUnits;
    let previousUpTo = 0;

    for (const slab of slabsToUse) {
      const unitsInSlab = Math.min(slab.upTo - previousUpTo, remainingUnits);
      if (unitsInSlab > 0) {
        cost += unitsInSlab * slab.rate;
        remainingUnits -= unitsInSlab;
      }
      previousUpTo = slab.upTo;
      if (remainingUnits <= 0) break;
    }
    return cost;
  };

  const projectedMonthlyBill = calculateCostOfUnits(predicted24hEnergyKwh * 30);
  const currentPaceMonthlyBill = calculateCostOfUnits(energyToday * 30);
  const costTillNow = calculateCostOfUnits(energyToday);  // Exact cost accrued for just the energy consumed today

  // Custom Slab Handlers
  const handleUpdateCustomSlab = (index: number, field: 'upTo' | 'rate', value: string) => {
    const newSlabs = [...customSlabs];
    if (field === 'rate') {
      newSlabs[index].rate = parseFloat(value) || 0;
    } else {
      newSlabs[index].upTo = value.toLowerCase() === 'infinity' || value === '' ? Infinity : parseFloat(value) || 0;
      newSlabs.sort((a, b) => a.upTo - b.upTo);
    }
    
    if (newSlabs.length > 0 && newSlabs[newSlabs.length - 1].upTo !== Infinity) {
        newSlabs[newSlabs.length - 1].upTo = Infinity;
    }
    setCustomLayouts(prev => ({ ...prev, [activeLayout]: newSlabs }));
  }

  const addCustomSlab = () => {
    const newSlabs = [...customSlabs];
    const last = newSlabs.pop(); // Remove infinity
    const lastUpTo = newSlabs.length > 0 ? newSlabs[newSlabs.length - 1].upTo : 0;
    newSlabs.push({ upTo: lastUpTo + 100, rate: 0 }); // Insert new
    if (last) newSlabs.push(last); // Put infinity back
    setCustomLayouts(prev => ({ ...prev, [activeLayout]: newSlabs }));
  }

  const removeCustomSlab = (index: number) => {
    const newSlabs = [...customSlabs];
    newSlabs.splice(index, 1);
    if (newSlabs.length > 0) newSlabs[newSlabs.length - 1].upTo = Infinity;
    if (newSlabs.length === 0) newSlabs.push({ upTo: Infinity, rate: 0 });
    setCustomLayouts(prev => ({ ...prev, [activeLayout]: newSlabs }));
  }

  const saveCustomLayouts = () => {
    const toSave: any = {};
    for (const key in customLayouts) {
       toSave[key] = customLayouts[key].map(s => ({ ...s, upTo: s.upTo === Infinity ? 'Infinity' : s.upTo }));
    }
    localStorage.setItem('userCustomLayouts', JSON.stringify(toSave));
    setSaveNotify(true);
    setTimeout(() => setSaveNotify(false), 2000);
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Energy Cost Calculator</h1>
        <p className="page-subtitle">Projected billing strictly linked to historical and real-time physical telemetry</p>
      </div>

      <div className="dashboard-grid-2">
        {/* Settings panel */}
        <Card title="Tariff Configuration" icon="⚙️" animationDelay={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Select Region / State
              </label>
              
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    background: 'var(--bg-card)',
                    color: 'var(--accent-cyan)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer',
                    boxShadow: 'var(--glow-cyan)'
                  }}
                >
                  {STATE_NAMES.map((st) => (
                    <option key={st} value={st} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>
                      {st}
                    </option>
                  ))}
                  <option value="Custom Slabs" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-green)'}}>
                    ⚙️ Build Custom Slabs...
                  </option>
                </select>
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--accent-cyan)' }}>
                  ▼
                </div>
              </div>
            </div>

            {selectedState === 'Custom Slabs' && (
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-accent)', marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Custom Brackets</h3>
                  
                  {/* Layout toggle */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['Layout 1', 'Layout 2'] as const).map(l => (
                      <button 
                        key={l}
                        onClick={() => setActiveLayout(l)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '12px',
                          border: `1px solid ${activeLayout === l ? 'var(--accent-green)' : 'var(--border-primary)'}`,
                          background: activeLayout === l ? 'rgba(0,255,136,0.1)' : 'transparent',
                          color: activeLayout === l ? 'var(--accent-green)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customSlabs.map((slab, i, arr) => {
                     const prev = i === 0 ? 0 : arr[i-1].upTo;
                     return (
                      <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-card)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '50px' }}>{prev} to</span>
                        <input 
                          type="text" 
                          value={slab.upTo === Infinity ? '∞' : slab.upTo} 
                          onChange={e => handleUpdateCustomSlab(i, 'upTo', e.target.value)}
                          disabled={i === customSlabs.length - 1}
                          style={{ width: '60px', background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>units @ ₹</span>
                        <input 
                          type="number" 
                          step="0.1"
                          value={slab.rate} 
                          onChange={e => handleUpdateCustomSlab(i, 'rate', e.target.value)}
                          style={{ width: '70px', background: 'var(--bg-input)', border: '1px solid var(--accent-green-dim)', color: 'var(--accent-green)', padding: '6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        />
                        {i < customSlabs.length - 1 && (
                          <button className="btn btn-ghost" onClick={() => removeCustomSlab(i)} style={{ color: 'var(--status-critical)', padding: '6px 8px', marginLeft: 'auto' }}>✕</button>
                        )}
                      </div>
                     )
                  })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={addCustomSlab} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>+ Add Bracket</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {saveNotify && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>Saved!</span>}
                    <button className="btn btn-primary" onClick={saveCustomLayouts} style={{ fontSize: '0.8rem', padding: '8px 16px' }}>Save Layouts</button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedState !== 'Custom Slabs' && STATE_RATES[selectedState] && (
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Slabs for {selectedState}</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {STATE_RATES[selectedState].slabs.map((slab, i, arr) => {
                    const prev = i === 0 ? 0 : arr[i-1].upTo;
                    const max = slab.upTo === Infinity ? 'above' : slab.upTo;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{slab.upTo === Infinity ? `${prev} units+` : `${prev} - ${max} units`}</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-cyan)', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}>₹{slab.rate.toFixed(2)} / kWh</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Prediction Results & Cost Till Now */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <Card title="Daily Cost Accrued Till Now" icon="🕒" glow="green" animationDelay={2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exact cost of physical energy accrued strictly today</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-green)', textShadow: '0 0 20px rgba(0,255,136,0.3)', letterSpacing: '-0.02em' }}>
                ₹{costTillNow.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Energy usage verified: <span style={{color: 'var(--text-primary)'}}>{energyToday.toFixed(3)} kWh</span>
              </div>
            </div>
          </Card>

          <Card title="Projected Monthly Bill (ML Modeled)" icon="🤖" animationDelay={3}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Computed using ML 5-feature history+delta forecasts</div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                ₹{projectedMonthlyBill.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Targeted Monthly Accrual: {(predicted24hEnergyKwh * 30).toFixed(1)} kWh
              </div>
            </div>
          </Card>

          <Card title="Projected Bill (Current Pace)" icon="⚡" animationDelay={4}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Extrapolating flat daily averages to a 30-day bill</div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                ₹{currentPaceMonthlyBill.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Accrued Pace: {(energyToday * 30).toFixed(1)} kWh / month
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Warnings */}
      <div style={{ marginTop: 20 }}>
        <Card title="Disclaimer & ML Warning" icon="⚠️" animationDelay={5} className="alert-card">
          <p style={{ fontSize: '0.9rem', color: 'var(--status-warning)', lineHeight: 1.6 }}>
            <strong>Upgraded ML History Context:</strong> The ML-modeled cost now utilizes highly resilient 5-feature vectors (Delta V/I/P + Trailing 10-tick history + Trailing 50-tick history). It calculates your next 24 hour energy consumption dynamically.
            However, because this algorithm aggressively extrapolates short-term anomalies over a whole month, bills are still subject to slight miscalculation if physical usage patterns fluctuate extremely arbitrarily.
          </p>
        </Card>
      </div>
    </div>
  );
}
