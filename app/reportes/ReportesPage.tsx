import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../src/auth/AuthContext';
import { useTenant } from '../../src/tenant/TenantContext';
import type { ReporteOperativo, ReporteProductividad, TipoReporteOperativo } from '../../types';

const reportes: Array<{ id: TipoReporteOperativo; title: string; description: string }> = [
  { id: 'directorio', title: 'Directorio de proveedores', description: 'Datos de contacto, ubicación y Status del proveedor.' },
  { id: 'facturacion', title: 'Facturación y pagos', description: 'Pagos, formulario y días transcurridos.' },
  { id: 'homologados', title: 'Homologados y vigencias', description: 'Ejecutiva, dictamen, puntaje y vigencia.' },
  { id: 'inspecciones', title: 'Inspecciones', description: 'Inspector, asignación, visita y días transcurridos.' },
  { id: 'trazabilidad', title: 'Trazabilidad', description: 'Una fila por proveedor con los hitos del proceso.' },
];

function displayValue(value: unknown, kind: ReporteOperativo['columns'][number]['kind']) {
  if (value === null || value === undefined || value === '') return '—';
  if (kind === 'date') { const [year, month, day] = String(value).slice(0, 10).split('-'); return year && month && day ? `${day}/${month}/${year}` : String(value); }
  if (kind === 'currency') return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
  if (kind === 'number') return new Intl.NumberFormat('es-PE').format(Number(value));
  return String(value).replace(/_/g, ' ');
}

function ReportesPage() {
  const { user } = useAuth();
  const { empresasDisponibles, selectedEmpresa, selectedProceso, selectEmpresa } = useTenant();
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<TipoReporteOperativo>('directorio');
  const [report, setReport] = useState<ReporteOperativo | null>(null);
  const [reportUsers, setReportUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [search, setSearch] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [productivity, setProductivity] = useState<ReporteProductividad | null>(null);
  const canViewProductivity = user?.role === 'supervisor_general' || user?.role === 'administradora';
  const selectedReport = reportes.find((item) => item.id === selectedType)!;

  const loadReport = async (type = selectedType, userId = selectedUserId) => {
    if (!selectedProceso) return;
    setReportLoading(true); setMessage('');
    try {
      const next = await api.operationalReport(selectedProceso.id, type, userId || undefined);
      setSelectedType(type); setReport(next); setSearch('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo generar el reporte.'); }
    finally { setReportLoading(false); }
  };

  useEffect(() => {
    if (!selectedProceso) { setReportUsers([]); setReport(null); return; }
    setSelectedUserId('');
    void api.operationalReportUsers(selectedProceso.id).then(({ users }) => setReportUsers(users)).catch(() => setReportUsers([]));
    void loadReport(selectedType, '');
    // The report must refresh whenever the globally selected client/process changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProceso?.id]);

  const visibleColumns = useMemo(() => report?.columns || [], [report]);
  const visibleRows = useMemo(() => {
    if (!report) return [];
    const term = search.trim().toLocaleLowerCase('es-PE');
    if (!term) return report.rows;
    return report.rows.filter((row) => visibleColumns.some((column) => String(row[column.key] ?? '').toLocaleLowerCase('es-PE').includes(term)));
  }, [report, search, visibleColumns]);

  const downloadReport = async () => {
    if (!selectedProceso || !report) return;
    setMessage('');
    const query = new URLSearchParams({ processId: selectedProceso.id, type: report.type });
    if (selectedUserId) query.set('userId', selectedUserId);
    if (search.trim()) query.set('search', search.trim());
    try {
      const response = await fetch(`/api/reports/operational/export?${query.toString()}`, { credentials: 'include' });
      if (!response.ok) { const body = await response.json().catch(() => ({ error: 'No se pudo exportar el reporte.' })); throw new Error(body.error); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `reporte-${report.type}.xlsx`; link.click(); URL.revokeObjectURL(url);
      setMessage(`Reporte “${selectedReport.title}” exportado en Excel.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo exportar el reporte.'); }
  };
  const loadProductivity = async () => { if (!selectedProceso) return; setMessage(''); try { setProductivity(await api.productivityReport(selectedProceso.id, from, to)); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo generar el reporte de productividad.'); } };

  return <div className="container portfolio-page">
    <section className="card reports-workspace">
      <h2 className="page-title">Reportes</h2><p className="context-label">{selectedEmpresa?.razonSocial} · {selectedProceso?.codigo}</p>
      <p className="secondary-text">Consulta, filtra y exporta los datos del proceso seleccionado. Cada Excel incluye el logo y la identidad institucional de A&amp;F.</p>
      {message ? <p className={message.includes('exportado') ? 'success-message' : 'form-error'} role="status">{message}</p> : null}
      <div className="report-grid">{reportes.map((reporte) => <article key={reporte.id} className={`report-card${selectedType === reporte.id ? ' is-selected' : ''}`}><div><h3>{reporte.title}</h3><p>{reporte.description}</p></div><button type="button" className="btn-primary" disabled={!selectedProceso || reportLoading} onClick={() => void loadReport(reporte.id)}>Ver reporte</button></article>)}</div>
      <section className="report-preview" aria-live="polite">
        <div className="section-heading"><div><h3>{selectedReport.title}</h3><p className="secondary-text">{reportLoading ? 'Actualizando información…' : `${visibleRows.length} fila(s) visibles.`}</p></div><button type="button" className="btn-primary" disabled={!report || reportLoading} onClick={() => void downloadReport()}>Exportar Excel</button></div>
        <div className="report-controls">
          <label>Cliente<select value={selectedEmpresa?.id || ''} onChange={(event) => selectEmpresa(event.target.value)}>{empresasDisponibles.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nombreComercial}</option>)}</select></label>
          <label>Usuario<select value={selectedUserId} onChange={(event) => { const value = event.target.value; setSelectedUserId(value); void loadReport(selectedType, value); }}><option value="">Todos</option>{reportUsers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="report-search">Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en el reporte" /></label>
        </div>
        {report ? <div className="report-table-scroll"><table className="report-table"><thead><tr>{visibleColumns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${report.type}-${index}`}>{visibleColumns.map((column) => <td key={column.key} className={column.kind === 'number' && Number(row[column.key]) < 0 ? 'report-negative' : undefined}>{displayValue(row[column.key], column.kind)}</td>)}</tr>)}</tbody></table>{!visibleRows.length ? <p className="empty-status">No hay resultados con los filtros seleccionados.</p> : null}</div> : null}
      </section>
    </section>
    {canViewProductivity ? <section className="card"><h2 className="page-title">Productividad por ejecutiva</h2><p className="secondary-text">Los resultados se atribuyen a la ejecutiva que tenía asignado al proveedor cuando ocurrió cada evento.</p><div className="portfolio-controls"><label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><div className="portfolio-actions"><button className="btn-primary" disabled={!selectedProceso || !from || !to} onClick={() => void loadProductivity()}>Generar productividad</button></div></div>{productivity ? <div className="table-wrapper"><table className="portfolio-table"><thead><tr><th>Ejecutiva</th><th>Cartera</th><th>Asignados período</th><th>Contactos</th><th>Formularios enviados</th><th>Devueltos</th><th>Visitas</th><th>Homologados</th><th>Pendientes</th><th>Horas por paso</th></tr></thead><tbody>{productivity.rows.map((row) => <tr key={row.executiveId}><td>{row.executiveName}</td><td>{row.currentPortfolio}</td><td>{row.assignedInPeriod}</td><td>{row.contacts}</td><td>{row.formsSent}</td><td>{row.formsReturned}</td><td>{row.visitsCoordinated}</td><td>{row.homologated}</td><td>{row.pending}</td><td>{Object.entries(row.averageHoursByStep).map(([step, hours]) => `${step.replace('_', ' ')}: ${hours} h`).join(' · ') || 'Sin datos'}</td></tr>)}</tbody></table></div> : null}</section> : null}
  </div>;
}

export default ReportesPage;
