interface StatusRow {
  number: number;
  label: string;
  value: number;
}

interface Props {
  total: number;
  principal: StatusRow[];
  observations: StatusRow[];
  certificates: StatusRow[];
}

function countValue(value: number) {
  return new Intl.NumberFormat('es-PE').format(value);
}

function percentage(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function CompactTable({ rows, total, withPercentage = false }: { rows: StatusRow[]; total: number; withPercentage?: boolean }) {
  return (
    <table className="dashboard-summary-table">
      <thead>
        <tr>
          <th scope="col">Nro</th>
          <th scope="col">Estatus</th>
          <th scope="col">Nro</th>
          {withPercentage ? <th scope="col">%</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.number}>
            <td>{row.number}</td>
            <td>{row.label}</td>
            <td>{countValue(row.value)}</td>
            {withPercentage ? <td>{percentage(row.value, total)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusSummaryTable({ total, principal, observations, certificates }: Props) {
  return (
    <section className="card dashboard-summary-panel" aria-labelledby="dashboard-summary-title">
      <h2 id="dashboard-summary-title"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.25h2.25V6.5H3zm4.25.35h9.5v1.55h-9.5zM3 8.9h2.25v2.25H3zm4.25.35h9.5v1.55h-9.5zM3 13.55h2.25v2.25H3zm4.25.35h9.5v1.55h-9.5z" /></svg>Resumen de estatus</h2>
      <div className="dashboard-summary-content">
        <div className="dashboard-summary-primary">
          <CompactTable rows={principal} total={total} withPercentage />
        </div>
        <div className="dashboard-summary-support">
          <section className="dashboard-summary-group" aria-label="Otros estatus">
            <h3>Otros estatus</h3>
            <CompactTable rows={observations} total={total} />
          </section>
          <section className="dashboard-summary-group" aria-label="Estado de certificados">
            <h3>Estado de certificados</h3>
            <CompactTable rows={certificates} total={total} />
          </section>
        </div>
      </div>
    </section>
  );
}

export default StatusSummaryTable;
