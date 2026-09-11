import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseProviderWorkbook } from './provider-import.js';

function asBase64(rows: Record<string, string>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Proveedores');
  return XLSX.write(book, { type: 'base64', bookType: 'xlsx' });
}

describe('importación de proveedores desde Excel', () => {
  it('normaliza encabezados y conserva filtros adicionales', () => {
    const rows = parseProviderWorkbook(asBase64([{ RUC: '20987654321', 'Razón Social': 'Proveedor SAC', Contacto: 'Ana', Teléfono: '999888777', Correo: 'ana@example.test', Dirección: 'Av. Uno 1', Departamento: 'Lima', Distrito: 'Lima', 'Actividad Principal': 'Servicios', 'Filtro 1': 'Crítico' }]));
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].provider).toMatchObject({ ruc: '20987654321', razonSocial: 'Proveedor SAC', attributes: { filtro_1: 'Crítico' } });
  });

  it('rechaza RUC repetidos y datos incompletos sin perder el detalle de la fila', () => {
    const rows = parseProviderWorkbook(asBase64([
      { RUC: '20987654321', 'Razón Social': 'Uno', Contacto: 'Ana', Teléfono: '999888777', Correo: 'ana@example.test', Dirección: 'Av. Uno 1', Departamento: 'Lima', Distrito: 'Lima', 'Actividad Principal': 'Servicios' },
      { RUC: '20987654321', 'Razón Social': 'Dos', Contacto: '', Teléfono: '999888777', Correo: 'incorrecto', Dirección: 'Av. Dos 1', Departamento: 'Lima', Distrito: 'Lima', 'Actividad Principal': 'Servicios' },
    ]));
    expect(rows[0].errors).toContain('El RUC está duplicado dentro del archivo.');
    expect(rows[1].errors).toEqual(expect.arrayContaining(['Falta personaContacto.', 'El correo electrónico no es válido.']));
  });
});
