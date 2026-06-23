interface LinePoint {
  label: string;
  value: number;
}

interface Props {
  title: string;
  data: LinePoint[];
}

function LineChart({ title, data }: Props) {
  const width = 560;
  const height = 240;
  const padding = 32;
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);
  const points = data
    .map((entry, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - (entry.value / maxValue) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      <svg width={width} height={height} style={{ width: '100%', marginTop: '1rem' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <path d={`M ${points}`} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
        {data.map((entry, index) => {
          const x = padding + (index * (width - padding * 2)) / (data.length - 1);
          const y = height - padding - (entry.value / maxValue) * (height - padding * 2);
          return (
            <g key={entry.label}>
              <circle cx={x} cy={y} r="6" fill="var(--color-primary)" />
              <text x={x} y={y - 12} textAnchor="middle" fill="var(--color-text)" fontSize="0.8rem">
                {entry.value}
              </text>
            </g>
          );
        })}
        {data.map((entry, index) => {
          const x = padding + (index * (width - padding * 2)) / (data.length - 1);
          return (
            <text key={entry.label} x={x} y={height - padding + 20} textAnchor="middle" fill="var(--color-text-muted)" fontSize="0.75rem">
              {entry.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default LineChart;
