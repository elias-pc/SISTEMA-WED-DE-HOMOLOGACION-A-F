import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, requireRoles } from '../middleware/auth.js';
import { mapCompany } from '../mappers.js';
import type { AuthenticatedRequest } from '../types.js';
import { validateBody } from '../validation.js';
import { normalizeHomologationConfig } from '../homologation-config.js';
export const companiesRouter = Router();
companiesRouter.use(authenticateRequest);
companiesRouter.get('/', async (request, response) => {
 const user = (request as AuthenticatedRequest).user;
 const result = user.role === 'supervisor_general' || user.role === 'administradora'
  ? await pool.query('SELECT * FROM companies ORDER BY trade_name')
  : await pool.query('SELECT c.* FROM companies c JOIN user_companies uc ON uc.company_id=c.id WHERE uc.user_id=$1 ORDER BY c.trade_name', [user.id]);
 response.json({ companies: result.rows.map(mapCompany) });
});
const parameterSchema = z.object({
 filters: z.array(z.string().trim().min(1).max(60)).max(2).default([]),
 documentTypes: z.array(z.object({ name: z.string().trim().min(1).max(80), validityDays: z.number().int().min(1).max(3650) })).min(1).max(12),
 opinions: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
 evaluationModules: z.array(z.string().trim().min(1).max(100)).min(1).max(30),
});
const schema = z.object({ id: z.string().trim().min(2).max(60).optional(), razonSocial: z.string().trim().min(2).max(180), ruc: z.string().regex(/^\d{11}$/), nombreComercial: z.string().trim().min(2).max(120), contacto: z.string().trim().min(2).max(120), email: z.string().email(), telefono: z.string().trim().min(6).max(40), estado: z.enum(['Activa','Inactiva','Archivada']).default('Activa'), configuracionHomologacion: parameterSchema.optional() });
companiesRouter.post('/', requireRoles('supervisor_general','administradora'), validateBody(schema), async (request, response) => {
 const b=request.body; const id=b.id || randomUUID();
 const configuration=normalizeHomologationConfig(b.configuracionHomologacion);
 const result=await pool.query('INSERT INTO companies(id,legal_name,tax_id,trade_name,contact_name,email,phone,status,homologation_config) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *',[id,b.razonSocial,b.ruc,b.nombreComercial,b.contacto,b.email,b.telefono,b.estado,JSON.stringify(configuration)]);
 response.status(201).json({ company: mapCompany(result.rows[0]) });
});
