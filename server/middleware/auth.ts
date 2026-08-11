import type { NextFunction, Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { hashToken, SESSION_COOKIE } from '../security.js';
import type { AuthenticatedRequest, SessionUser, UserRole } from '../types.js';

export async function authenticateRequest(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return response.status(401).json({ error: 'Autenticación requerida.' });
  const result = await pool.query(`SELECT u.id,u.name,u.email,u.role,
    COALESCE(array_agg(uc.company_id) FILTER (WHERE uc.company_id IS NOT NULL), '{}') AS company_ids
    FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN user_companies uc ON uc.user_id=u.id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true GROUP BY u.id`, [hashToken(token)]);
  if (!result.rowCount) return response.status(401).json({ error: 'La sesión expiró o no es válida.' });
  const row = result.rows[0];
  (request as AuthenticatedRequest).user = { id: row.id, name: row.name, email: row.email, role: row.role, empresaIds: row.company_ids };
  await pool.query('UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1', [hashToken(token)]);
  next();
}

export function requireRoles(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!roles.includes((request as AuthenticatedRequest).user.role)) return response.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    next();
  };
}

export function canAccessCompany(user: SessionUser, companyId: string) {
  return user.role === 'supervisor_general' || user.empresaIds.includes(companyId);
}
