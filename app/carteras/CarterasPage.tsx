import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { api } from '../../services/api';
import { useTenant } from '../../src/tenant/TenantContext';
import type { CarteraEjecutivaResumen, ResumenCartera, ResultadoAsignacion } from '../../types';

type Feedback = { kind: 'success' | 'error'; text: string };
type Tab = 'assign' | 'split' | 'remove';
type Filter = 'unassigned' | 'all' | string;

const navy = '#172d48';
const red = '#d51b1f';

function resultMessage(result: ResultadoAsignacion) {
  const parts = [
    result.assigned ? `${result.assigned} asignado(s)` : '',
    result.reassigned ? `${result.reassigned} reasignado(s)` : '',
    result.unassigned ? `${result.unassigned} retirado(s)` : '',
    result.unchanged ? `${result.unchanged} sin cambio` : '',
  ].filter(Boolean);
  return `Cambios aplicados: ${parts.join(', ') || 'sin cambios'}. La cartera se actualizó.`;
}

const statusLabel = (substatus: string) => {
  const text = (substatus || '').replace(/_/g, ' ').toLocaleLowerCase('es-PE');
  return text ? text.charAt(0).toLocaleUpperCase('es-PE') + text.slice(1) : '—';
};

const chip = (active: boolean): CSSProperties => ({ height: '2.25rem', padding: '0 .9rem', borderRadius: '999px', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? navy : '#dbe3ec'}`, background: active ? navy : '#fff', color: active ? '#fff' : '#374151' });
const tabStyle = (active: boolean): CSSProperties => ({ height: '2.5rem', border: 0, borderRadius: '.55rem', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? navy : '#5b6472', boxShadow: active ? '0 1px 4px rgba(15,23,42,.15)' : 'none' });
const choiceStyle = (active: boolean): CSSProperties => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', minHeight: '3rem', padding: '0 .9rem', borderRadius: '.65rem', cursor: 'pointer', textAlign: 'left', font: 'inherit', border: active ? `2px solid ${red}` : '1px solid #dbe3ec', background: active ? '#fff5f5' : '#fff' });
const panel: CSSProperties = { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '.8rem', padding: '1rem', borderRadius: '.9rem', background: '#fff', border: '1px solid #dbe3ec' };

function LoadBar({ executive }: { executive: CarteraEjecutivaResumen }) {
  const capacity = Math.max(1, executive.capacity || 40);
  const width = (value: number) => `${Math.min(100, (value / capacity) * 100)}%`;
  const over = executive.activeCount > capacity;
  return (
    <div style={{ display: 'grid', gap: '.35rem' }}>
      <div role="img" aria-label={`${executive.activeCount} de ${capacity} proveedores de capacidad`} style={{ height: '.55rem', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden', display: 'flex', outline: over ? `2px solid ${red}` : 'none' }}>
        <span style={{ width: width(executive.contactCount || 0), background: red }} />
        <span style={{ width: width(executive.formCount || 0), background: '#e8a33d' }} />
        <span style={{ width: width(executive.homologatedCount || 0), background: navy }} />
      </div>
      <small style={{ color: over ? red : '#5b6472', fontWeight: over ? 700 : 500 }}>{executive.activeCount} de {capacity} de capacidad{over ? ' · supera su capacidad' : ''}</small>
    </div>
  );
}

export default function CarterasPage() {
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [portfolio, setPortfolio] = useState<ResumenCartera | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('unassigned');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('assign');
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<'balanced' | 'quantity'>('balanced');
  const [splitOn, setSplitOn] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('Distribución operativa de cartera');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!selectedProceso) { setPortfolio(null); return; }
    setBusy(true);
    try {
      const next = await api.portfolio(selectedProceso.id);
      setPortfolio(next);
      setTarget((current) => next.executives.some((item) => item.id === current) ? current : next.executives[0]?.id || '');
      setSplitOn((current) => { const valid = current.filter((id) => next.executives.some((item) => item.id === id)); return valid.length ? valid : next.executives.map((item) => item.id); });
    } catch (error) { setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar la cartera.' }); }
    finally { setBusy(false); }
  };

  useEffect(() => { setSelected([]); setFeedback(null); setFilter('unassigned'); void load(); }, [selectedProceso?.id]);
  useEffect(() => {
    if (!feedback || feedback.kind !== 'success') return undefined;
    const timeout = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const executives = portfolio?.executives || [];
  const providers = portfolio?.providers || [];
  const nameOf = (id: string) => executives.find((item) => item.id === id)?.name || '';
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-PE');
    return providers.filter((provider) => {
      const assigned = provider.assignedExecutives || [];
      const byFilter = filter === 'all' || (filter === 'unassigned' ? assigned.length === 0 : assigned.some((item) => item.id === filter));
      return byFilter && (!term || provider.legal_name.toLocaleLowerCase('es-PE').includes(term) || provider.tax_id.includes(term));
    });
  }, [providers, filter, query]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((provider) => selectedSet.has(provider.id));
  const count = selected.length;
  const targetExecutive = executives.find((item) => item.id === target);

  // Vista previa del reparto: equitativo empieza por la ejecutiva con menos carga.
  const activeSplit = executives.filter((item) => splitOn.includes(item.id));
  const equalShares = useMemo(() => {
    const order = [...activeSplit].sort((a, b) => a.activeCount - b.activeCount);
    const shares: Record<string, number> = {};
    order.forEach((item, index) => { shares[item.id] = Math.floor(count / Math.max(order.length, 1)) + (index < count % Math.max(order.length, 1) ? 1 : 0); });
    return shares;
  }, [activeSplit, count]);
  const quantityTotal = activeSplit.reduce((sum, item) => sum + (quantities[item.id] || 0), 0);
  const receives = (id: string) => !splitOn.includes(id) ? 0 : mode === 'balanced' ? equalShares[id] || 0 : quantities[id] || 0;
  const removable = target ? providers.filter((provider) => selectedSet.has(provider.id) && (provider.assignedExecutives || []).some((item) => item.id === target)).length : 0;

  let summary = 'Selecciona al menos un proveedor en la lista.';
  let canConfirm = count > 0 && reason.trim().length >= 3 && !busy;
  let confirmLabel = 'Confirmar';
  if (count > 0 && tab === 'assign') {
    summary = targetExecutive ? `Vas a asignar ${count} proveedor(es) a ${targetExecutive.name}. Quedará con ${targetExecutive.activeCount + count} de ${targetExecutive.capacity || 40} de capacidad.` : 'Elige la ejecutiva.';
    canConfirm = canConfirm && Boolean(targetExecutive);
    confirmLabel = targetExecutive ? `Asignar ${count} a ${targetExecutive.name}` : 'Asignar';
  }
  if (count > 0 && tab === 'split') {
    const quantityOk = mode === 'balanced' || quantityTotal === count;
    summary = activeSplit.length ? `Vas a repartir ${count} proveedor(es): ${activeSplit.map((item) => `${item.name} recibe ${receives(item.id)}`).join(' · ')}.` : 'Marca al menos una ejecutiva.';
    canConfirm = canConfirm && activeSplit.length > 0 && quantityOk;
    confirmLabel = `Repartir ${count} proveedor(es)`;
  }
  if (count > 0 && tab === 'remove') {
    summary = targetExecutive ? (removable ? `Vas a quitar ${removable} proveedor(es) de la cartera de ${targetExecutive.name}. Quedarán «Sin asignar» y su avance no retrocede.` : `Ninguno de los seleccionados está asignado a ${targetExecutive.name}.`) : 'Elige la ejecutiva.';
    canConfirm = canConfirm && removable > 0;
    confirmLabel = targetExecutive ? `Quitar ${removable} de ${targetExecutive.name}` : 'Quitar';
  }
  if (count > 0 && reason.trim().length < 3) summary += ' Escribe un motivo para la trazabilidad.';

  const confirm = async () => {
    if (!selectedProceso || !canConfirm) return;
    setBusy(true); setFeedback(null);
    try {
      let result: ResultadoAsignacion;
      if (tab === 'assign') result = await api.assignProviders({ processId: selectedProceso.id, providerIds: selected, executiveId: target, reason });
      else if (tab === 'remove') result = await api.unassignProviders({ processId: selectedProceso.id, providerIds: selected, executiveId: target, reason });
      else if (mode === 'balanced') result = await api.distributeProviders({ processId: selectedProceso.id, providerIds: selected, mode: 'balanced', executiveIds: activeSplit.map((item) => item.id), reason });
      else result = await api.distributeProviders({ processId: selectedProceso.id, providerIds: selected, mode: 'quantity', quantities: activeSplit.map((item) => ({ executiveId: item.id, quantity: quantities[item.id] || 0 })).filter((item) => item.quantity > 0), reason });
      setFeedback({ kind: 'success', text: resultMessage(result) });
      setSelected([]);
      await load();
    } catch (error) { setFeedback({ kind: 'error', text: error instanceof Error ? error.message : 'No se pudo completar la operación.' }); }
    finally { setBusy(false); }
  };

  const filters: Array<[Filter, string]> = [['unassigned', `Sin asignar (${portfolio?.unassignedCount || 0})`], ...executives.map((item): [Filter, string] => [item.id, `De ${item.name.split(' ')[0]} (${item.activeCount})`]), ['all', `Todos (${providers.length})`]];

  return <>
    {feedback ? <aside className={`portfolio-toast portfolio-toast--${feedback.kind}`} role="status" aria-live="polite">
      <span>{feedback.text}</span>
      <button type="button" className="portfolio-toast-close" aria-label="Cerrar mensaje" onClick={() => setFeedback(null)}>×</button>
    </aside> : null}
    <div className="container portfolio-page">
      <section className="card" style={{ display: 'grid', gap: '1.1rem' }}>
        <div className="section-heading" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <h2 className="page-title">Cartera de ejecutivas</h2>
            <p className="context-label">{selectedEmpresa?.razonSocial || 'Sin empresa'} · {selectedProceso?.codigo || 'Sin proceso'}</p>
            <p className="secondary-text">1) Elige proveedores · 2) Acción · 3) Revisa el resumen y confirma.</p>
          </div>
          <div style={{ display: 'flex', gap: '.6rem' }}>
            <div style={{ padding: '.6rem .9rem', borderRadius: '.65rem', border: '1px solid #dbe3ec', display: 'grid' }}><small className="secondary-text">Sin asignar</small><strong style={{ fontSize: '1.25rem', color: red }}>{portfolio?.unassignedCount || 0}</strong></div>
            <div style={{ padding: '.6rem .9rem', borderRadius: '.65rem', border: '1px solid #dbe3ec', display: 'grid' }}><small className="secondary-text">Total del proceso</small><strong style={{ fontSize: '1.25rem' }}>{providers.length}</strong></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '.8rem' }}>
          {executives.map((executive) => (
            <article key={executive.id} style={{ padding: '.9rem 1rem', borderRadius: '.8rem', border: '1px solid #dbe3ec', background: '#fff', display: 'grid', gap: '.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', minWidth: 0 }}><strong>{executive.name}</strong><small className="secondary-text" style={{ overflowWrap: 'anywhere' }}>{executive.email}</small></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', padding: '.35rem .7rem', borderRadius: '.6rem', background: '#eef2f7' }}><strong style={{ fontSize: '1.3rem', color: navy }}>{executive.activeCount}</strong><span style={{ fontSize: '.82rem', fontWeight: 600 }}>proveedores asignados</span></div>
              </div>
              <LoadBar executive={executive} />
              <div style={{ display: 'flex', gap: '.9rem', flexWrap: 'wrap', fontSize: '.78rem', color: '#374151' }}>
                <span><span aria-hidden="true" style={{ display: 'inline-block', width: '.55rem', height: '.55rem', borderRadius: '2px', background: red, marginRight: '.35rem' }} />En contacto: <strong>{executive.contactCount || 0}</strong></span>
                <span><span aria-hidden="true" style={{ display: 'inline-block', width: '.55rem', height: '.55rem', borderRadius: '2px', background: '#e8a33d', marginRight: '.35rem' }} />En formulario / visita: <strong>{executive.formCount || 0}</strong></span>
                <span><span aria-hidden="true" style={{ display: 'inline-block', width: '.55rem', height: '.55rem', borderRadius: '2px', background: navy, marginRight: '.35rem' }} />Homologados: <strong>{executive.homologatedCount || 0}</strong></span>
              </div>
            </article>
          ))}
          {!executives.length && !busy ? <p className="secondary-text">No hay ejecutivas vinculadas a esta empresa. Vincúlalas en «Usuarios internos».</p> : null}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ ...panel, flex: '999 1 520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>1 · Elige proveedores</h3>
              <span style={{ padding: '.25rem .65rem', borderRadius: '999px', background: '#fdecec', color: '#b5161a', fontSize: '.82rem', fontWeight: 700 }}>{count} seleccionado(s)</span>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {filters.map(([id, label]) => <button key={id} type="button" style={chip(filter === id)} onClick={() => setFilter(id)}>{label}</button>)}
              <input type="search" className="search-input" aria-label="Buscar proveedor por RUC o nombre" placeholder="Buscar RUC o nombre" value={query} onChange={(event) => setQuery(event.target.value)} style={{ marginTop: 0, marginLeft: 'auto', width: '220px', maxWidth: '100%', padding: '.55rem .8rem', fontSize: '.85rem' }} />
            </div>
            <div className="table-wrapper" style={{ maxHeight: '520px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '.65rem' }}>
              <table className="portfolio-table" style={{ margin: 0 }}>
                <thead><tr><th style={{ width: '2.5rem' }}><input aria-label="Seleccionar todos los visibles" type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? selected.filter((id) => !visible.some((provider) => provider.id === id)) : [...new Set([...selected, ...visible.map((provider) => provider.id)])])} /></th><th>Proveedor</th><th>RUC</th><th>Ejecutiva</th><th>Status</th></tr></thead>
                <tbody>{visible.map((provider) => {
                  const assigned = provider.assignedExecutives || [];
                  const isSelected = selectedSet.has(provider.id);
                  return <tr key={provider.id} style={{ background: isSelected ? '#fff5f5' : undefined, cursor: 'pointer' }} onClick={() => setSelected(isSelected ? selected.filter((id) => id !== provider.id) : [...selected, provider.id])}>
                    <td><input type="checkbox" aria-label={`Seleccionar ${provider.legal_name}`} checked={isSelected} onClick={(event) => event.stopPropagation()} onChange={() => setSelected(isSelected ? selected.filter((id) => id !== provider.id) : [...selected, provider.id])} /></td>
                    <td style={{ fontWeight: 600 }}>{provider.legal_name}</td>
                    <td>{provider.tax_id}</td>
                    <td style={{ color: assigned.length ? navy : '#b5161a', fontWeight: assigned.length ? 600 : 700 }}>{assigned.length ? assigned.map((item) => item.name).join(', ') : 'Sin asignar'}</td>
                    <td>{statusLabel(provider.workflow_substatus)}</td>
                  </tr>;
                })}</tbody>
              </table>
              {!visible.length ? <p className="secondary-text" style={{ padding: '1rem', margin: 0 }}>{busy ? 'Cargando proveedores…' : 'No hay proveedores con ese filtro.'}</p> : null}
            </div>
          </div>

          <div style={{ ...panel, flex: '1 1 340px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>2 · Acción</h3>
            <div role="tablist" aria-label="Acción" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '.35rem', padding: '.25rem', background: '#eef2f7', borderRadius: '.75rem' }}>
              {([['assign', 'Asignar'], ['split', 'Repartir'], ['remove', 'Quitar']] as Array<[Tab, string]>).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{label}</button>)}
            </div>

            {tab === 'assign' || tab === 'remove' ? (
              <div style={{ display: 'grid', gap: '.5rem' }}>
                <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>{tab === 'assign' ? 'Asignar a:' : 'Quitar la asignación de:'}</span>
                {executives.map((executive) => <button key={executive.id} type="button" aria-pressed={target === executive.id} style={choiceStyle(target === executive.id)} onClick={() => setTarget(executive.id)}><span style={{ fontWeight: 700 }}>{executive.name}</span><small className="secondary-text">{executive.activeCount} de {executive.capacity || 40} de capacidad</small></button>)}
                {tab === 'remove' ? <small className="secondary-text">Los proveedores quedan «Sin asignar». Su avance en el flujo no retrocede.</small> : null}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '.6rem' }}>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button type="button" style={{ ...chip(mode === 'balanced'), flex: 1, borderRadius: '.6rem' }} onClick={() => setMode('balanced')}>Equitativo</button>
                  <button type="button" style={{ ...chip(mode === 'quantity'), flex: 1, borderRadius: '.6rem' }} onClick={() => setMode('quantity')}>Por cantidad</button>
                </div>
                {executives.map((executive) => {
                  const on = splitOn.includes(executive.id);
                  return <div key={executive.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem', padding: '.6rem .75rem', border: '1px solid #dbe3ec', borderRadius: '.65rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 600 }}><input type="checkbox" checked={on} onChange={() => setSplitOn(on ? splitOn.filter((id) => id !== executive.id) : [...splitOn, executive.id])} />{executive.name}</label>
                    {mode === 'quantity' && on ? <input type="number" min={0} aria-label={`Cantidad para ${executive.name}`} value={quantities[executive.id] ?? 0} onChange={(event) => setQuantities({ ...quantities, [executive.id]: Math.max(0, Number(event.target.value) || 0) })} style={{ width: '4.5rem', height: '2.1rem', padding: '0 .5rem', border: '1px solid #cbd5e1', borderRadius: '.5rem' }} /> : null}
                    <span style={{ fontSize: '.85rem', fontWeight: 700, color: navy }}>recibe {receives(executive.id)}</span>
                  </div>;
                })}
                <small style={{ color: mode === 'quantity' && quantityTotal !== count ? '#b5161a' : '#5b6472', fontWeight: mode === 'quantity' && quantityTotal !== count ? 700 : 400 }}>{mode === 'quantity' ? `Cantidad definida: ${quantityTotal} de ${count} seleccionados${quantityTotal === count ? '' : ' (debe coincidir)'}` : 'Se reparte por turnos, empezando por la ejecutiva con menos carga.'}</small>
              </div>
            )}

            <label style={{ display: 'grid', gap: '.35rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>Motivo
              <input id="cartera-motivo" className="search-input" value={reason} onChange={(event) => setReason(event.target.value)} style={{ marginTop: 0, padding: '.6rem .8rem', fontSize: '.9rem' }} />
            </label>

            <div style={{ marginTop: 'auto', display: 'grid', gap: '.6rem', padding: '.9rem', borderRadius: '.75rem', background: '#f6f8fb', border: '1px solid #dbe3ec' }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#5b6472' }}>3 · Resumen</span>
              <span style={{ fontSize: '.9rem', lineHeight: 1.45 }}>{summary}</span>
              <button type="button" className="btn-primary" disabled={!canConfirm} onClick={() => void confirm()} style={{ minHeight: '2.8rem' }}>{busy ? 'Aplicando…' : confirmLabel}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </>;
}
