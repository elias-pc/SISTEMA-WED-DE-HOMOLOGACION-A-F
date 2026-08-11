import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import { mapProcess } from '../mappers.js';
import { validateBody } from '../validation.js';
export const processesRouter = Router();
processesRouter.use(authenticateRequest);
processesRouter.get('/', async (request, response) => {
    const user = request.user;
    const result = user.role === 'supervisor_general'
        ? await pool.query('SELECT * FROM homologation_processes ORDER BY start_date DESC')
        : user.role === 'ejecutiva'
            ? await pool.query('SELECT * FROM homologation_processes WHERE executive_id=$1 OR company_id=ANY($2::text[]) ORDER BY start_date DESC', [user.id, user.empresaIds])
            : await pool.query('SELECT * FROM homologation_processes WHERE company_id=ANY($1::text[]) ORDER BY start_date DESC', [user.empresaIds]);
    response.json({ processes: result.rows.map(mapProcess) });
});
const schema = z.object({ id: z.string().min(2).max(80).optional(), empresaId: z.string().min(1), codigo: z.string().min(3).max(80), nombre: z.string().min(3).max(180), fechaInicio: z.string().date(), fechaLimite: z.string().date(), estado: z.enum(['Planificación', 'En curso', 'Suspendido', 'Finalizado']).default('Planificación'), ejecutivaId: z.string().min(1) }).refine(v => v.fechaLimite >= v.fechaInicio, { message: 'La fecha límite debe ser posterior al inicio.', path: ['fechaLimite'] });
processesRouter.post('/', requireRoles('supervisor_general'), validateBody(schema), async (request, response) => {
    const user = request.user, b = request.body;
    if (!canAccessCompany(user, b.empresaId))
        return response.status(403).json({ error: 'Empresa fuera de alcance.' });
    const result = await pool.query('INSERT INTO homologation_processes(id,company_id,code,name,start_date,deadline,status,executive_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [b.id || randomUUID(), b.empresaId, b.codigo, b.nombre, b.fechaInicio, b.fechaLimite, b.estado, b.ejecutivaId]);
    response.status(201).json({ process: mapProcess(result.rows[0]) });
});
