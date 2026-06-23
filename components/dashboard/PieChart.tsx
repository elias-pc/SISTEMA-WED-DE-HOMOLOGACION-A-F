interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  slices: PieSlice[];
}

function PieChart({ title, slices }: Props) {
  const radius = 80;
  const center = 100;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let startAngle = 0;

  const pathData = slices.map((slice) => {
    const angle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    startAngle = endAngle;
    return { path, color: slice.color, label: slice.label, value: slice.value };
  });

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {pathData.map((slice, index) => (
            <path key={index} d={slice.path} fill={slice.color} />
          ))}
        </svg>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {pathData.map((slice) => (
            <div key={slice.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '0.9rem', height: '0.9rem', borderRadius: '0.25rem', background: slice.color }} />
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text)' }}>
                {slice.label}: {slice.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PieChart;
