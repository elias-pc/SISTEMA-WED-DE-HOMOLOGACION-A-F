interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  slices: PieSlice[];
  large?: boolean;
  centerValue?: number;
  centerLabel?: string;
}

function PieChart({ title, slices, large = false, centerValue, centerLabel }: Props) {
  const radius = 80;
  const center = 100;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let startAngle = 0;

  const pathData = slices.map((slice) => {
    const angle = total ? (slice.value / total) * 2 * Math.PI : 0;
    const endAngle = startAngle + angle;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    startAngle = endAngle;
    return {
      path: total && slice.value && angle < 2 * Math.PI - Number.EPSILON ? path : '',
      fullCircle: total && slice.value && angle >= 2 * Math.PI - Number.EPSILON,
      color: slice.color,
      label: slice.label,
      value: slice.value,
    };
  });

  return (
    <div className={`card pie-chart-card${large ? ' pie-chart-card-large' : ''}`}>
      <h3>{title}</h3>
      <div className="pie-chart-layout">
        <svg className="pie-chart-svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${title}${centerValue === undefined ? '' : `: ${centerValue} ${centerLabel || 'proveedores'}`}`}>
          {pathData.map((slice) => (
            slice.fullCircle
              ? <circle key={slice.label} cx={center} cy={center} r={radius} fill={slice.color} />
              : slice.path ? <path key={slice.label} d={slice.path} fill={slice.color} /> : null
          ))}
          {centerValue !== undefined ? <>
            <circle className="pie-chart-hole" cx={center} cy={center} r="48" />
            <text className="pie-chart-total" x={center} y="96" textAnchor="middle">{centerValue}</text>
            <text className="pie-chart-total-label" x={center} y="116" textAnchor="middle">{centerLabel || 'Total'}</text>
          </> : null}
        </svg>
        <div className="pie-chart-legend">
          {pathData.map((slice) => (
            <div key={slice.label}>
              <span className="pie-chart-swatch" style={{ background: slice.color }} />
              <span>
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
