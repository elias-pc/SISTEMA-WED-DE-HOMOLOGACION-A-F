import type { Proveedor } from '../../types';

interface Props {
  proveedores: Proveedor[];
  filterLabels: string[];
  showAction: boolean;
  onSelect: (provider: Proveedor) => void;
}

function ProveedoresTable({ proveedores, filterLabels, showAction, onSelect }: Props) {
  const visibleFilters = filterLabels.length ? filterLabels : ['Filtro'];
  const headers = ['Nro', 'RUC', 'Razón Social', 'Contacto', 'Teléfonos', 'E-Mail', 'Dirección', 'Departamento', ...visibleFilters];
  if (showAction) headers.push('Acción');

  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1120px' }}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor, index) => (
              <tr key={proveedor.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>{index + 1}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.ruc}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.razonSocial}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.personaContacto}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.telefonos}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.email}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.direccion || '—'}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.departamento || '—'}</td>
                {visibleFilters.map((_, filterIndex) => <td key={`filter-${filterIndex}`} style={{ padding: '1rem 0.75rem' }}>{proveedor.atributos?.[`filtro_${filterIndex + 1}`] || '—'}</td>)}
                {showAction ? <td style={{ padding: '1rem 0.75rem' }}><button type="button" className="btn-secondary table-action" aria-label={`Abrir expediente de ${proveedor.razonSocial}`} onClick={() => onSelect(proveedor)}>Abrir expediente</button></td> : null}
              </tr>
          ))}
        </tbody>
      </table>
      {proveedores.length === 0 ? <p className="secondary-text" style={{ textAlign: 'center' }}>No se encontraron proveedores.</p> : null}
    </div>
  );
}

export default ProveedoresTable;
