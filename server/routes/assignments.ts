import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { buildBalancedAssignmentPlan, buildQuantityAssignmentPlan, type PlannedAssignment } from '../assignment-planning.js';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import type { AuthenticatedRequest, SessionUser } from '../types.js';
import { validateBody } from '../validation.js';

export const assignmentsRouter = Router();
assignmentsRouter.use(authenticateRequest, requireRoles('supervisor_general', 'administradora'));

const providerIdsSchema = z.array(z.string().trim().min(1)).min(1).max(1_000);
const assignmentSchema = z.object({
  processId: z.string().trim().min(1),
  providerIds: providerIdsSchema,
  executiveId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(1_000),
});
const unassignmentSchema = assignmentSchema.omit({ executiveId: true });
const distributionSchema = z.object({
  processId: z.string().trim().min(1),
  providerIds: providerIdsSchema,
  mode: z.enum(['balanced', 'quantity']),
  executiveIds: z.array(z.string().trim().min(1)).min(1).max(100).optional(),
  quantities: z.array(z.object({ executiveId: z.string().trim().min(1), quantity: z.number().int().positive() })).min(1).max(100).optional(),
  reason: z.string().trim().min(3).max(1_000),
}).superRefine((value, context) => {
  if (value.mode === 'balanced' && !value.executiveIds?.length) context.addIssue({ code: 'custom', path: ['executiveIds'], message: 'Selecciona al menos una ejecutiva.' });
  if (value.mode === 'quantity' && !value.quantities?.length) context.addIssue({ code: 'custom', path: ['quantities'], message: 'Define las cantidades por ejecutiva.' });
});

async function processScope(client: PoolClient, processId: string, user: SessionUser) {
  const result = await client.query(`SELECT id,company_id FROM homologation_processes WHERE id=$1`, [processId]);
  if (!result.rowCount) return { error: 'Proceso no encontrado.', status: 404 } as const;
  if (!canAccessCompany(user, String(result.rows[0].company_id))) return { error: 'Proceso fuera de tu alcance.', status: 403 } as const;
  return { companyId: String(result.rows[0].company_id) } as const;
}

assignmentsRouter.get('/portfolio', async (request, response) => {
  const processId = z.string().trim().min(1).safeParse(request.query.processId);
  if (!processId.success) return response.status(400).json({ error: 'Debes indicar un proceso.' });
  const user = (request as AuthenticatedRequest).user;
  const client = await pool.connect();
  try {
    const scope = await processScope(client, processId.data, user);
    if ('error' in scope) return response.status(scope.status!).json({ error: scope.error });
    const [executives, providers, history] = await Promise.all([
      client.query(`SELECT u.id,u.name,u.email,COUNT(p.id)::int AS active_count
        FROM users u JOIN user_companies uc ON uc.user_id=u.id
        LEFT JOIN providers p ON p.assigned_executive_id=u.id AND p.process_id=$1
        WHERE uc.company_id=$2 AND u.role='ejecutiva' AND u.active=true
        GROUP BY u.id,u.name,u.email ORDER BY u.name`, [processId.data, scope.companyId]),
      client.query(`SELECT p.id,p.legal_name,p.tax_id,p.assigned_executive_id,u.name AS assigned_executive_name,
        p.current_step,p.workflow_status,p.workflow_substatus,p.updated_at
        FROM providers p LEFT JOIN users u ON u.id=p.assigned_executive_id
        WHERE p.process_id=$1 ORDER BY p.legal_name`, [processId.data]),
      client.query(`SELECT a.id,a.provider_id,p.legal_name AS provider_name,a.assigned_user_id,assigned.name AS assigned_user_name,
        a.assigned_by_user_id,assigned_by.name AS assigned_by_name,a.assigned_at,a.released_at,
        a.released_by_user_id,released_by.name AS released_by_name,a.reason,a.release_reason
        FROM provider_assignments a JOIN providers p ON p.id=a.provider_id
        JOIN users assigned ON assigned.id=a.assigned_user_id
        LEFT JOIN users assigned_by ON assigned_by.id=a.assigned_by_user_id
        LEFT JOIN users released_by ON released_by.id=a.released_by_user_id
        WHERE p.process_id=$1 AND a.assignment_role='ejecutiva'
        ORDER BY a.assigned_at DESC LIMIT 200`, [processId.data]),
    ]);
    response.json({
      executives: executives.rows.map((row) => ({ id: row.id, name: row.name, email: row.email, activeCount: row.active_count })),
      unassignedCount: providers.rows.filter((row) => !row.assigned_executive_id).length,
      providers: providers.rows,
      history: history.rows,
    });
  } finally { client.release(); }
});

assignmentsRouter.post('/assign', validateBody(assignmentSchema), async (request, response) => {
  const body = request.body as z.infer<typeof assignmentSchema>;
  const plan = body.providerIds.map((providerId) => ({ providerId, executiveId: body.executiveId }));
  const result = await applyPlan((request as AuthenticatedRequest).user, body.processId, plan, body.reason);
  response.json(result);
});

assignmentsRouter.post('/distribute', validateBody(distributionSchema), async (request, response) => {
  const body = request.body as z.infer<typeof distributionSchema>;
  let plan: PlannedAssignment[];
  try {
    plan = body.mode === 'balanced'
      ? buildBalancedAssignmentPlan(body.providerIds, body.executiveIds || [])
      : buildQuantityAssignmentPlan(body.providerIds, body.quantities || []);
  } catch (error) {
    return response.status(422).json({ error: error instanceof Error ? error.message : 'No se pudo preparar la distribución.' });
  }
  const result = await applyPlan((request as AuthenticatedRequest).user, body.processId, plan, body.reason);
  response.json(result);
});

assignmentsRouter.post('/unassign', validateBody(unassignmentSchema), async (request, response) => {
  const user = (request as AuthenticatedRequest).user;
  const body = request.body as z.infer<typeof unassignmentSchema>;
  const providerIds = [...new Set(body.providerIds)];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scope = await processScope(client, body.processId, user);
    if ('error' in scope) { await client.query('ROLLBACK'); return response.status(scope.status!).json({ error: scope.error }); }
    const providers = await lockProviders(client, body.processId, providerIds);
    if (providers.size !== providerIds.length) { await client.query('ROLLBACK'); return response.status(422).json({ error: 'Uno o más proveedores no pertenecen al proceso.' }); }
    const released = await client.query(`UPDATE provider_assignments SET released_at=now(),released_by_user_id=$1,release_reason=$2
      WHERE provider_id=ANY($3::text[]) AND assignment_role='ejecutiva' AND released_at IS NULL RETURNING provider_id`, [user.id, body.reason, providerIds]);
    await client.query(`UPDATE providers SET assigned_executive_id=NULL,updated_at=now() WHERE id=ANY($1::text[])`, [providerIds]);
    await client.query('COMMIT');
    response.json({ unassigned: released.rowCount || 0, unchanged: providerIds.length - (released.rowCount || 0) });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

async function applyPlan(user: SessionUser, processId: string, plan: PlannedAssignment[], reason: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scope = await processScope(client, processId, user);
    if ('error' in scope) { const error = new Error(scope.error); Object.assign(error, { statusCode: scope.status }); throw error; }
    const providerIds = [...new Set(plan.map((item) => item.providerId))];
    if (providerIds.length !== plan.length) { const error = new Error('La selección contiene proveedores duplicados.'); Object.assign(error, { statusCode: 422 }); throw error; }
    const executiveIds = [...new Set(plan.map((item) => item.executiveId))];
    const validExecutives = await client.query(`SELECT DISTINCT u.id FROM users u JOIN user_companies uc ON uc.user_id=u.id
      WHERE u.id=ANY($1::text[]) AND uc.company_id=$2 AND u.role='ejecutiva' AND u.active=true`, [executiveIds, scope.companyId]);
    if (validExecutives.rowCount !== executiveIds.length) { const error = new Error('Una o más ejecutivas no son válidas para esta empresa.'); Object.assign(error, { statusCode: 422 }); throw error; }
    const providers = await lockProviders(client, processId, providerIds);
    if (providers.size !== providerIds.length) { const error = new Error('Uno o más proveedores no pertenecen al proceso.'); Object.assign(error, { statusCode: 422 }); throw error; }
    const activeAssignments = await client.query(`SELECT id,provider_id,assigned_user_id FROM provider_assignments
      WHERE provider_id=ANY($1::text[]) AND assignment_role='ejecutiva' AND released_at IS NULL FOR UPDATE`, [providerIds]);
    const activeByProvider = new Map(activeAssignments.rows.map((row) => [String(row.provider_id), row]));
    let assigned = 0; let reassigned = 0; let unchanged = 0;
    for (const item of plan) {
      const provider = providers.get(item.providerId)!;
      const active = activeByProvider.get(item.providerId);
      if (active?.assigned_user_id === item.executiveId || (!active && provider.assigned_executive_id === item.executiveId)) { unchanged += 1; continue; }
      if (active) {
        await client.query(`UPDATE provider_assignments SET released_at=now(),released_by_user_id=$1,release_reason=$2 WHERE id=$3`, [user.id, reason, active.id]);
        reassigned += 1;
      } else if (provider.assigned_executive_id) reassigned += 1;
      else assigned += 1;
      await client.query(`INSERT INTO provider_assignments(id,provider_id,assignment_role,assigned_user_id,assigned_by_user_id,reason)
        VALUES($1,$2,'ejecutiva',$3,$4,$5)`, [randomUUID(), item.providerId, item.executiveId, user.id, reason]);
      if (provider.workflow_substatus === 'REGISTRADO') {
        await client.query(`UPDATE providers SET assigned_executive_id=$1,current_step=3,workflow_status='PENDIENTE_INSCRIPCION',
          workflow_substatus='ASIGNADO_EJECUTIVA',status='En proceso',transition_version=transition_version+1,updated_at=now() WHERE id=$2`, [item.executiveId, item.providerId]);
        await client.query(`INSERT INTO provider_status_history(id,provider_id,transition_code,from_step,from_status,from_substatus,
          to_step,to_status,to_substatus,actor_user_id,actor_role,reason,metadata)
          VALUES($1,$2,'ASIGNAR_EJECUTIVA',$3,$4,$5,3,'PENDIENTE_INSCRIPCION','ASIGNADO_EJECUTIVA',$6,$7,$8,$9::jsonb)`,
          [randomUUID(), item.providerId, provider.current_step, provider.workflow_status, provider.workflow_substatus, user.id, user.role, reason, JSON.stringify({ ejecutivaId: item.executiveId, origen: 'cartera' })]);
      } else {
        await client.query(`UPDATE providers SET assigned_executive_id=$1,updated_at=now() WHERE id=$2`, [item.executiveId, item.providerId]);
      }
    }
    await client.query('COMMIT');
    return { assigned, reassigned, unchanged, total: plan.length };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}

async function lockProviders(client: PoolClient, processId: string, providerIds: string[]) {
  const result = await client.query(`SELECT id,assigned_executive_id,current_step,workflow_status,workflow_substatus
    FROM providers WHERE process_id=$1 AND id=ANY($2::text[]) FOR UPDATE`, [processId, providerIds]);
  return new Map(result.rows.map((row) => [String(row.id), row]));
}
