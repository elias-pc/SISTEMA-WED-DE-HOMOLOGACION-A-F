import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import { mapProvider } from '../mappers.js';
import { validateBody } from '../validation.js';
import { canUpdateStatus } from '../authorization.js';
export const providersRouter = Router();
providersRouter.use(authenticateRequest);
const executiveStatuses = ['Contactado', 'No encontrado', 'Formulario enviado', 'Formulario respondido'];
const supervisorStatuses = ['En coordinación', 'No se ubica', 'Visita no realizada', 'Desestimado', 'Visita realizada'];
const generalStatus = (status) => status === 'Visita realizada' ? 'Homologado' : status === 'Desestimado' ? 'Vencido' : ['No encontrado', 'No se ubica', 'Visita no realizada'].includes(status) ? 'Observado' : 'En proceso';
providersRouter.get('/', async (request, response) => {
    const user = request.user;
    const processId = z.string().min(1).safeParse(request.query.processId);
    if (!processId.success)
        return response.status(400).json({ error: 'Debes indicar un proceso.' });
    const process = await pool.query('SELECT company_id,executive_id FROM homologation_processes WHERE id=$1', [processId.data]);
    if (!process.rowCount)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    const scope = process.rows[0];
    if (!canAccessCompany(user, scope.company_id) && !(user.role === 'ejecutiva' && scope.executive_id === user.id))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const result = await pool.query('SELECT * FROM providers WHERE process_id=$1 ORDER BY created_at DESC', [processId.data]);
    response.json({ providers: result.rows.map(mapProvider) });
});
const createSchema = z.object({ id: z.string().optional(), empresaId: z.string().min(1), procesoId: z.string().min(1), razonSocial: z.string().min(2).max(180), ruc: z.string().regex(/^\d{11}$/), personaContacto: z.string().min(2).max(120), telefonos: z.string().min(6).max(80), email: z.string().email(), direccion: z.string().min(3).max(240), departamento: z.string().min(2).max(80), distrito: z.string().min(2).max(80), actividadPrincipal: z.string().min(2).max(240) });
providersRouter.post('/', requireRoles('ejecutiva', 'supervisor_empresa', 'supervisor_general'), validateBody(createSchema), async (request, response) => {
    const user = request.user, b = request.body;
    const process = await pool.query('SELECT company_id,executive_id FROM homologation_processes WHERE id=$1', [b.procesoId]);
    if (!process.rowCount || process.rows[0].company_id !== b.empresaId)
        return response.status(400).json({ error: 'El proceso no pertenece a la empresa indicada.' });
    if (!canAccessCompany(user, b.empresaId) && !(user.role === 'ejecutiva' && process.rows[0].executive_id === user.id))
        return response.status(403).json({ error: 'Empresa fuera de tu alcance.' });
    const result = await pool.query(`INSERT INTO providers(id,company_id,process_id,legal_name,tax_id,contact_name,phones,email,address,department,district,main_activity,executive_status)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Contactado') RETURNING *`, [b.id || randomUUID(), b.empresaId, b.procesoId, b.razonSocial, b.ruc, b.personaContacto, b.telefonos, b.email, b.direccion, b.departamento, b.distrito, b.actividadPrincipal]);
    response.status(201).json({ provider: mapProvider(result.rows[0]) });
});
const statusSchema = z.object({ estado: z.enum([...executiveStatuses, ...supervisorStatuses]) });
providersRouter.patch('/:id/status', requireRoles('ejecutiva', 'supervisor_empresa', 'supervisor_general'), validateBody(statusSchema), async (request, response) => {
    const user = request.user, status = request.body.estado;
    const found = await pool.query(`SELECT p.company_id,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    const row = found.rows[0], isExecutive = user.role === 'ejecutiva';
    if (!canAccessCompany(user, row.company_id) && !(isExecutive && row.executive_id === user.id))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    if (!canUpdateStatus(user.role, status))
        return response.status(403).json({ error: isExecutive ? 'La ejecutiva solo puede actualizar estados de contacto y formulario.' : 'Los supervisores solo pueden actualizar estados de coordinación y visita.' });
    const column = isExecutive ? 'executive_status' : 'supervisor_status';
    const result = await pool.query(`UPDATE providers SET ${column}=$1,status=$2,updated_at=now() WHERE id=$3 RETURNING *`, [status, generalStatus(status), request.params.id]);
    response.json({ provider: mapProvider(result.rows[0]) });
});
