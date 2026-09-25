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

export interface HistorialFlujo {
  id: string;
  transition_code: string;
  from_step: number;
  from_status: string;
  from_substatus: string;
  to_step: number;
  to_status: string;
  to_substatus: string;
  actor_role: string;
  reason?: string | null;
  created_at: string;
}

export interface ExpedienteProveedor {
  assignments: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  forms: Array<Record<string, unknown>>;
  inspections: Array<Record<string, unknown>>;
  documents: Array<{id:string;category:string;original_name:string;mime_type:string;byte_size:number;expires_on?:string|null;created_at:string}>;
  certificates: Array<Record<string, unknown>>;
  contactPreferences: {whatsapp_phone?:string|null;whatsapp_opt_in:boolean;whatsapp_opt_in_source?:string|null}|null;
  notifications: Array<Record<string, unknown>>;
}

export interface ImportPreviewRow { rowNumber:number; errors:string[]; provider?: Partial<Proveedor> }
export interface ImportPreview { summary:{totalRows:number;readyRows:number;rejectedRows:number}; rows:ImportPreviewRow[]; batchId?:string }
export interface DashboardResumen {
  total:number;
  homologados:number;
  inscritos:number;
  pendientes:number;
  sin_respuesta:number;
  no_participan:number;
  datos_incompletos:number;
  desestimados:number;
  no_son_proveedores:number;
  por_vencer:number;
  vencidos:number;
}
export interface ReporteOperativo { type:string; columns:string[]; rows:unknown[][] }

export interface DocumentoEntregable {
  id:string;
  originalName:string;
  mimeType:string;
  byteSize:number;
}

export interface EstadoProveedorReporte {
  id:string;
  ruc:string;
  razonSocial:string;
  tipoDocumento:string;
  filtro1:string;
  estado:string;
  subestado:string;
  dictamen:string;
  puntajeFinalPonderado:number|null;
  fechaEmision:string|null;
  fechaVencimiento:string|null;
  diasPorVencer:number|null;
  entregables:string;
  documentosEntregables:DocumentoEntregable[];
}
export interface ReporteEstadoProveedores { rows:EstadoProveedorReporte[] }

export interface CarteraEjecutivaResumen { id:string; name:string; email:string; activeCount:number }
export interface ProveedorCartera {
  id:string; legal_name:string; tax_id:string; assignedExecutives:Array<{id:string;name:string}>;
  current_step:number; workflow_status:string; workflow_substatus:string; updated_at:string;
}
export interface HistorialAsignacion {
  id:string; provider_id:string; provider_name:string; assigned_user_id:string; assigned_user_name:string;
  assigned_by_user_id:string; assigned_by_name:string; assigned_at:string; released_at?:string|null;
  released_by_user_id?:string|null; released_by_name?:string|null; reason?:string|null; release_reason?:string|null;
}
export interface ResumenCartera { executives:CarteraEjecutivaResumen[]; unassignedCount:number; providers:ProveedorCartera[]; history:HistorialAsignacion[] }
export interface ResultadoAsignacion { assigned?:number; reassigned?:number; unassigned?:number; unchanged:number; total?:number }
export type CategoriaMiCartera = 'nuevos' | 'gestion' | 'prioritarios';
export interface ProveedorMiCartera {
  id:string; razonSocial:string; ruc:string; paso:number; estado:string; subestado:string;
  fechaAsignacion:string|null; fechaVencimiento:string|null; categoria:CategoriaMiCartera; alerta:string|null;
}
export interface ResumenMiCartera {
  summary:{total:number;newToday:number;newWeek:number;inProgress:number;priority:number};
  providers:ProveedorMiCartera[];
}
export interface ProductividadEjecutiva {
  executiveId:string; executiveName:string; currentPortfolio:number; assignedInPeriod:number; contacts:number;
  formsSent:number; formsReturned:number; visitsCoordinated:number; homologated:number; pending:number;
  averageHoursByStep:Record<string,number>;
}
export interface ReporteProductividad { from:string; to:string; rows:ProductividadEjecutiva[] }

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
  ejecutivaId?: string;
}
