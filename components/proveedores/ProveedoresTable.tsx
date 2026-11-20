import { useMemo, type CSSProperties } from 'react';
import type { Proveedor } from '../../types';

interface Props {
  proveedores: Proveedor[];
  filterLabels: string[];
  onSelect?: (provider: Proveedor) => void;
}

interface Column {
  key: string;
  header: string;
  value: (proveedor: Proveedor) => string;
}

const cellStyle: CSSProperties = { padding: '1rem 0.75rem' };

// La búsqueda se hace con el buscador de la cabecera de «Información de proveedores»; la tabla solo muestra los resultados.
function ProveedoresTable({ proveedores, filterLabels, onSelect }: Props) {
  const columns = useMemo<Column[]>(() => {
    const visibleFilters = filterLabels.length ? filterLabels : ['Filtro'];
    return [
      { key: 'ruc', header: 'RUC', value: (p) => p.ruc },
      { key: 'razonSocial', header: 'Razón Social', value: (p) => p.razonSocial },
      { key: 'personaContacto', header: 'Contacto', value: (p) => p.personaContacto },
      { key: 'telefonos', header: 'Teléfonos', value: (p) => p.telefonos },
      { key: 'email', header: 'E-Mail', value: (p) => p.email },
      { key: 'direccion', header: 'Dirección', value: (p) => p.direccion || '' },
      { key: 'departamento', header: 'Departamento', value: (p) => p.departamento || '' },
      ...visibleFilters.map<Column>((label, index) => ({ key: `filtro_${index + 1}`, header: label, value: (p) => p.atributos?.[`filtro_${index + 1}`] || '' })),
    ];
  }, [filterLabels]);

  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
        <thead>
          <tr>
            {['Nro', ...columns.map((column) => column.header)].map((header, index) => (
              <th key={`${index}-${header}`} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor, index) => (
            <tr key={proveedor.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td style={cellStyle}>{index + 1}</td>
              {columns.map((column) => (
                <td key={column.key} style={cellStyle}>
                  {column.key === 'razonSocial' && onSelect
                    ? <button type="button" className="btn-link" aria-label={`Abrir expediente de ${proveedor.razonSocial}`} onClick={() => onSelect(proveedor)}>{proveedor.razonSocial}</button>
                    : column.value(proveedor) || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {proveedores.length === 0 ? <p className="secondary-text" style={{ textAlign: 'center' }}>No se encontraron proveedores.</p> : null}
    </div>
  );
}

export default ProveedoresTable;
