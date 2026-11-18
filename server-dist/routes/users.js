import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import { validateBody } from '../validation.js';
export const usersRouter = Router();
usersRouter.use(authenticateRequest);
usersRouter.get('/', requireRoles('administradora', 'jefe_inspecciones'), async (request, response) => {
    const companyId = z.string().min(1).safeParse(request.query.empresaId);
    if (!companyId.success)
        return response.status(400).json({ error: 'Debes indicar una empresa.' });
    const user = request.user;
    if (!canAccessCompany(user, companyId.data))
        return response.status(403).json({ error: 'Empresa fuera de tu alcance.' });
    const result = await pool.query(`SELECT u.id,u.name,u.email,u.role FROM users u JOIN user_companies uc ON uc.user_id=u.id WHERE uc.company_id=$1 AND u.active=true ORDER BY u.name`, [companyId.data]);
    response.json({ users: result.rows.map((row) => ({ ...row, empresaIds: [companyId.data] })) });
});
usersRouter.get('/executives', requireRoles('administradora'), async (_request, response) => {
    const result = await pool.query(`SELECT u.id,u.name,u.email,u.role,
  COALESCE(array_agg(uc.company_id ORDER BY uc.company_id) FILTER (WHERE uc.company_id IS NOT NULL),'{}') AS "empresaIds"
  FROM users u LEFT JOIN user_companies uc ON uc.user_id=u.id
  WHERE u.role='ejecutiva' AND u.active=true GROUP BY u.id ORDER BY u.name`);
    response.json({ users: result.rows });
});
const internalRoles = ['ejecutiva', 'jefe_inspecciones', 'inspector'];
const companyLinksSchema = z.object({ empresaIds: z.array(z.string().min(1)).min(1).refine((ids) => new Set(ids).size === ids.length, 'No repitas empresas.') });
usersRouter.patch('/:userId/companies', requireRoles('administradora'), validateBody(companyLinksSchema), async (request, response) => {
    const userId = String(request.params.userId), { empresaIds } = request.body, client = await pool.connect();
    try {
        await client.query('BEGIN');
        const target = await client.query('SELECT id,role,active FROM users WHERE id=$1 FOR UPDATE', [userId]);
        if (!target.rowCount || !internalRoles.includes(target.rows[0].role) || !target.rows[0].active) {
            await client.query('ROLLBACK');
            return response.status(404).json({ error: 'No se encontró un usuario interno activo.' });
        }
        const companyCheck = await client.query('SELECT id FROM companies WHERE id=ANY($1::text[])', [empresaIds]);
        if (companyCheck.rowCount !== empresaIds.length) {
            await client.query('ROLLBACK');
            return response.status(422).json({ error: 'Una o más empresas no existen.' });
        }
        const current = await client.query('SELECT company_id FROM user_companies WHERE user_id=$1', [userId]);
        const selected = new Set(empresaIds), removed = current.rows.map((row) => row.company_id).filter((id) => !selected.has(id));
        if (removed.length) {
            const active = await client.query(`SELECT COUNT(*)::int AS total FROM provider_assignments a
    JOIN providers p ON p.id=a.provider_id JOIN homologation_processes hp ON hp.id=p.process_id
    WHERE a.assigned_user_id=$1 AND a.assignment_role='ejecutiva' AND a.released_at IS NULL AND hp.company_id=ANY($2::text[])`, [userId, removed]);
            if (active.rows[0].total > 0) {
                await client.query('ROLLBACK');
                return response.status(409).json({ error: `No se puede quitar esa empresa: la ejecutiva conserva ${active.rows[0].total} proveedor(es) asignado(s). Reasígnalos o retíralos primero.` });
            }
        }
        if (removed.length)
            await client.query('DELETE FROM user_companies WHERE user_id=$1 AND company_id=ANY($2::text[])', [userId, removed]);
        await client.query(`INSERT INTO user_companies(user_id,company_id) SELECT $1,company_id FROM unnest($2::text[]) AS selected(company_id) ON CONFLICT DO NOTHING`, [userId, empresaIds]);
        await client.query('COMMIT');
        response.json({ user: { ...target.rows[0], empresaIds } });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
const schema = z.object({ id: z.string().optional(), name: z.string().min(2).max(120), email: z.string().email(), password: z.string().min(8).max(128), role: z.enum(['cliente', 'ejecutiva', 'jefe_inspecciones', 'inspector']), empresaIds: z.array(z.string()).min(1) });
usersRouter.post('/', requireRoles('administradora'), validateBody(schema), async (request, response) => {
    const b = request.body, id = b.id || randomUUID(), hash = await bcrypt.hash(b.password, 12), client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)', [id, b.name, b.email.toLowerCase(), hash, b.role]);
        for (const companyId of b.empresaIds)
            await client.query('INSERT INTO user_companies(user_id,company_id) VALUES($1,$2)', [id, companyId]);
        await client.query('COMMIT');
        response.status(201).json({ user: { id, name: b.name, email: b.email.toLowerCase(), role: b.role, empresaIds: b.empresaIds } });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
// Usuarios internos de A&F (ejecutivas, jefes de inspectores e inspectores): solo el administrador los gestiona.
usersRouter.get('/internal', requireRoles('administradora'), async (_request, response) => {
    const result = await pool.query(`SELECT u.id,u.name,u.email,u.role,u.active,
  COALESCE(array_agg(uc.company_id ORDER BY uc.company_id) FILTER (WHERE uc.company_id IS NOT NULL),'{}') AS "empresaIds"
  FROM users u LEFT JOIN user_companies uc ON uc.user_id=u.id
  WHERE u.role = ANY($1::user_role[]) GROUP BY u.id ORDER BY u.active DESC,u.role,u.name`, [internalRoles]);
    response.json({ users: result.rows });
});
const updateSchema = z.object({ name: z.string().trim().min(2).max(120).optional(), email: z.string().trim().email().optional(), active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, 'No hay cambios.');
usersRouter.patch('/:userId', requireRoles('administradora'), validateBody(updateSchema), async (request, response) => {
    const userId = String(request.params.userId), body = request.body;
    const target = await pool.query('SELECT id,role,active FROM users WHERE id=$1', [userId]);
    if (!target.rowCount || !internalRoles.includes(target.rows[0].role))
        return response.status(404).json({ error: 'Usuario interno no encontrado.' });
    if (body.active === false && target.rows[0].active) {
        const pending = await pool.query(`SELECT
    (SELECT COUNT(*)::int FROM provider_assignments WHERE assigned_user_id=$1 AND assignment_role='ejecutiva' AND released_at IS NULL) AS ejecutiva,
    (SELECT COUNT(*)::int FROM providers WHERE assigned_inspector_id=$1 AND current_step=7) AS inspector`, [userId]);
        const total = Number(pending.rows[0].ejecutiva) + Number(pending.rows[0].inspector);
        if (total > 0)
            return response.status(409).json({ error: `No se puede desactivar: tiene ${total} proveedor(es) asignado(s) en curso. Reasígnalos primero.` });
    }
    if (body.email) {
        const taken = await pool.query('SELECT 1 FROM users WHERE lower(email)=lower($1) AND id<>$2', [body.email, userId]);
        if (taken.rowCount)
            return response.status(409).json({ error: 'Ese correo ya está en uso.' });
    }
    const result = await pool.query(`UPDATE users SET name=COALESCE($2,name),email=COALESCE(lower($3),email),active=COALESCE($4,active) WHERE id=$1 RETURNING id,name,email,role,active`, [userId, body.name ?? null, body.email ?? null, body.active ?? null]);
    if (body.active === false)
        await pool.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
    response.json({ user: result.rows[0] });
});
const passwordSchema = z.object({ password: z.string().min(8).max(128) });
usersRouter.post('/:userId/password', requireRoles('administradora'), validateBody(passwordSchema), async (request, response) => {
    const userId = String(request.params.userId), { password } = request.body;
    const target = await pool.query('SELECT id,role FROM users WHERE id=$1', [userId]);
    if (!target.rowCount || !internalRoles.includes(target.rows[0].role))
        return response.status(404).json({ error: 'Usuario interno no encontrado.' });
    await pool.query('UPDATE users SET password_hash=$2 WHERE id=$1', [userId, await bcrypt.hash(password, 12)]);
    await pool.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
    response.json({ ok: true });
});
