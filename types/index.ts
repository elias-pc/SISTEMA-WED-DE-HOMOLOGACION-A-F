export type ProveedorEstado = 'Homologado' | 'En proceso' | 'Observado' | 'Vencido';

export interface Proveedor {
  id: string;
  empresaId: string;
  procesoId: string;
  razonSocial: string;
  ruc: string;
  personaContacto: string;
  telefonos: string;
  email: string;
  direccion: string;
  departamento: string;
  distrito: string;
  actividadPrincipal: string;
  estado: ProveedorEstado;
  calificacion: number;
  fechaRegistro: string;
  vigencia: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  description?: string;
}

export type UserRole = 'cliente' | 'ejecutiva' | 'supervisor_empresa' | 'supervisor_general';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  empresaIds: string[];
}

export type EmpresaEstado = 'Activa' | 'Inactiva' | 'Archivada';
export type ProcesoEstado = 'Planificación' | 'En curso' | 'Suspendido' | 'Finalizado';

export interface Empresa {
  id: string;
  razonSocial: string;
  ruc: string;
  nombreComercial: string;
  contacto: string;
  email: string;
  telefono: string;
  estado: EmpresaEstado;
}

export interface ProcesoHomologacion {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaLimite: string;
  estado: ProcesoEstado;
  ejecutivaId: string;
}
