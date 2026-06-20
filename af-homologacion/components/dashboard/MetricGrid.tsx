import { DashboardMetric } from '../../types';
import Card from '../shared/Card';

interface Props {
  metrics: DashboardMetric[];
}

function MetricGrid({ metrics }: Props) {
  return (
    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <div style={{ padding: '1.25rem' }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontWeight: 600 }}>{metric.label}</p>
            <p style={{ margin: '0.75rem 0 0', fontSize: '2rem', fontWeight: 700 }}>{metric.value}</p>
            {metric.description && <p style={{ margin: '0.75rem 0 0', color: 'var(--color-text-muted)' }}>{metric.description}</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default MetricGrid;
