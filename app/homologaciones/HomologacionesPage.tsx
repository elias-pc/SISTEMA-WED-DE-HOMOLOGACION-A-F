import { useTenant } from '../../src/tenant/TenantContext';
import ProviderStatusTable from '../../components/homologaciones/ProviderStatusTable';

function HomologacionesPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();

  if (!selectedProceso) {
    return <div className="container"><section className="card"><h2 className="page-title">Sin proceso seleccionado</h2><p className="secondary-text">Selecciona un proceso para consultar el estatus de sus proveedores.</p></section></div>;
  }

  return (
    <div className="container status-page">
      <section className="card status-hero">
        <div>
          <p className="status-eyebrow">Seguimiento de homologación</p>
          <h2 className="page-title">Estatus de proveedores</h2>
          <p className="context-label">{selectedEmpresa?.razonSocial} · {selectedProceso.codigo}</p>
          <p className="secondary-text">Consulta, filtra columnas y descarga la información o los entregables del proceso seleccionado.</p>
        </div>
      </section>

      <ProviderStatusTable processId={selectedProceso.id} processCode={selectedProceso.codigo} />
    </div>
  );
}

export default HomologacionesPage;
