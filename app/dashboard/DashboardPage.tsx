import MetricGrid from '../../components/dashboard/MetricGrid';
import PieChart from '../../components/dashboard/PieChart';
import StatusSummaryTable from '../../components/dashboard/StatusSummaryTable';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useProveedores } from '../../src/providers/ProveedoresContext';
import { useTenant } from '../../src/tenant/TenantContext';
import type { DashboardResumen } from '../../types';

function DashboardPage() {
  const { proveedores } = useProveedores();
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [summary, setSummary] = useState<DashboardResumen | null>(null);
  useEffect(() => { if (!selectedProceso) { setSummary(null); return; } void api.dashboardReport(selectedProceso.id).then(setSummary).catch(() => setSummary(null)); }, [selectedProceso?.id]);
  const count = (estado: string) => proveedores.filter((item) => item.flujo?.subestado === estado).length;
  const metrics = [
    { label: 'Total proveedores', value: String(summary?.total ?? proveedores.length) },
    { label: 'Homologados vigentes', value: String(summary?.homologados ?? count('VIGENTE')) },
    { label: 'Inscritos', value: String(summary?.inscritos ?? proveedores.filter((item) => item.flujo?.estado === 'INSCRITO').length) },
    { label: 'Pendientes de inscripción', value: String(summary?.pendientes ?? proveedores.filter((item) => item.flujo?.estado === 'PENDIENTE_INSCRIPCION').length) },
    { label: 'Certificados por vencer', value: String(summary?.por_vencer ?? 0) },
  ];
  const slices = [
    { label: 'Homologados', value: summary?.homologados ?? count('VIGENTE'), color: '#86efac' },
    { label: 'Inscritos', value: summary?.inscritos ?? proveedores.filter((item) => item.flujo?.estado === 'INSCRITO').length, color: '#fde68a' },
    { label: 'Pendientes', value: summary?.pendientes ?? proveedores.filter((item) => item.flujo?.estado === 'PENDIENTE_INSCRIPCION').length, color: '#fca5a5' },
    { label: 'Vencidos', value: summary?.vencidos ?? count('VENCIDO'), color: '#f9a8d4' },
  ];
  const total = summary?.total ?? proveedores.length;
  const principalStatus = [
    { number: 1, label: 'Homologados', value: summary?.homologados ?? count('VIGENTE') },
    { number: 2, label: 'Inscritos', value: summary?.inscritos ?? proveedores.filter((item) => item.flujo?.estado === 'INSCRITO').length },
    { number: 3, label: 'Pendientes de inscripción', value: summary?.pendientes ?? proveedores.filter((item) => item.flujo?.estado === 'PENDIENTE_INSCRIPCION').length },
    { number: 4, label: 'No responden, no ubicados', value: summary?.sin_respuesta ?? (count('NO_RESPONDE') + count('NO_UBICADO') + count('NO_UBICADO_VISITA')) },
    { number: 5, label: 'No participan', value: summary?.no_participan ?? count('NO_PARTICIPA') },
    { number: 0, label: 'Total', value: total },
  ];
  const observationStatus = [
    { number: 6, label: 'Datos no corresponden', value: summary?.datos_incompletos ?? count('DATOS_INCOMPLETOS') },
    { number: 7, label: 'Desestimados', value: summary?.desestimados ?? (count('DESESTIMADO') + count('VISITA_DESESTIMADA')) },
    { number: 8, label: 'No son proveedores', value: summary?.no_son_proveedores ?? count('NO_ES_PROVEEDOR') },
  ];
  const certificateStatus = [
    { number: 9, label: 'Certificados vigentes', value: summary?.homologados ?? count('VIGENTE') },
    { number: 10, label: 'Certificados por vencer (45 días)', value: summary?.por_vencer ?? count('POR_VENCER') },
    { number: 11, label: 'Certificados vencidos', value: summary?.vencidos ?? count('VENCIDO') },
  ];

  return (
    <div className="container dashboard-page">
      <section className="dashboard-overview-row" aria-label="Resumen y estado de proveedores">
        <StatusSummaryTable total={total} principal={principalStatus} observations={observationStatus} certificates={certificateStatus} />
        <div className="dashboard-status-panel"><PieChart title="Estado de proveedores del proceso" slices={slices} large /></div>
      </section>
      <section className="card">
        <h2 className="page-title">Dashboard · {selectedEmpresa?.nombreComercial || 'Sin empresa'}</h2>
        <p className="secondary-text">{selectedProceso ? `${selectedProceso.codigo} — ${selectedProceso.nombre}` : 'No existe un proceso seleccionado.'}</p>
        <MetricGrid metrics={metrics} />
      </section>
    </div>
  );
}

export default DashboardPage;
