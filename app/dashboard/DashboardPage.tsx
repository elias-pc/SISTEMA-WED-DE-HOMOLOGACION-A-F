import MetricGrid from '../../components/dashboard/MetricGrid';
import PieChart from '../../components/dashboard/PieChart';
import { useProveedores } from '../../src/providers/ProveedoresContext';
import { useTenant } from '../../src/tenant/TenantContext';

function DashboardPage() {
  const { proveedores } = useProveedores();
  const { selectedEmpresa, selectedProceso } = useTenant();
  const count = (estado: string) => proveedores.filter((item) => item.estado === estado).length;
  const metrics = [
    { label: 'Total proveedores', value: String(proveedores.length) },
    { label: 'Homologados', value: String(count('Homologado')) },
    { label: 'En proceso', value: String(count('En proceso')) },
    { label: 'Observados', value: String(count('Observado')) },
    { label: 'Vencidos', value: String(count('Vencido')) },
  ];
  const slices = [
    { label: 'Homologados', value: count('Homologado'), color: '#86efac' },
    { label: 'En proceso', value: count('En proceso'), color: '#fde68a' },
    { label: 'Observados', value: count('Observado'), color: '#fca5a5' },
    { label: 'Vencidos', value: count('Vencido'), color: '#f9a8d4' },
  ];

  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Dashboard · {selectedEmpresa?.nombreComercial || 'Sin empresa'}</h2>
        <p className="secondary-text">{selectedProceso ? `${selectedProceso.codigo} — ${selectedProceso.nombre}` : 'No existe un proceso seleccionado.'}</p>
        <MetricGrid metrics={metrics} />
        <div style={{ maxWidth: 520, marginTop: '1.5rem' }}><PieChart title="Estado de proveedores del proceso" slices={slices} /></div>
      </section>
    </div>
  );
}

export default DashboardPage;
