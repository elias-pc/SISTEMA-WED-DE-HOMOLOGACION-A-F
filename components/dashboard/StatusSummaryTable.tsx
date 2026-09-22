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
      <h2 id="dashboard-summary-title">Resumen de estatus</h2>
      <CompactTable rows={principal} total={total} withPercentage />
      <div className="dashboard-summary-separator" aria-hidden="true" />
      <CompactTable rows={observations} total={total} />
      <div className="dashboard-summary-separator" aria-hidden="true" />
      <CompactTable rows={certificates} total={total} />
    </section>
  );
}

export default StatusSummaryTable;
