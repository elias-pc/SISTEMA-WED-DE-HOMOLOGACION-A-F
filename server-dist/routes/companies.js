import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { mapCompany } from '../mappers.js';
import { validateBody } from '../validation.js';
export const companiesRouter = Router();
companiesRouter.use(authenticateRequest);
companiesRouter.get('/', async (request, response) => {
    const user = request.user;
    const result = user.role === 'supervisor_general'
        ? await pool.query('SELECT * FROM companies ORDER BY trade_name')
        : await pool.query('SELECT c.* FROM companies c JOIN user_companies uc ON uc.company_id=c.id WHERE uc.user_id=$1 ORDER BY c.trade_name', [user.id]);
    response.json({ companies: result.rows.map(mapCompany) });
});
const schema = z.object({ id: z.string().trim().min(2).max(60).optional(), razonSocial: z.string().trim().min(2).max(180), ruc: z.string().regex(/^\d{11}$/), nombreComercial: z.string().trim().min(2).max(120), contacto: z.string().trim().min(2).max(120), email: z.string().email(), telefono: z.string().trim().min(6).max(40), estado: z.enum(['Activa', 'Inactiva', 'Archivada']).default('Activa') });
companiesRouter.post('/', requireRoles('supervisor_general'), validateBody(schema), async (request, response) => {
    const b = request.body;
    const id = b.id || randomUUID();
    const result = await pool.query('INSERT INTO companies(id,legal_name,tax_id,trade_name,contact_name,email,phone,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [id, b.razonSocial, b.ruc, b.nombreComercial, b.contacto, b.email, b.telefono, b.estado]);
    response.status(201).json({ company: mapCompany(result.rows[0]) });
});
