import type { Request } from 'express';
export type UserRole = 'cliente' | 'ejecutiva' | 'supervisor_empresa' | 'supervisor_general';
export interface SessionUser { id: string; name: string; email: string; role: UserRole; empresaIds: string[] }
export interface AuthenticatedRequest extends Request { user: SessionUser }
