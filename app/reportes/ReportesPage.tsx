import { useProveedores } from '../../src/providers/ProveedoresContext';
import { useTenant } from '../../src/tenant/TenantContext';

const reportes = [
  { id: 'general', title: 'Directorio de proveedores', description: 'Datos generales y estado actual de todos los proveedores.' },
  { id: 'homologados', title: 'Proveedores homologados', description: 'Relación de proveedores con homologación vigente.' },
  { id: 'proceso', title: 'Homologaciones en proceso', description: 'Solicitudes que todavía requieren seguimiento.' },
  { id: 'vencidos', title: 'Certificados vencidos', description: 'Proveedores cuyos certificados deben renovarse.' },
];

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function ReportesPage() {
  const { proveedores } = useProveedores();
  const { selectedEmpresa, selectedProceso } = useTenant();

  const downloadReport = (reportId: string, title: string) => {
    const filtered = proveedores.filter((item) => {
      if (reportId === 'homologados') return item.estado === 'Homologado';
      if (reportId === 'proceso') return item.estado === 'En proceso';
      if (reportId === 'vencidos') return item.estado === 'Vencido';
      return true;
    });
    const headers = ['RUC', 'Razón social', 'Contacto', 'Correo', 'Distrito', 'Actividad principal', 'Estado'];
    const rows = filtered.map((item) => [item.ruc, item.razonSocial, item.personaContacto, item.email, item.distrito, item.actividadPrincipal, item.estado]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/ /g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Reportes descargables</h2>
        <p className="context-label">{selectedEmpresa?.razonSocial} · {selectedProceso?.codigo}</p>
        <p className="secondary-text">Consulta y descarga la información actual de proveedores en formato CSV, compatible con Excel.</p>
        <div className="report-grid">
          {reportes.map((reporte) => (
            <article key={reporte.id} className="report-card">
              <div><h3>{reporte.title}</h3><p>{reporte.description}</p></div>
              <button type="button" className="btn-primary" onClick={() => downloadReport(reporte.id, reporte.title)}>Descargar reporte</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReportesPage;
