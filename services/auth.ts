import type { UserRole } from '../types';

export const roleLabels: Record<UserRole, string> = { cliente: 'Cliente', ejecutiva: 'Ejecutiva', supervisor_empresa: 'Supervisor de empresa', supervisor_general: 'Supervisor general', administradora: 'Administradora', jefe_inspecciones: 'Jefe de inspecciones', inspector: 'Inspector' };

export const routeRoles: Record<string, UserRole[]> = {
  '/': ['cliente', 'ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/proveedores': ['cliente', 'ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/homologaciones': ['cliente', 'ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/homologadas': ['ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/reportes': ['ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/configuracion': ['supervisor_general', 'administradora'],
  '/carteras': ['supervisor_general', 'administradora'],
  '/profile': ['cliente', 'ejecutiva', 'supervisor_empresa', 'supervisor_general', 'administradora', 'jefe_inspecciones', 'inspector'],
};
