import type { Proveedor } from '../types';

/** Genera y descarga un Excel con la información de proveedores que se muestra en pantalla. */
export async function downloadProvidersWorkbook(proveedores: readonly Proveedor[], filterLabels: readonly string[], processCode: string) {
  const XLSX = await import('xlsx');
  const filters = filterLabels.length ? filterLabels : ['Filtro'];
  const headers = ['Nro', 'RUC', 'Razón Social', 'Contacto', 'Teléfonos', 'E-Mail', 'Dirección', 'Departamento', 'Distrito', 'Actividad Principal', ...filters, 'Status'];
  const widths = [6, 14, 34, 24, 18, 28, 32, 16, 18, 30, ...filters.map(() => 16), 14];
  const matrix = [
    headers,
    ...proveedores.map((proveedor, index) => [
      index + 1, proveedor.ruc, proveedor.razonSocial, proveedor.personaContacto, proveedor.telefonos, proveedor.email,
      proveedor.direccion || '', proveedor.departamento || '', proveedor.distrito || '', proveedor.actividadPrincipal || '',
      ...filters.map((_, filterIndex) => proveedor.atributos?.[`filtro_${filterIndex + 1}`] || ''),
      proveedor.estado || '',
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(matrix);
  worksheet['!cols'] = widths.map((wch) => ({ wch }));
  worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(headers.length - 1)}${Math.max(proveedores.length + 1, 1)}` };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true });
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `proveedores-${(processCode || 'proceso').toLocaleLowerCase('es-PE').replace(/[^a-z0-9]+/g, '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
