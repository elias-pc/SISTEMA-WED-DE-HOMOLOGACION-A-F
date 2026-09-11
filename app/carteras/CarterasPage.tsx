import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { ResumenCartera, ResultadoAsignacion } from '../../types';

function resultMessage(result: ResultadoAsignacion) {
  const parts = [
    result.assigned ? `${result.assigned} asignado(s)` : '',
    result.reassigned ? `${result.reassigned} reasignado(s)` : '',
    result.unassigned ? `${result.unassigned} retirado(s)` : '',
    result.unchanged ? `${result.unchanged} sin cambio` : '',
  ].filter(Boolean);
  return parts.join(', ') || 'Operación completada.';
}

export default function CarterasPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [portfolio, setPortfolio] = useState<ResumenCartera | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedExecutives, setSelectedExecutives] = useState<string[]>([]);
  const [targetExecutive, setTargetExecutive] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('Distribución operativa de cartera');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!selectedProceso) { setPortfolio(null); return; }
    setBusy(true);
    try {
      const next = await api.portfolio(selectedProceso.id);
      setPortfolio(next);
      setSelectedExecutives((current) => current.filter((id) => next.executives.some((item) => item.id === id)));
      setTargetExecutive((current) => next.executives.some((item) => item.id === current) ? current : next.executives[0]?.id || '');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cargar la cartera.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { setSelectedProviders([]); setMessage(''); void load(); }, [selectedProceso?.id]);
  const selectedCount = selectedProviders.length;
  const allSelected = Boolean(portfolio?.providers.length) && selectedCount === portfolio?.providers.length;
  const quantitiesTotal = useMemo(() => selectedExecutives.reduce((sum, id) => sum + (quantities[id] || 0), 0), [selectedExecutives, quantities]);

  const run = async (operation: () => Promise<ResultadoAsignacion>) => {
    if (!selectedProceso || !selectedProviders.length) { setMessage('Selecciona al menos un proveedor.'); return; }
    if (reason.trim().length < 3) { setMessage('Registra un motivo para conservar la trazabilidad.'); return; }
    setBusy(true); setMessage('');
    try { const result = await operation(); setMessage(resultMessage(result)); setSelectedProviders([]); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.'); }
    finally { setBusy(false); }
  };

  const toggleProvider = (id: string) => setSelectedProviders((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleExecutive = (id: string) => setSelectedExecutives((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <div className="container portfolio-page">
    <section className="card">
      <div className="section-heading"><div><h2 className="page-title">Cartera de ejecutivas</h2><p className="context-label">{selectedEmpresa?.razonSocial || 'Sin empresa'} · {selectedProceso?.codigo || 'Sin proceso'}</p><p className="secondary-text">Asigna, distribuye, reasigna o retira proveedores con historial completo.</p></div><span className="readonly-badge">{portfolio?.unassignedCount || 0} sin asignar</span></div>
      {message ? <p className="success-message" role="status">{message}</p> : null}
      <div className="portfolio-summary">
        {portfolio?.executives.map((executive) => <label key={executive.id} className="portfolio-executive"><span><input type="checkbox" checked={selectedExecutives.includes(executive.id)} onChange={() => toggleExecutive(executive.id)} /> {executive.name}</span><strong>{executive.activeCount}</strong><small>proveedores activos</small><input aria-label={`Cantidad para ${executive.name}`} type="number" min="0" value={quantities[executive.id] || ''} placeholder="Cantidad" onChange={(event) => setQuantities((current) => ({ ...current, [executive.id]: Number(event.target.value) }))} /></label>)}
      </div>
      <div className="portfolio-controls">
        <label>Ejecutiva destino<select value={targetExecutive} onChange={(event) => setTargetExecutive(event.target.value)}><option value="">Seleccionar</option>{portfolio?.executives.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="portfolio-reason">Motivo<input value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <div className="portfolio-actions">
          <button className="btn-primary" disabled={busy || !targetExecutive || !selectedCount} onClick={() => void run(() => api.assignProviders({ processId: selectedProceso!.id, providerIds: selectedProviders, executiveId: targetExecutive, reason }))}>Asignar / reasignar</button>
          <button className="btn-secondary" disabled={busy || !selectedCount || !selectedExecutives.length} onClick={() => void run(() => api.distributeProviders({ processId: selectedProceso!.id, providerIds: selectedProviders, mode: 'balanced', executiveIds: selectedExecutives, reason }))}>Repartir equitativamente</button>
          <button className="btn-secondary" disabled={busy || !selectedCount || !selectedExecutives.length || quantitiesTotal !== selectedCount} title={`Cantidad definida: ${quantitiesTotal} de ${selectedCount}`} onClick={() => void run(() => api.distributeProviders({ processId: selectedProceso!.id, providerIds: selectedProviders, mode: 'quantity', quantities: selectedExecutives.map((executiveId) => ({ executiveId, quantity: quantities[executiveId] || 0 })).filter((item) => item.quantity > 0), reason }))}>Repartir por cantidad ({quantitiesTotal}/{selectedCount})</button>
          <button className="btn-danger" disabled={busy || !selectedCount} onClick={() => void run(() => api.unassignProviders({ processId: selectedProceso!.id, providerIds: selectedProviders, reason }))}>Quitar asignación</button>
        </div>
      </div>
      <div className="table-wrapper"><table className="portfolio-table"><thead><tr><th><input aria-label="Seleccionar todos" type="checkbox" checked={allSelected} onChange={() => setSelectedProviders(allSelected ? [] : portfolio?.providers.map((item) => item.id) || [])} /></th><th>Proveedor</th><th>RUC</th><th>Ejecutiva</th><th>Paso</th><th>Subestado</th></tr></thead><tbody>{portfolio?.providers.map((provider) => <tr key={provider.id}><td><input aria-label={`Seleccionar ${provider.legal_name}`} type="checkbox" checked={selectedProviders.includes(provider.id)} onChange={() => toggleProvider(provider.id)} /></td><td>{provider.legal_name}</td><td>{provider.tax_id}</td><td>{provider.assigned_executive_name || <span className="unassigned-label">Sin asignar</span>}</td><td>{provider.current_step}</td><td>{provider.workflow_substatus}</td></tr>)}</tbody></table>{!busy && !portfolio?.providers.length ? <p className="empty-status">No hay proveedores en el proceso seleccionado.</p> : null}</div>
    </section>
    <section className="card"><h3>Historial de asignaciones</h3><p className="secondary-text">Cada cambio conserva quién lo realizó, el motivo y las fechas de inicio y retiro.</p><div className="table-wrapper"><table className="portfolio-table"><thead><tr><th>Proveedor</th><th>Ejecutiva</th><th>Asignó</th><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>{portfolio?.history.map((item) => <tr key={item.id}><td>{item.provider_name}</td><td>{item.assigned_user_name}</td><td>{item.assigned_by_name}</td><td>{new Date(item.assigned_at).toLocaleString('es-PE')}</td><td>{item.released_at ? new Date(item.released_at).toLocaleString('es-PE') : 'Actual'}</td><td>{item.released_at ? item.release_reason || item.reason : item.reason}</td></tr>)}</tbody></table></div></section>
  </div>;
}
