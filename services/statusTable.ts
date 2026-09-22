import type { EstadoProveedorReporte } from '../types';

export type StatusColumnKey = 'numero' | Exclude<keyof EstadoProveedorReporte, 'id'>;
export type StatusColumnKind = 'text' | 'number' | 'date';

export interface StatusColumn {
  key: StatusColumnKey;
  label: string;
  fixed: boolean;
  kind: StatusColumnKind;
  width: number;
}

export const statusColumns: readonly StatusColumn[] = [
  { key: 'numero', label: 'Nro', fixed: true, kind: 'number', width: 6 },
  { key: 'ruc', label: 'RUC', fixed: true, kind: 'text', width: 14 },
  { key: 'razonSocial', label: 'Razón Social', fixed: true, kind: 'text', width: 27 },
  { key: 'tipoDocumento', label: 'Tipo de Documento', fixed: false, kind: 'text', width: 18 },
  { key: 'filtro1', label: 'Filtro 1', fixed: false, kind: 'text', width: 15 },
  { key: 'estado', label: 'Status', fixed: false, kind: 'text', width: 15 },
  { key: 'subestado', label: 'Sub-Status', fixed: false, kind: 'text', width: 20 },
  { key: 'dictamen', label: 'Dictamen', fixed: false, kind: 'text', width: 16 },
  { key: 'puntajeFinalPonderado', label: 'Puntaje Final Ponderado', fixed: false, kind: 'number', width: 18 },
  { key: 'fechaEmision', label: 'Fecha de Emisión', fixed: false, kind: 'date', width: 16 },
  { key: 'fechaVencimiento', label: 'Fecha de Vcto.', fixed: false, kind: 'date', width: 16 },
  { key: 'diasPorVencer', label: 'Días por Vencer', fixed: false, kind: 'number', width: 15 },
  { key: 'entregables', label: 'Entregables', fixed: false, kind: 'text', width: 25 },
] as const;

export const optionalStatusColumnKeys = statusColumns.filter((column) => !column.fixed).map((column) => column.key);

export function visibleStatusColumns(selectedOptional: readonly StatusColumnKey[]) {
  const selected = new Set(selectedOptional);
  return statusColumns.filter((column) => column.fixed || selected.has(column.key));
}

export function rawStatusValue(row: EstadoProveedorReporte, column: StatusColumn, index: number) {
  if (column.key === 'numero') return index + 1;
  return row[column.key];
}

export function formatStatusValue(value: unknown, column: StatusColumn) {
  if (value === null || value === undefined || value === '') return '—';
  if (column.kind === 'date') {
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : String(value);
  }
  if (column.key === 'estado' || column.key === 'subestado') {
    const normalized = String(value).replace(/_/g, ' ').toLocaleLowerCase('es-PE');
    return normalized.charAt(0).toLocaleUpperCase('es-PE') + normalized.slice(1);
  }
  return String(value);
}

function excelValue(value: unknown, column: StatusColumn) {
  if (value === null || value === undefined || value === '') return '';
  if (column.kind !== 'date') return value;
  const datePart = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? new Date(`${datePart}T00:00:00`) : String(value);
}

export function buildStatusExportMatrix(rows: readonly EstadoProveedorReporte[], selectedOptional: readonly StatusColumnKey[]) {
  const columns = visibleStatusColumns(selectedOptional);
  return {
    columns,
    matrix: [
      columns.map((column) => column.label),
      ...rows.map((row, rowIndex) => columns.map((column) => excelValue(rawStatusValue(row, column, rowIndex), column))),
    ],
  };
}

export async function buildStatusWorkbookBytes(rows: readonly EstadoProveedorReporte[], selectedOptional: readonly StatusColumnKey[]) {
  const XLSX = await import('xlsx');
  const { columns, matrix } = buildStatusExportMatrix(rows, selectedOptional);
  const worksheet = XLSX.utils.aoa_to_sheet(matrix, { cellDates: true, dateNF: 'dd/mm/yyyy' });
  worksheet['!cols'] = columns.map((column) => ({ wch: column.width }));
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(columns.length - 1)}${Math.max(rows.length + 1, 1)}` };
  columns.forEach((column, columnIndex) => {
    if (column.kind !== 'date') return;
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
      if (cell?.v instanceof Date) cell.z = 'dd/mm/yyyy';
    }
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estatus de proveedores');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true, cellDates: true });
  return { bytes, columnCount: columns.length };
}

export async function downloadStatusWorkbook(rows: readonly EstadoProveedorReporte[], selectedOptional: readonly StatusColumnKey[], processCode: string) {
  const { bytes, columnCount } = await buildStatusWorkbookBytes(rows, selectedOptional);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `estatus-proveedores-${processCode.toLocaleLowerCase('es-PE').replace(/[^a-z0-9]+/g, '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
  return columnCount;
}
