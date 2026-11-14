import { useMemo, useState, type CSSProperties } from 'react';
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
  filter: 'text' | 'select';
}

const cellStyle: CSSProperties = { padding: '1rem 0.75rem' };
const filterCellStyle: CSSProperties = { padding: '0 0.75rem 0.75rem' };
const filterControlStyle: CSSProperties = { width: '100%', minWidth: '7rem', padding: '0.35rem 0.5rem', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'var(--color-surface, #fff)' };

const normalize = (value: string) => value.trim().toLowerCase();

function ProveedoresTable({ proveedores, filterLabels, onSelect }: Props) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const columns = useMemo<Column[]>(() => {
    const visibleFilters = filterLabels.length ? filterLabels : ['Filtro'];
    return [
      { key: 'ruc', header: 'RUC', value: (p) => p.ruc, filter: 'text' },
      { key: 'razonSocial', header: 'Razón Social', value: (p) => p.razonSocial, filter: 'text' },
      { key: 'personaContacto', header: 'Contacto', value: (p) => p.personaContacto, filter: 'text' },
      { key: 'telefonos', header: 'Teléfonos', value: (p) => p.telefonos, filter: 'text' },
      { key: 'email', header: 'E-Mail', value: (p) => p.email, filter: 'text' },
      { key: 'direccion', header: 'Dirección', value: (p) => p.direccion || '', filter: 'text' },
      { key: 'departamento', header: 'Departamento', value: (p) => p.departamento || '', filter: 'select' },
      ...visibleFilters.map<Column>((label, index) => ({ key: `filtro_${index + 1}`, header: label, value: (p) => p.atributos?.[`filtro_${index + 1}`] || '', filter: 'select' })),
    ];
  }, [filterLabels]);

  const selectOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const column of columns) {
      if (column.filter !== 'select') continue;
      const values = new Set(proveedores.map((proveedor) => column.value(proveedor).trim()).filter(Boolean));
      options[column.key] = [...values].sort((a, b) => a.localeCompare(b, 'es'));
    }
    return options;
  }, [columns, proveedores]);

  const filtered = useMemo(() => {
    const active = columns.filter((column) => columnFilters[column.key]);
    if (!active.length) return proveedores;
    return proveedores.filter((proveedor) => active.every((column) => {
      const value = normalize(column.value(proveedor));
      const wanted = normalize(columnFilters[column.key]);
      return column.filter === 'select' ? value === wanted : value.includes(wanted);
    }));
  }, [columns, columnFilters, proveedores]);

  const hasActiveFilters = Object.values(columnFilters).some(Boolean);
  const setColumnFilter = (key: string, value: string) => setColumnFilters((current) => ({ ...current, [key]: value }));

  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      {hasActiveFilters ? (
        <p className="secondary-text" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          Mostrando {filtered.length} de {proveedores.length} proveedores.
          <button type="button" className="btn-link" onClick={() => setColumnFilters({})}>Limpiar filtros</button>
        </p>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
        <thead>
          <tr>
            {['Nro', ...columns.map((column) => column.header)].map((header, index) => (
              <th key={`${index}-${header}`} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
          <tr>
            <th style={filterCellStyle} />
            {columns.map((column) => (
              <th key={`filter-${column.key}`} style={filterCellStyle}>
                {column.filter === 'select' ? (
                  <select aria-label={`Filtrar por ${column.header}`} style={filterControlStyle} value={columnFilters[column.key] || ''} onChange={(event) => setColumnFilter(column.key, event.target.value)}>
                    <option value="">Todos</option>
                    {(selectOptions[column.key] || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type="search" aria-label={`Filtrar por ${column.header}`} placeholder="Filtrar..." style={filterControlStyle} value={columnFilters[column.key] || ''} onChange={(event) => setColumnFilter(column.key, event.target.value)} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((proveedor, index) => (
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
      {filtered.length === 0 ? <p className="secondary-text" style={{ textAlign: 'center' }}>No se encontraron proveedores.</p> : null}
    </div>
  );
}

export default ProveedoresTable;
