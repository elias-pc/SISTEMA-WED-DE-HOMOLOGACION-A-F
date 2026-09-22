import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { downloadStatusWorkbook, formatStatusValue, optionalStatusColumnKeys, rawStatusValue, statusColumns, visibleStatusColumns, type StatusColumnKey } from '../../services/statusTable';
import type { EstadoProveedorReporte } from '../../types';
import DeliverablesModal from './DeliverablesModal';

interface Props {
  processId: string;
  processCode: string;
}

const optionalColumns = statusColumns.filter((column) => !column.fixed);

function ProviderStatusTable({ processId, processCode }: Props) {
  const [rows, setRows] = useState<EstadoProveedorReporte[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<StatusColumnKey[]>([...optionalStatusColumnKeys]);
  const [selectedProvider, setSelectedProvider] = useState<EstadoProveedorReporte | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterControlRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true); setMessage('');
    try { setRows((await api.providerStatusReport(processId)).rows); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cargar el estatus de proveedores.'); }
    finally { setLoading(false); }
  }, [processId]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  useEffect(() => {
    if (!filterOpen) return;
    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !filterControlRef.current?.contains(event.target)) setFilterOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setFilterOpen(false); };
    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [filterOpen]);

  const columns = useMemo(() => visibleStatusColumns(selectedOptional), [selectedOptional]);

  const toggleColumn = (key: StatusColumnKey) => {
    setSelectedOptional((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const exportWorkbook = async () => {
    if (!rows.length) return;
    setExporting(true); setMessage('');
    try {
      const columnCount = await downloadStatusWorkbook(rows, selectedOptional, processCode);
      setMessage(`Excel descargado con ${columnCount} columnas seleccionadas y ${rows.length} proveedor(es).`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo generar el archivo Excel.'); }
    finally { setExporting(false); }
  };

  return (
    <section className="card status-table-card">
      <div className="section-heading status-table-heading">
        <div><h3>Seguimiento detallado de proveedores</h3><p className="secondary-text">Selecciona las columnas que deseas consultar. El Excel conserva únicamente las columnas visibles.</p></div>
        <div className="status-table-actions">
          <button type="button" className="btn-secondary" onClick={() => void loadRows()} disabled={loading}>Actualizar</button>
          <div className="status-filter-control" ref={filterControlRef}>
            <button type="button" className="btn-secondary" aria-expanded={filterOpen} aria-controls="status-column-filter" onClick={() => setFilterOpen((current) => !current)}>Filtrar columnas ({columns.length})</button>
            {filterOpen ? (
              <div id="status-column-filter" className="status-filter-popover">
                <p className="fixed-column-note"><strong>Columnas fijas:</strong> Nro, RUC y Razón Social.</p>
                <div className="column-selector-actions">
                  <button type="button" onClick={() => setSelectedOptional([...optionalStatusColumnKeys])}>Mostrar todas</button>
                  <button type="button" onClick={() => setSelectedOptional([])}>Solo columnas fijas</button>
                </div>
                <div className="column-option-grid" role="group" aria-label="Seleccionar columnas opcionales">
                  {optionalColumns.map((column) => <label key={column.key}><input type="checkbox" checked={selectedOptional.includes(column.key)} onChange={() => toggleColumn(column.key)} />{column.label}</label>)}
                </div>
              </div>
            ) : null}
          </div>
          <button type="button" className="btn-primary" onClick={() => void exportWorkbook()} disabled={loading || exporting || !rows.length}>{exporting ? 'Generando Excel...' : 'Descargar Excel'}</button>
        </div>
      </div>

      {message ? <p className={message.startsWith('Excel') ? 'success-message' : 'form-error'} role="status">{message}</p> : null}
      {loading ? <p className="empty-status">Cargando información del proceso...</p> : rows.length ? (
        <div className="status-table-scroll">
          <table className="status-detail-table">
            <colgroup>{columns.map((column) => <col key={column.key} className={`status-column-${column.key}`} />)}</colgroup>
            <thead><tr>{columns.map((column) => <th key={column.key} className={column.fixed ? `sticky-column sticky-${column.key}` : ''}>{column.label}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={row.id}>{columns.map((column) => <td key={column.key} className={column.fixed ? `sticky-column sticky-${column.key}` : ''}>{column.key === 'entregables' ? row.documentosEntregables.length ? <button type="button" className="deliverables-button" onClick={() => setSelectedProvider(row)}>Ver entregables ({row.documentosEntregables.length})</button> : <span className="empty-deliverables">Sin archivos</span> : formatStatusValue(rawStatusValue(row, column, rowIndex), column)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : <p className="empty-status">Todavía no hay proveedores registrados en este proceso.</p>}
      {selectedProvider ? <DeliverablesModal key={selectedProvider.id} providerId={selectedProvider.id} providerName={selectedProvider.razonSocial} documents={selectedProvider.documentosEntregables} onClose={() => setSelectedProvider(null)} /> : null}
    </section>
  );
}

export default ProviderStatusTable;
