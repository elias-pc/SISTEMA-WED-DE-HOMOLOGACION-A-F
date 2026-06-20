import MetricGrid from '../../components/dashboard/MetricGrid';
import LineChart from '../../components/dashboard/LineChart';
import PieChart from '../../components/dashboard/PieChart';
import { dashboardMetrics, lineaHomologaciones, donutEstados } from '../../services/mockData';

function DashboardPage() {
  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Dashboard Ejecutivo</h2>
        <p className="secondary-text">Resumen de estado de proveedores y homologaciones.</p>
        <MetricGrid metrics={dashboardMetrics} />

        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem', gridTemplateColumns: '1.6fr 1fr' }}>
          <LineChart title="Homologaciones mensuales" data={lineaHomologaciones} />
          <div style={{ display: 'grid', gap: '1rem' }}>
            <PieChart title="Estado de proveedores" slices={donutEstados} />
            <PieChart
              title="Certificados próximos a vencer"
              slices={[
                { label: 'Próximos 30 días', value: 18, color: '#fde68a' },
                { label: 'Próximos 60 días', value: 8, color: '#fcd34d' },
                { label: 'Más de 60 días', value: 5, color: '#f59e0b' },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
