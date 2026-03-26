import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ChartDataPoint {
  time: string;
  value: number;
  [key: string]: string | number;
}

interface PowerChartProps {
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
  gradientId?: string;
  height?: number;
  showGrid?: boolean;
  referenceLine?: number;
  referenceLabel?: string;
  unit?: string;
}

export default function PowerChart({
  data,
  dataKey = 'value',
  color = '#00ff88',
  gradientId = 'powerGradient',
  height,
  showGrid = true,
  referenceLine,
  referenceLabel,
  unit = 'W',
}: PowerChartProps) {
  // Show dots when very few data points (line chart needs 2+ points to draw)
  const showDots = data.length <= 3;
  return (
    <div className={height && height > 350 ? 'chart-container-lg' : 'chart-container'} style={height ? { height } : undefined}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="50%" stopColor={color} stopOpacity={0.1} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="time"
            stroke="#52525b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#52525b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-4}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1d',
              border: '1px solid #27272a',
              borderRadius: '12px',
              fontSize: '0.8rem',
              color: '#e4e4e7',
              boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
              padding: '10px 14px',
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const point = payload[0].payload;
              return (
                <div style={{
                  background: '#1a1a1d',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: '#e4e4e7',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                  padding: '10px 14px',
                }}>
                  <div style={{ color: '#71717a', marginBottom: 6, fontSize: '0.75rem' }}>{label}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><span style={{ color }}>● </span>{Number(point.value).toFixed(1)} {unit}</div>
                    {point.energy !== undefined && (
                      <div><span style={{ color: '#00d4ff' }}>● </span>{Number(point.energy).toFixed(3)} kWh</div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          {referenceLine !== undefined && (
            <ReferenceLine
              y={referenceLine}
              stroke="#ff4757"
              strokeDasharray="6 4"
              label={{
                value: referenceLabel || `${referenceLine}`,
                position: 'right',
                fill: '#ff4757',
                fontSize: 11,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={showDots ? { r: 5, fill: color, stroke: '#0f0f0f', strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: color, stroke: '#0f0f0f', strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
