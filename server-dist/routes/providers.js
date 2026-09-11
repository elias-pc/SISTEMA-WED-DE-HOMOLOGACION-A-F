import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import { mapProvider } from '../mappers.js';
import { validateBody } from '../validation.js';
import { availableTransitions, legacyProviderStatus, transitionCodes, validateTransition, } from '../workflow.js';
import { readLocalDocument, storeLocalDocument } from '../document-storage.js';
import { persistTransitionRecords, providerDossier } from '../provider-records.js';
import { parseProviderWorkbook } from '../provider-import.js';
export const providersRouter = Router();
providersRouter.use(authenticateRequest);
providersRouter.get('/', async (request, response) => {
    const user = request.user;
    const processId = z.string().min(1).safeParse(request.query.processId);
    if (!processId.success)
        return response.status(400).json({ error: 'Debes indicar un proceso.' });
    const process = await pool.query('SELECT company_id,executive_id FROM homologation_processes WHERE id=$1', [processId.data]);
    if (!process.rowCount)
        return response.status(404).json({ error: 'Proceso no encontrado.' });
    const scope = process.rows[0];
    if (!canAccessCompany(user, scope.company_id))
        return response.status(403).json({ error: 'Proceso fuera de tu alcance.' });
    const result = await pool.query('SELECT * FROM providers WHERE process_id=$1 ORDER BY created_at DESC', [processId.data]);
    const visibleRows = result.rows.filter((row) => canAccessProvider(user, row));
    response.json({ providers: visibleRows.map((row) => {
            const provider = mapProvider(row);
            const state = workflowStateFromRow(row);
            return { ...provider, transicionesDisponibles: availableTransitions(state, user.role).map(publicTransition) };
        }) });
});
function workflowStateFromRow(row) {
    return { step: Number(row.current_step), status: row.workflow_status, substatus: row.workflow_substatus };
}
function publicTransition(transition) {
    return { codigo: transition.code, etiqueta: transition.label, datosObligatorios: [...(transition.requiredFields || [])] };
}
const createSchema = z.object({ id: z.string().optional(), empresaId: z.string().min(1), procesoId: z.string().min(1), razonSocial: z.string().min(2).max(180), ruc: z.string().regex(/^\d{11}$/), personaContacto: z.string().min(2).max(120), telefonos: z.string().min(6).max(80), email: z.string().email(), direccion: z.string().min(3).max(240), departamento: z.string().min(2).max(80), distrito: z.string().min(2).max(80), actividadPrincipal: z.string().min(2).max(240) });
providersRouter.post('/', requireRoles('supervisor_general', 'administradora'), validateBody(createSchema), async (request, response) => {
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
providersRouter.patch('/:id/status', (_request, response) => response.status(410).json({ error: 'El cambio libre de estado fue retirado. Utiliza una transición válida del flujo.' }));
const transitionSchema = z.object({
    transicion: z.enum(transitionCodes),
    datos: z.record(z.string(), z.unknown()).default({}),
    motivo: z.string().trim().min(3).max(1000).optional(),
    version: z.number().int().nonnegative().optional(),
});
const importSchema = z.object({ empresaId: z.string().min(1), procesoId: z.string().min(1), fileName: z.string().trim().min(1).max(180), contentBase64: z.string().min(4).max(3_000_000) });
async function importScope(request, empresaId, procesoId) {
    const process = await pool.query('SELECT company_id,executive_id FROM homologation_processes WHERE id=$1', [procesoId]);
    if (!process.rowCount || process.rows[0].company_id !== empresaId)
        return { error: 'El proceso no pertenece a la empresa indicada.' };
    if (!canAccessCompany(request.user, empresaId))
        return { error: 'Empresa fuera de tu alcance.' };
    return { companyId: empresaId };
}
async function rowsWithExistingRucErrors(processId, contentBase64) {
    const rows = parseProviderWorkbook(contentBase64);
    const rucs = rows.flatMap((row) => row.provider ? [row.provider.ruc] : []);
    const existing = rucs.length ? await pool.query('SELECT tax_id FROM providers WHERE process_id=$1 AND tax_id=ANY($2::varchar[])', [processId, rucs]) : { rows: [] };
    const existingRucs = new Set(existing.rows.map((row) => row.tax_id));
    return rows.map((row) => {
        if (row.provider && existingRucs.has(row.provider.ruc))
            return { ...row, provider: undefined, errors: [...row.errors, 'El RUC ya existe en este proceso.'] };
        return row;
    });
}
function importSummary(rows) {
    const imported = rows.filter((row) => row.provider && row.errors.length === 0).length;
    return { totalRows: rows.length, readyRows: imported, rejectedRows: rows.length - imported };
}
providersRouter.post('/import/preview', requireRoles('supervisor_general', 'administradora'), validateBody(importSchema), async (request, response) => {
    const user = request, body = request.body;
    const scope = await importScope(user, body.empresaId, body.procesoId);
    if ('error' in scope)
        return response.status(400).json(scope);
    try {
        const rows = await rowsWithExistingRucErrors(body.procesoId, body.contentBase64);
        response.json({ summary: importSummary(rows), rows: rows.map(({ raw, ...row }) => row) });
    }
    catch (error) {
        response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.' });
    }
});
providersRouter.post('/import', requireRoles('supervisor_general', 'administradora'), validateBody(importSchema), async (request, response) => {
    const user = request, body = request.body;
    const scope = await importScope(user, body.empresaId, body.procesoId);
    if ('error' in scope)
        return response.status(400).json(scope);
    let rows;
    try {
        rows = await rowsWithExistingRucErrors(body.procesoId, body.contentBase64);
    }
    catch (error) {
        return response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const batchId = randomUUID();
        const summary = importSummary(rows);
        await client.query(`INSERT INTO provider_import_batches(id,company_id,process_id,file_name,total_rows,imported_rows,rejected_rows,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [batchId, body.empresaId, body.procesoId, body.fileName, summary.totalRows, summary.readyRows, summary.rejectedRows, user.user.id]);
        for (const row of rows) {
            let providerId = null;
            if (row.provider && row.errors.length === 0) {
                providerId = randomUUID();
                const provider = row.provider;
                await client.query(`INSERT INTO providers(id,company_id,process_id,legal_name,tax_id,contact_name,phones,email,address,department,district,main_activity) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [providerId, body.empresaId, body.procesoId, provider.razonSocial, provider.ruc, provider.personaContacto, provider.telefonos, provider.email, provider.direccion, provider.departamento, provider.distrito, provider.actividadPrincipal]);
                for (const [key, value] of Object.entries(provider.attributes))
                    await client.query(`INSERT INTO provider_attributes(provider_id,attribute_key,attribute_value) VALUES($1,$2,$3)`, [providerId, key, value]);
            }
            await client.query(`INSERT INTO provider_import_rows(id,batch_id,row_number,raw_data,status,errors,provider_id) VALUES($1,$2,$3,$4::jsonb,$5,$6::jsonb,$7)`, [randomUUID(), batchId, row.rowNumber, JSON.stringify(row.raw), providerId ? 'IMPORTADA' : 'RECHAZADA', JSON.stringify(row.errors), providerId]);
        }
        await client.query('COMMIT');
        response.status(201).json({ batchId, summary, rows: rows.map(({ raw, ...row }) => row) });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
providersRouter.get('/:id/workflow', async (request, response) => {
    const user = request.user;
    const found = await pool.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    const row = found.rows[0];
    if (!canAccessProvider(user, row))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    const history = await pool.query(`SELECT id,transition_code,from_step,from_status,from_substatus,to_step,to_status,to_substatus,actor_user_id,actor_role,reason,metadata,created_at FROM provider_status_history WHERE provider_id=$1 ORDER BY created_at DESC`, [request.params.id]);
    const state = workflowStateFromRow(row);
    response.json({ provider: mapProvider(row), transicionesDisponibles: availableTransitions(state, user.role).map(publicTransition), historial: history.rows });
});
providersRouter.get('/:id/dossier', async (request, response) => {
    const user = request.user;
    const found = await pool.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    if (!canAccessProvider(user, found.rows[0]))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    response.json(await providerDossier(pool, request.params.id));
});
const documentSchema = z.object({
    category: z.string().trim().min(2).max(80),
    originalName: z.string().trim().min(1).max(180),
    mimeType: z.string().trim().min(3).max(120),
    contentBase64: z.string().min(4),
    expiresOn: z.string().date().optional(),
});
providersRouter.post('/:id/documents', validateBody(documentSchema), async (request, response) => {
    const user = request.user;
    const found = await pool.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    if (!canAccessProvider(user, found.rows[0]))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    const body = request.body;
    try {
        const stored = await storeLocalDocument(String(request.params.id), body.originalName, body.contentBase64);
        const result = await pool.query(`INSERT INTO provider_documents(id,provider_id,category,original_name,mime_type,byte_size,storage_driver,storage_key,uploaded_by_user_id,expires_on)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date) RETURNING id,category,original_name,mime_type,byte_size,expires_on,created_at`, [randomUUID(), request.params.id, body.category, body.originalName, body.mimeType, stored.byteSize, stored.storageDriver, stored.storageKey, user.id, body.expiresOn || null]);
        response.status(201).json({ document: result.rows[0] });
    }
    catch (error) {
        response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo registrar el documento.' });
    }
});
providersRouter.get('/:id/documents/:documentId/content', async (request, response) => {
    const user = request.user;
    const found = await pool.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    if (!canAccessProvider(user, found.rows[0]))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    const document = await pool.query(`SELECT original_name,mime_type,storage_driver,storage_key FROM provider_documents WHERE id=$1 AND provider_id=$2`, [request.params.documentId, request.params.id]);
    if (!document.rowCount)
        return response.status(404).json({ error: 'Documento no encontrado.' });
    if (document.rows[0].storage_driver !== 'local')
        return response.status(501).json({ error: 'El controlador de almacenamiento no está disponible.' });
    try {
        const content = await readLocalDocument(document.rows[0].storage_key);
        response.type(document.rows[0].mime_type).setHeader('Content-Disposition', `inline; filename="${String(document.rows[0].original_name).replace(/"/g, '')}"`).send(content);
    }
    catch {
        response.status(404).json({ error: 'El archivo local ya no está disponible.' });
    }
});
const contactPreferencesSchema = z.object({ whatsappPhone: z.string().trim().min(7).max(32).optional(), whatsappOptIn: z.boolean(), whatsappOptInSource: z.string().trim().min(3).max(120).optional() });
providersRouter.put('/:id/contact-preferences', requireRoles('supervisor_general', 'administradora', 'ejecutiva'), validateBody(contactPreferencesSchema), async (request, response) => {
    const user = request.user;
    const found = await pool.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1`, [request.params.id]);
    if (!found.rowCount)
        return response.status(404).json({ error: 'Proveedor no encontrado.' });
    if (!canAccessProvider(user, found.rows[0]))
        return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
    const body = request.body;
    const result = await pool.query(`INSERT INTO provider_contact_preferences(provider_id,whatsapp_phone,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_opt_in_source,updated_by_user_id)
  VALUES($1,$2,$3,CASE WHEN $3 THEN now() ELSE NULL END,$4,$5)
  ON CONFLICT(provider_id) DO UPDATE SET whatsapp_phone=EXCLUDED.whatsapp_phone,whatsapp_opt_in=EXCLUDED.whatsapp_opt_in,whatsapp_opt_in_at=CASE WHEN EXCLUDED.whatsapp_opt_in THEN now() ELSE NULL END,whatsapp_opt_in_source=EXCLUDED.whatsapp_opt_in_source,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()
  RETURNING provider_id,whatsapp_phone,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_opt_in_source,updated_at`, [request.params.id, body.whatsappPhone || null, body.whatsappOptIn, body.whatsappOptInSource || null, user.id]);
    response.json({ contactPreferences: result.rows[0] });
});
providersRouter.post('/:id/transitions', validateBody(transitionSchema), async (request, response) => {
    const user = request.user;
    const body = request.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const found = await client.query(`SELECT p.*,h.executive_id FROM providers p JOIN homologation_processes h ON h.id=p.process_id WHERE p.id=$1 FOR UPDATE OF p`, [request.params.id]);
        if (!found.rowCount) {
            await client.query('ROLLBACK');
            return response.status(404).json({ error: 'Proveedor no encontrado.' });
        }
        const row = found.rows[0];
        if (!canAccessProvider(user, row)) {
            await client.query('ROLLBACK');
            return response.status(403).json({ error: 'Proveedor fuera de tu alcance.' });
        }
        if (body.version !== undefined && body.version !== Number(row.transition_version)) {
            await client.query('ROLLBACK');
            return response.status(409).json({ error: 'El flujo fue actualizado por otro usuario. Recarga los datos antes de continuar.' });
        }
        const from = workflowStateFromRow(row);
        const transitionData = body.motivo && body.datos.motivo === undefined ? { ...body.datos, motivo: body.motivo } : body.datos;
        const validation = validateTransition(from, body.transicion, user.role, transitionData);
        if (!validation.ok) {
            await client.query('ROLLBACK');
            const status = validation.error.includes('rol') ? 403 : validation.missingFields?.length ? 422 : 409;
            return response.status(status).json({ error: validation.error, camposFaltantes: validation.missingFields || [] });
        }
        const to = validation.transition.to;
        const assignmentError = await validateAssignment(client, body.transicion, transitionData, row.company_id);
        if (assignmentError) {
            await client.query('ROLLBACK');
            return response.status(422).json({ error: assignmentError });
        }
        const legacy = legacyProviderStatus(to);
        const detail = legacyDetailStatuses(to.substatus);
        const updated = await client.query(`UPDATE providers SET current_step=$1,workflow_status=$2,workflow_substatus=$3,status=$4,
   executive_status=COALESCE($5,executive_status),supervisor_status=COALESCE($6,supervisor_status),
   assigned_executive_id=CASE WHEN $7='ASIGNAR_EJECUTIVA' THEN $8 ELSE assigned_executive_id END,
   assigned_inspector_id=CASE WHEN $7 IN ('ASIGNAR_INSPECTOR','RETOMAR_VISITA') THEN $9 ELSE assigned_inspector_id END,
   valid_until=COALESCE($10::date,valid_until),transition_version=transition_version+1,updated_at=now()
   WHERE id=$11 RETURNING *`, [to.step, to.status, to.substatus, legacy, detail.executive, detail.supervisor, body.transicion, transitionData.ejecutivaId || null, transitionData.inspectorId || null, transitionData.fechaVencimiento || null, request.params.id]);
        await client.query(`INSERT INTO provider_status_history(id,provider_id,transition_code,from_step,from_status,from_substatus,to_step,to_status,to_substatus,actor_user_id,actor_role,reason,metadata)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`, [randomUUID(), request.params.id, body.transicion, from.step, from.status, from.substatus, to.step, to.status, to.substatus, user.id, user.role, body.motivo || String(transitionData.motivo || '') || null, JSON.stringify(transitionData)]);
        await persistTransitionRecords(client, { providerId: String(request.params.id), transition: body.transicion, data: transitionData, actorUserId: user.id });
        await client.query('COMMIT');
        const next = workflowStateFromRow(updated.rows[0]);
        response.json({ provider: mapProvider(updated.rows[0]), transicionesDisponibles: availableTransitions(next, user.role).map(publicTransition) });
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
});
async function validateAssignment(client, transition, data, companyId) {
    const target = transition === 'ASIGNAR_EJECUTIVA' ? { id: data.ejecutivaId, roles: ['ejecutiva'] } : ['ASIGNAR_INSPECTOR', 'RETOMAR_VISITA'].includes(transition) ? { id: data.inspectorId, roles: ['inspector'] } : null;
    if (!target)
        return null;
    const result = await client.query(`SELECT u.role FROM users u JOIN user_companies uc ON uc.user_id=u.id WHERE u.id=$1 AND uc.company_id=$2 AND u.active=true`, [target.id, companyId]);
    if (!result.rowCount || !target.roles.includes(result.rows[0].role))
        return transition === 'ASIGNAR_EJECUTIVA' ? 'La ejecutiva indicada no es válida para esta empresa.' : 'El inspector indicado no es válido para esta empresa.';
    return null;
}
function legacyDetailStatuses(substatus) {
    const executive = { EN_COORDINACION: 'Contactado', NO_UBICADO: 'No encontrado', FORMULARIO_ENVIADO: 'Formulario enviado', FORMULARIO_DEVUELTO: 'Formulario respondido' };
    const supervisor = { VISITA_EN_COORDINACION: 'En coordinación', NO_UBICADO_VISITA: 'No se ubica', VISITA_REPROGRAMADA: 'Visita no realizada', VISITA_DESESTIMADA: 'Desestimado', VISITA_REALIZADA: 'Visita realizada' };
    return { executive: executive[substatus] || null, supervisor: supervisor[substatus] || null };
}
function canAccessProvider(user, row) {
    if (user.role === 'supervisor_general' || user.role === 'administradora')
        return true;
    if (user.role === 'ejecutiva')
        return row.assigned_executive_id === user.id;
    if (user.role === 'inspector')
        return row.assigned_inspector_id === user.id;
    return canAccessCompany(user, String(row.company_id));
}
