import type { EstadoEjecutiva, EstadoSeguimiento, EstadoSupervisor, Proveedor, ProveedorEstado } from '../types';

export const estadosEjecutiva: EstadoEjecutiva[] = [
  'Contactado',
  'No encontrado',
  'Formulario enviado',
  'Formulario respondido',
];

export const estadosSupervisor: EstadoSupervisor[] = [
  'En coordinación',
  'No se ubica',
  'Visita no realizada',
  'Desestimado',
  'Visita realizada',
];

export function esEstadoSupervisor(estado: EstadoSeguimiento): estado is EstadoSupervisor {
  return estadosSupervisor.includes(estado as EstadoSupervisor);
}

export const avancePorEstado: Record<EstadoSeguimiento, number> = {
  Contactado: 10,
  'No encontrado': 15,
  'Formulario enviado': 30,
  'Formulario respondido': 40,
  'En coordinación': 55,
  'No se ubica': 65,
  'Visita no realizada': 75,
  Desestimado: 85,
  'Visita realizada': 100,
};

export function estadoSeguimientoActual(proveedor: Proveedor): EstadoSeguimiento {
  return proveedor.estadoSupervisor || proveedor.estadoEjecutiva || 'Contactado';
}

export function avanceProveedor(proveedor: Proveedor) {
  return avancePorEstado[estadoSeguimientoActual(proveedor)];
}

export function estadoGeneralDesdeSeguimiento(estado: EstadoSeguimiento): ProveedorEstado {
  if (estado === 'Visita realizada') return 'Homologado';
  if (estado === 'No encontrado' || estado === 'No se ubica' || estado === 'Visita no realizada') return 'Observado';
  if (estado === 'Desestimado') return 'Vencido';
  return 'En proceso';
}

export function normalizarSeguimiento(proveedor: Proveedor): Proveedor {
  if (proveedor.estadoEjecutiva || proveedor.estadoSupervisor) return proveedor;
  if (proveedor.estado === 'Homologado') return { ...proveedor, estadoEjecutiva: 'Formulario respondido', estadoSupervisor: 'Visita realizada' };
  if (proveedor.estado === 'Observado') return { ...proveedor, estadoEjecutiva: 'Formulario respondido', estadoSupervisor: 'No se ubica' };
  if (proveedor.estado === 'Vencido') return { ...proveedor, estadoEjecutiva: 'Formulario respondido', estadoSupervisor: 'Desestimado' };
  return { ...proveedor, estadoEjecutiva: 'Formulario enviado' };
}
