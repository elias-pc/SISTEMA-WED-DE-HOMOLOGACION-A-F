import type { AuthUser, UserRole } from '../types';

export interface DemoUser extends AuthUser { password: string }

export const demoUsers: DemoUser[] = [
  { id: 'cli-decal', name: 'Cliente DECAL', email: 'cliente@decal.com', password: 'Cliente123', role: 'cliente', empresaIds: ['decal'] },
  { id: 'eje-decal', name: 'Ejecutiva DECAL', email: 'ejecutiva@decal.com', password: 'Ejecutiva123', role: 'ejecutiva', empresaIds: ['decal'] },
  { id: 'eje-decal-2', name: 'Ejecutiva DECAL 2', email: 'ejecutiva2@decal.com', password: 'Ejecutiva123', role: 'ejecutiva', empresaIds: ['decal'] },
  { id: 'sup-decal', name: 'Supervisor DECAL', email: 'supervisor@decal.com', password: 'Supervisor123', role: 'supervisor_empresa', empresaIds: ['decal'] },
  { id: 'cli-ufitec', name: 'Cliente UFITEC', email: 'cliente@ufitec.com', password: 'Cliente123', role: 'cliente', empresaIds: ['ufitec'] },
  { id: 'eje-ufitec', name: 'Ejecutiva UFITEC', email: 'ejecutiva@ufitec.com', password: 'Ejecutiva123', role: 'ejecutiva', empresaIds: ['ufitec'] },
  { id: 'sup-ufitec', name: 'Supervisor UFITEC', email: 'supervisor@ufitec.com', password: 'Supervisor123', role: 'supervisor_empresa', empresaIds: ['ufitec'] },
  { id: 'supervisor-general', name: 'Carlos Supervisor General', email: 'supervisor@af.com', password: 'super20226ayf', role: 'supervisor_general', empresaIds: [] },
  { id: 'admin-af', name: 'Administradora A&F', email: 'administradora@af.com', password: 'super20226ayf', role: 'administradora', empresaIds: [] },
];

const CUSTOM_USERS_KEY = 'af-custom-users-v1';

export function getAuthUsers(): DemoUser[] {
  try {
    const customUsers = JSON.parse(localStorage.getItem(CUSTOM_USERS_KEY) || '[]') as DemoUser[];
    return [...demoUsers, ...customUsers];
  } catch { return demoUsers; }
}

export function createClientUser(user: DemoUser) {
  const customUsers = getAuthUsers().filter((item) => !demoUsers.some((demo) => demo.id === item.id));
  localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify([...customUsers, user]));
}

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

export function authenticate(email: string, password: string): AuthUser | null {
  const match = getAuthUsers().find((item) => item.email === email.trim().toLowerCase() && item.password === password);
  if (!match) return null;
  const { password: _password, ...user } = match;
  return user;
}
