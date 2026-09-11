import { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../src/auth/AuthContext';
import { useTenant } from '../../src/tenant/TenantContext';
import type { ReporteProductividad } from '../../types';

const reportes = [
  { id: 'directorio', title: 'Directorio de proveedores', description: 'Datos generales, paso y estado formal de cada proveedor.' },
  { id: 'facturacion', title: 'Facturación y pagos', description: 'Pagos registrados, bancos, operaciones y comprobantes.' },
  { id: 'homologados', title: 'Homologados y vigencias', description: 'Certificados, dictámenes, puntajes y vencimientos.' },
  { id: 'inspecciones', title: 'Inspecciones', description: 'Agenda, reprogramaciones, resultados e informes.' },
  { id: 'trazabilidad', title: 'Trazabilidad', description: 'Cada transición, responsable, motivo y fecha.' },
] as const;

function escapeCsv(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

function ReportesPage() {
  const { user } = useAuth();
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [productivity, setProductivity] = useState<ReporteProductividad | null>(null);
  const canViewProductivity = user?.role === 'supervisor_general' || user?.role === 'administradora';

  const downloadReport = async (reportId: typeof reportes[number]['id'], title: string) => {
    if (!selectedProceso) return;
    setMessage('');
    try {
      const report = await api.operationalReport(selectedProceso.id, reportId);
      const csv = `\uFEFF${[report.columns, ...report.rows].map((row) => row.map((value) => escapeCsv(typeof value === 'object' ? JSON.stringify(value) : value)).join(';')).join('\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `${title.toLowerCase().replace(/ /g, '-')}.csv`; link.click(); URL.revokeObjectURL(url);
      setMessage(`Reporte “${title}” preparado con ${report.rows.length} fila(s).`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo generar el reporte.'); }
  };

  const loadProductivity = async () => {
    if (!selectedProceso) return;
    setMessage('');
    try { setProductivity(await api.productivityReport(selectedProceso.id, from, to)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo generar el reporte de productividad.'); }
  };

  return <div className="container portfolio-page">
    <section className="card"><h2 className="page-title">Reportes descargables</h2><p className="context-label">{selectedEmpresa?.razonSocial} · {selectedProceso?.codigo}</p><p className="secondary-text">Exporta los datos operativos del proceso seleccionado en CSV compatible con Excel. La ejecutiva solo recibe datos de su propia cartera.</p>{message ? <p className="success-message" role="status">{message}</p> : null}<div className="report-grid">{reportes.map((reporte) => <article key={reporte.id} className="report-card"><div><h3>{reporte.title}</h3><p>{reporte.description}</p></div><button type="button" className="btn-primary" disabled={!selectedProceso} onClick={() => void downloadReport(reporte.id, reporte.title)}>Descargar reporte</button></article>)}</div></section>
    {canViewProductivity ? <section className="card"><h2 className="page-title">Productividad por ejecutiva</h2><p className="secondary-text">Los resultados se atribuyen a la ejecutiva que tenía asignado al proveedor cuando ocurrió cada evento.</p><div className="portfolio-controls"><label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><div className="portfolio-actions"><button className="btn-primary" disabled={!selectedProceso || !from || !to} onClick={() => void loadProductivity()}>Generar productividad</button></div></div>{productivity ? <div className="table-wrapper"><table className="portfolio-table"><thead><tr><th>Ejecutiva</th><th>Cartera</th><th>Asignados período</th><th>Contactos</th><th>Formularios enviados</th><th>Devueltos</th><th>Visitas</th><th>Homologados</th><th>Pendientes</th><th>Horas por paso</th></tr></thead><tbody>{productivity.rows.map((row) => <tr key={row.executiveId}><td>{row.executiveName}</td><td>{row.currentPortfolio}</td><td>{row.assignedInPeriod}</td><td>{row.contacts}</td><td>{row.formsSent}</td><td>{row.formsReturned}</td><td>{row.visitsCoordinated}</td><td>{row.homologated}</td><td>{row.pending}</td><td>{Object.entries(row.averageHoursByStep).map(([step, hours]) => `${step.replace('_', ' ')}: ${hours} h`).join(' · ') || 'Sin datos'}</td></tr>)}</tbody></table></div> : null}</section> : null}
  </div>;
}

export default ReportesPage;
