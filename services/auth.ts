import type { UserRole } from '../types';

export const roleLabels: Record<UserRole, string> = { cliente: 'Cliente', ejecutiva: 'Ejecutiva', administradora: 'Administrador', jefe_inspecciones: 'Jefe de inspectores', inspector: 'Inspector' };

export const routeRoles: Record<string, UserRole[]> = {
  '/': ['cliente', 'ejecutiva', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/proveedores': ['cliente', 'ejecutiva', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/mi-cartera': ['ejecutiva'],
  '/homologaciones': ['cliente', 'ejecutiva', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/reportes': ['ejecutiva', 'administradora', 'jefe_inspecciones', 'inspector'],
  '/configuracion': ['administradora'],
  '/carteras': ['administradora'],
  '/usuarios': ['administradora'],
  '/profile': ['cliente', 'ejecutiva', 'administradora', 'jefe_inspecciones', 'inspector'],
};
