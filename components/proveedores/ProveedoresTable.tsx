import type { Proveedor } from '../../types';
import { estadoSeguimientoActual } from '../../services/providerWorkflow';
import Badge from '../shared/Badge';

interface Props {
  proveedores: Proveedor[];
  onSelect: (provider: Proveedor) => void;
}

function estadoVariant(estado: string) {
  if (estado === 'Visita realizada' || estado === 'Formulario respondido' || estado === 'VIGENTE' || estado === 'CERTIFICADO_EXISTENTE') return 'success';
  if (['No encontrado', 'No se ubica', 'Visita no realizada', 'Desestimado', 'DATOS_INCOMPLETOS', 'NO_ES_PROVEEDOR', 'NO_UBICADO', 'NO_RESPONDE', 'DESESTIMADO', 'NO_PARTICIPA', 'VISITA_DESESTIMADA', 'VENCIDO'].includes(estado)) return 'danger';
  return 'warning';
}

function ProveedoresTable({ proveedores, onSelect }: Props) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
        <thead>
          <tr>
            {['R.U.C', 'Razón social', 'Contacto', 'Teléfonos', 'E-mail', 'Distrito', 'Estado formal', 'Acción'].map((header) => (
              <th key={header} style={{ textAlign: 'left', padding: '1rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => {
            const estadoActual = proveedor.flujo?.subestado || estadoSeguimientoActual(proveedor);
            return (
              <tr key={proveedor.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.ruc}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.razonSocial}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.personaContacto}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.telefonos}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.email}</td>
                <td style={{ padding: '1rem 0.75rem' }}>{proveedor.distrito}</td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  {proveedor.flujo ? (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <Badge variant={estadoVariant(estadoActual)}>{estadoActual.split('_').join(' ')}</Badge>
                      <small className="secondary-text">Paso {proveedor.flujo.paso} · v{proveedor.flujo.version}</small>
                    </div>
                  ) : <Badge variant={estadoVariant(estadoActual)}>{estadoActual}</Badge>}
                </td>
                <td style={{ padding: '1rem 0.75rem' }}><button type="button" className="btn-secondary table-action" onClick={() => onSelect(proveedor)}>Abrir expediente</button></td>
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
