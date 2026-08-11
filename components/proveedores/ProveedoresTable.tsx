import type { EstadoSeguimiento, Proveedor, UserRole } from '../../types';
import { estadoSeguimientoActual, estadosEjecutiva, estadosSupervisor } from '../../services/providerWorkflow';
import Badge from '../shared/Badge';

interface Props {
  proveedores: Proveedor[];
  role?: UserRole;
  canEdit: boolean;
  onStatusChange: (id: string, estado: EstadoSeguimiento) => void;
}

function estadoVariant(estado: EstadoSeguimiento) {
  if (estado === 'Visita realizada' || estado === 'Formulario respondido') return 'success';
  if (estado === 'No encontrado' || estado === 'No se ubica' || estado === 'Visita no realizada' || estado === 'Desestimado') return 'danger';
  return 'warning';
}

function ProveedoresTable({ proveedores, role, canEdit, onStatusChange }: Props) {
  const esEjecutiva = role === 'ejecutiva';
  const opciones: EstadoSeguimiento[] = esEjecutiva ? estadosEjecutiva : estadosSupervisor;

  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            {['R.U.C', 'Razón social', 'Persona de contacto', 'Teléfonos', 'E-mail', 'Dirección', 'Departamento', 'Distrito', 'Actividad principal', 'Estado'].map((header) => (
              <th key={header} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => {
            const estadoActual = estadoSeguimientoActual(proveedor);
            const valorRol = esEjecutiva ? proveedor.estadoEjecutiva : proveedor.estadoSupervisor;
            return (
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
                  {canEdit ? (
                    <select aria-label={`Estado de ${proveedor.razonSocial}`} value={valorRol || opciones[0]} onChange={(event) => onStatusChange(proveedor.id, event.target.value as EstadoSeguimiento)}>
                      {opciones.map((estado) => <option key={estado}>{estado}</option>)}
                    </select>
                  ) : <Badge variant={estadoVariant(estadoActual)}>{estadoActual}</Badge>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {proveedores.length === 0 ? <p className="secondary-text" style={{ textAlign: 'center' }}>No se encontraron proveedores.</p> : null}
    </div>
  );
}

export default ProveedoresTable;
