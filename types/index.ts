export type ProveedorEstado = 'Homologado' | 'En proceso' | 'Observado' | 'Vencido';

export interface Proveedor {
  id: string;
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
