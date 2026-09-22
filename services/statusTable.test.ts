import { describe, expect, it } from 'vitest';
import { buildStatusExportMatrix, buildStatusWorkbookBytes, optionalStatusColumnKeys, statusColumns, visibleStatusColumns, type StatusColumnKey } from './statusTable';
import type { EstadoProveedorReporte } from '../types';

const row: EstadoProveedorReporte = {
  id: 'provider-1', ruc: '20501234567', razonSocial: 'Proveedor de prueba', tipoDocumento: 'Certificado',
  filtro1: 'Crítico', estado: 'INSCRITO', subestado: 'PENDIENTE_ENTREGABLES', dictamen: 'Conforme',
  puntajeFinalPonderado: 95, fechaEmision: '2026-09-11', fechaVencimiento: '2027-09-11', diasPorVencer: 364,
  entregables: 'Informe.pdf', documentosEntregables: [{ id: 'doc-1', originalName: 'Informe.pdf', mimeType: 'application/pdf', byteSize: 1024 }],
};

describe('tabla y Excel de estatus', () => {
  it('usa exactamente las trece columnas de la Plantilla 3', () => {
    expect(statusColumns.map((column) => column.label)).toEqual([
      'Nro', 'RUC', 'Razón Social', 'Tipo de Documento', 'Filtro 1', 'Status', 'Sub-Status', 'Dictamen',
      'Puntaje Final Ponderado', 'Fecha de Emisión', 'Fecha de Vcto.', 'Días por Vencer', 'Entregables',
    ]);
  });

  it('mantiene las tres columnas fijas al seleccionar otras columnas', () => {
    expect(visibleStatusColumns([]).map((column) => column.key)).toEqual(['numero', 'ruc', 'razonSocial']);
    expect(optionalStatusColumnKeys).toContain('entregables');
  });

  it('genera una matriz con únicamente las columnas seleccionadas', () => {
    const selected: StatusColumnKey[] = ['tipoDocumento', 'estado', 'entregables'];
    const result = buildStatusExportMatrix([row], selected);
    expect(result.columns).toHaveLength(6);
    expect(result.matrix[0]).toEqual(['Nro', 'RUC', 'Razón Social', 'Tipo de Documento', 'Status', 'Entregables']);
    expect(result.matrix[1]).toHaveLength(6);
    expect(result.matrix[1].slice(0, 3)).toEqual([1, '20501234567', 'Proveedor de prueba']);
  });

  it('genera todas las columnas al seleccionar cada opción', () => {
    const result = buildStatusExportMatrix([row], optionalStatusColumnKeys);
    expect(result.columns).toHaveLength(13);
    expect(result.matrix[0]).toEqual(statusColumns.map((column) => column.label));
    expect(result.matrix[1]).toHaveLength(13);
    expect(result.matrix[1].slice(0, 3)).toEqual([1, '20501234567', 'Proveedor de prueba']);
  });

  it('crea un archivo xlsx legible con las columnas seleccionadas', async () => {
    const selected: StatusColumnKey[] = ['tipoDocumento', 'estado', 'entregables'];
    const { bytes, columnCount } = await buildStatusWorkbookBytes([row], selected);
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(bytes, { type: 'array', cellDates: true });
    const worksheet = workbook.Sheets['Estatus de proveedores'];
    const values = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false });
    expect(columnCount).toBe(6);
    expect(values[0]).toEqual(['Nro', 'RUC', 'Razón Social', 'Tipo de Documento', 'Status', 'Entregables']);
    expect(values[1]).toHaveLength(6);
    expect(values[1][1]).toBe('20501234567');
  });
});
