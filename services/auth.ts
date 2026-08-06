import type { AuthUser, UserRole } from '../types';

export interface DemoUser extends AuthUser { password: string }

export const demoUsers: DemoUser[] = [
  { id: '1', name: 'Cliente Demo', email: 'cliente@af.com', password: 'Cliente123', role: 'cliente' },
  { id: '2', name: 'Ana Ejecutiva', email: 'ejecutiva@af.com', password: 'Ejecutiva123', role: 'ejecutiva' },
  { id: '3', name: 'Carlos Supervisor', email: 'supervisor@af.com', password: 'Supervisor123', role: 'supervisor' },
];

export const roleLabels: Record<UserRole, string> = { cliente: 'Cliente', ejecutiva: 'Ejecutiva', supervisor: 'Supervisor' };

export const routeRoles: Record<string, UserRole[]> = {
  '/': ['cliente', 'ejecutiva', 'supervisor'],
  '/proveedores': ['ejecutiva', 'supervisor'],
  '/homologaciones': ['cliente', 'ejecutiva', 'supervisor'],
  '/homologadas': ['cliente', 'ejecutiva', 'supervisor'],
  '/reportes': ['ejecutiva', 'supervisor'],
  '/configuracion': ['supervisor'],
  '/profile': ['cliente', 'ejecutiva', 'supervisor'],
};

export function authenticate(email: string, password: string): AuthUser | null {
  const match = demoUsers.find((item) => item.email === email.trim().toLowerCase() && item.password === password);
  if (!match) return null;
  const { password: _password, ...user } = match;
  return user;
}
