import { Proveedor } from '../../types';
import Badge from '../shared/Badge';

interface Props {
  proveedores: Proveedor[];
}

function estadoVariant(estado: Proveedor['estado']) {
  switch (estado) {
    case 'Homologado':
      return 'success';
    case 'En proceso':
      return 'warning';
    case 'Observado':
      return 'danger';
    case 'Vencido':
      return 'danger';
    default:
      return 'default';
  }
}

function ProveedoresTable({ proveedores }: Props) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            {['R.U.C', 'Razón Social del Proveedor', 'Persona de Contacto', 'Teléfonos', 'E-Mail', 'Dirección', 'Departamento', 'Distrito', 'Act. Principal', 'Estado'].map((header) => (
              <th key={header} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => (
            <tr key={proveedor.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.ruc}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.razonSocial}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.personaContacto}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.telefonos}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.email}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.direccion}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.departamento}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.distrito}</td>
              <td style={{ padding: '1rem 0.75rem' }}>{proveedor.actividadPrincipal}</td>
              <td style={{ padding: '1rem 0.75rem' }}>
                <Badge variant={estadoVariant(proveedor.estado)}>{proveedor.estado}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProveedoresTable;
