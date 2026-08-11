import { useMemo, useState } from 'react';
import { useProveedores } from '../../src/providers/ProveedoresContext';
import { useTenant } from '../../src/tenant/TenantContext';
import { avanceProveedor, estadoSeguimientoActual } from '../../services/providerWorkflow';

type Periodo = 'semanas' | 'meses';

const historico = {
  semanas: [
    { label: 'Hace 4 sem.', value: 42 },
    { label: 'Hace 3 sem.', value: 49 },
    { label: 'Hace 2 sem.', value: 55 },
    { label: 'Semana ant.', value: 61 },
    { label: 'Esta semana', value: 68 },
  ],
  meses: [
    { label: 'Abr', value: 34 },
    { label: 'May', value: 43 },
    { label: 'Jun', value: 52 },
    { label: 'Jul', value: 59 },
    { label: 'Ago', value: 68 },
  ],
};

function HomologacionesPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();
  const { proveedores } = useProveedores();
  const [periodo, setPeriodo] = useState<Periodo>('semanas');

  const resumen = useMemo(() => {
    const total = proveedores.length;
    const homologados = proveedores.filter((item) => item.estadoSupervisor === 'Visita realizada').length;
    const enProceso = proveedores.filter((item) => !item.estadoSupervisor || !['Visita realizada', 'Desestimado'].includes(item.estadoSupervisor)).length;
    const observados = proveedores.filter((item) => ['No encontrado', 'No se ubica', 'Visita no realizada', 'Desestimado'].includes(estadoSeguimientoActual(item))).length;
    const avance = total
      ? Math.round(proveedores.reduce((sum, item) => sum + avanceProveedor(item), 0) / total)
      : 0;
    return { total, homologados, enProceso, observados, avance };
  }, [proveedores]);

  const tendencia = historico[periodo];
  const anterior = tendencia[tendencia.length - 2]?.value ?? 0;
  const actual = resumen.total ? resumen.avance : tendencia[tendencia.length - 1]?.value ?? 0;
  const variacion = actual - anterior;

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
          <p className="secondary-text">Compara el avance actual con periodos anteriores e identifica proveedores que requieren atención.</p>
        </div>
        <div className="period-switch" aria-label="Periodo de comparación">
          <button type="button" className={periodo === 'semanas' ? 'active' : ''} onClick={() => setPeriodo('semanas')}>Semanas</button>
          <button type="button" className={periodo === 'meses' ? 'active' : ''} onClick={() => setPeriodo('meses')}>Meses</button>
        </div>
      </section>

      <section className="status-metrics" aria-label="Resumen del estatus">
        <article className="card status-metric"><span>Avance general</span><strong>{resumen.avance}%</strong><small className={variacion >= 0 ? 'positive' : 'negative'}>{variacion >= 0 ? '↑' : '↓'} {Math.abs(variacion)} puntos vs. periodo anterior</small></article>
        <article className="card status-metric"><span>Total proveedores</span><strong>{resumen.total}</strong><small>En el proceso seleccionado</small></article>
        <article className="card status-metric"><span>Homologados</span><strong>{resumen.homologados}</strong><small>{resumen.total ? Math.round((resumen.homologados / resumen.total) * 100) : 0}% del total</small></article>
        <article className="card status-metric"><span>Requieren atención</span><strong>{resumen.observados}</strong><small>{resumen.enProceso} continúan en proceso</small></article>
      </section>

      <section className="card status-chart-card">
        <div className="section-heading">
          <div><h3>Evolución del avance</h3><p className="secondary-text">Comparación por {periodo}</p></div>
          <span className="trend-badge">{variacion >= 0 ? '+' : ''}{variacion} pp</span>
        </div>
        <div className="status-chart" role="img" aria-label={`Avance de homologación comparado por ${periodo}`}>
          {tendencia.map((item, index) => {
            const value = index === tendencia.length - 1 ? actual : item.value;
            return <div className="chart-column" key={item.label}><span>{value}%</span><div className="chart-track"><i style={{ height: `${value}%` }} /></div><small>{item.label}</small></div>;
          })}
        </div>
      </section>

      <section className="card provider-progress-card">
        <div className="section-heading"><div><h3>Avance por proveedor</h3><p className="secondary-text">Detalle del estado actual dentro del proceso</p></div><span className="readonly-badge">{selectedProceso.estado}</span></div>
        {proveedores.length ? (
          <div className="provider-progress-list">
            {proveedores.map((proveedor) => {
              const avance = avanceProveedor(proveedor);
              const estadoActual = estadoSeguimientoActual(proveedor);
              return <article className="provider-progress-row" key={proveedor.id}>
                <div><strong>{proveedor.razonSocial}</strong><small>RUC {proveedor.ruc}</small></div>
                <div className="progress-summary"><span>{estadoActual}</span><strong>{avance}%</strong></div>
                <div className="progress-track" aria-label={`${proveedor.razonSocial}: ${avance}%`}><i style={{ width: `${avance}%` }} /></div>
              </article>;
            })}
          </div>
        ) : <p className="empty-status">Todavía no hay proveedores registrados en este proceso.</p>}
      </section>
    </div>
  );
}

export default HomologacionesPage;
