import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { CategoriaMiCartera, ResumenMiCartera } from '../../types';

const filters: Array<{ id: 'todas' | CategoriaMiCartera; label: string }> = [
  { id: 'todas', label: 'Toda mi cartera' },
  { id: 'nuevos', label: 'Nuevos asignados' },
  { id: 'gestion', label: 'En gestión' },
  { id: 'prioritarios', label: 'Requieren atención' },
];

function displayState(value: string) {
  const normalized = value.split('_').join(' ').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function displayDate(value: string | null) {
  if (!value) return 'No registrada';
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export default function MiCarteraPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [portfolio, setPortfolio] = useState<ResumenMiCartera | null>(null);
  const [filter, setFilter] = useState<'todas' | CategoriaMiCartera>('todas');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!selectedProceso) { setPortfolio(null); return () => { active = false; }; }
    setLoading(true); setMessage('');
    void api.myPortfolio(selectedProceso.id)
      .then((result) => { if (active) setPortfolio(result); })
      .catch((error) => { if (active) { setPortfolio(null); setMessage(error instanceof Error ? error.message : 'No se pudo cargar tu cartera.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedProceso?.id]);

  const visibleProviders = useMemo(() => portfolio?.providers.filter((provider) => filter === 'todas' || provider.categoria === filter) || [], [portfolio, filter]);
  const summary = portfolio?.summary;

  return <main className="container my-portfolio-page">
    <section className="card my-portfolio-hero">
      <div>
        <p className="eyebrow">Gestión diaria</p>
        <h2 className="page-title">Mi cartera</h2>
        <p className="context-label">{selectedEmpresa?.razonSocial || 'Sin empresa'} · {selectedProceso?.codigo || 'Sin proceso'}</p>
        <p className="secondary-text">Organiza tus proveedores según la fecha de asignación, el avance del proceso y las alertas de vencimiento.</p>
      </div>
      <div className="my-portfolio-total"><span>Proveedores asignados</span><strong>{summary?.total ?? '—'}</strong></div>
    </section>

    {message ? <p className="error-message" role="alert">{message}</p> : null}

    <section className="my-portfolio-summary" aria-label="Resumen de mi cartera">
      <article className="my-portfolio-summary-card is-new"><span>Nuevos asignados</span><strong>{summary?.newWeek ?? '—'}</strong><small>{summary?.newToday ? `${summary.newToday} recibido${summary.newToday === 1 ? '' : 's'} hoy` : 'Últimos 7 días'}</small></article>
      <article className="my-portfolio-summary-card is-management"><span>En gestión</span><strong>{summary?.inProgress ?? '—'}</strong><small>Sin alertas activas</small></article>
      <article className="my-portfolio-summary-card is-priority"><span>Requieren atención</span><strong>{summary?.priority ?? '—'}</strong><small>Vencimientos o situaciones pendientes</small></article>
    </section>

    <section className="card my-portfolio-list">
      <div className="section-heading my-portfolio-list-heading"><div><h3>Proveedores a mi cargo</h3><p className="secondary-text">Los proveedores con alertas se muestran como prioridad aunque su asignación sea reciente.</p></div><button type="button" className="btn-secondary" disabled={loading} onClick={() => { if (selectedProceso) { setLoading(true); void api.myPortfolio(selectedProceso.id).then(setPortfolio).catch((error) => setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la cartera.')).finally(() => setLoading(false)); } }}>Actualizar</button></div>
      <div className="my-portfolio-filters" role="group" aria-label="Filtrar mi cartera">{filters.map((item) => <button key={item.id} type="button" className={filter === item.id ? 'is-active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <div className="table-wrapper"><table className="portfolio-table my-portfolio-table"><thead><tr><th>Proveedor</th><th>Asignado</th><th>Avance</th><th>Situación</th><th>Vencimiento</th></tr></thead><tbody>{visibleProviders.map((provider) => <tr key={provider.id}><td><strong>{provider.razonSocial}</strong><small>RUC {provider.ruc}</small></td><td>{displayDate(provider.fechaAsignacion)}</td><td><span className="step-pill">Paso {provider.paso}</span><small>{displayState(provider.subestado)}</small></td><td>{provider.alerta ? <span className="priority-pill">{provider.alerta}</span> : <span className="status-pill">En gestión</span>}</td><td>{displayDate(provider.fechaVencimiento)}</td></tr>)}</tbody></table>{!loading && !visibleProviders.length ? <p className="empty-status">{filter === 'todas' ? 'No tienes proveedores asignados en este proceso.' : 'No hay proveedores en esta categoría.'}</p> : null}{loading ? <p className="empty-status" role="status">Actualizando tu cartera…</p> : null}</div>
    </section>
  </main>;
}
