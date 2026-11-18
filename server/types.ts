import type { Request } from 'express';
export type UserRole = 'cliente' | 'ejecutiva' | 'administradora' | 'jefe_inspecciones' | 'inspector';
export interface SessionUser { id: string; name: string; email: string; role: UserRole; empresaIds: string[] }
export interface AuthenticatedRequest extends Request { user: SessionUser }
