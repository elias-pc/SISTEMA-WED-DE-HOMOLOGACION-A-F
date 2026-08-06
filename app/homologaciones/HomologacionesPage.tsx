import { useTenant } from '../../src/tenant/TenantContext';

const etapas = ['Registro', 'Documentación', 'Validación', 'Observaciones', 'Evaluación', 'Aprobación', 'Certificación'];

function HomologacionesPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();
  if (!selectedProceso) return <div className="container"><section className="card"><h2 className="page-title">Sin proceso seleccionado</h2></section></div>;
  const completedThrough = selectedProceso.estado === 'Finalizado' ? 6 : selectedProceso.estado === 'En curso' ? 3 : selectedProceso.estado === 'Planificación' ? 0 : 2;
  return (
    <div className="container"><section className="card">
      <div className="section-heading"><div><h2 className="page-title">{selectedProceso.nombre}</h2><p className="context-label">{selectedEmpresa?.razonSocial} · {selectedProceso.codigo}</p></div><span className="readonly-badge">{selectedProceso.estado}</span></div>
      <p className="secondary-text">Inicio: {selectedProceso.fechaInicio} · Fecha límite: {selectedProceso.fechaLimite}</p>
      <div className="process-steps">{etapas.map((step, index) => <div key={step} className="process-step"><span className={index <= completedThrough ? 'done' : ''}>{index + 1}</span><div><strong>{step}</strong><p>{index <= completedThrough ? 'Completo' : 'Pendiente'}</p></div></div>)}</div>
    </section></div>
  );
}
export default HomologacionesPage;
