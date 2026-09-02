export type ProveedorEstado = 'Homologado' | 'En proceso' | 'Observado' | 'Vencido';
export type EstadoEjecutiva = 'Contactado' | 'No encontrado' | 'Formulario enviado' | 'Formulario respondido';
export type EstadoSupervisor = 'En coordinación' | 'No se ubica' | 'Visita no realizada' | 'Desestimado' | 'Visita realizada';
export type EstadoSeguimiento = EstadoEjecutiva | EstadoSupervisor;

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
  estadoEjecutiva?: EstadoEjecutiva;
  estadoSupervisor?: EstadoSupervisor;
  calificacion: number;
  fechaRegistro: string;
  vigencia: string;
  flujo?: FlujoProveedor;
  ejecutivaAsignadaId?: string;
  inspectorAsignadoId?: string;
  transicionesDisponibles?: TransicionDisponible[];
}

export interface DashboardMetric {
  label: string;
  value: string;
  description?: string;
}

export type UserRole = 'cliente' | 'ejecutiva' | 'supervisor_empresa' | 'supervisor_general' | 'administradora' | 'jefe_inspecciones' | 'inspector';

export type EstadoFlujoProveedor = 'PENDIENTE_INSCRIPCION' | 'INSCRITO' | 'HOMOLOGADO';
export interface FlujoProveedor { paso: number; estado: EstadoFlujoProveedor; subestado: string; version: number }
export interface TransicionDisponible { codigo: string; etiqueta: string; datosObligatorios: string[] }

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
