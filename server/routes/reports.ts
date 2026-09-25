import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types.js';

export const reportsRouter = Router();
reportsRouter.use(authenticateRequest);

async function scopedProcess(request: AuthenticatedRequest, processId: string) {
  const result = await pool.query(`SELECT id,company_id,executive_id FROM homologation_processes WHERE id=$1`, [processId]);
  if (!result.rowCount) return { error: 'Proceso no encontrado.' } as const;
  const process = result.rows[0];
  if (!canAccessCompany(request.user, process.company_id)) return { error: 'Proceso fuera de tu alcance.' } as const;
  if (request.user.role === 'ejecutiva') {
    const assigned = await pool.query(`SELECT 1 FROM providers p JOIN provider_assignments a ON a.provider_id=p.id
      WHERE p.process_id=$1 AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL LIMIT 1`, [processId, request.user.id]);
    if (!assigned.rowCount) return { error: 'Proceso fuera de tu alcance.' } as const;
  }
  return { process } as const;
}

reportsRouter.get('/dashboard', async (request, response) => {
  const parsed = z.string().min(1).safeParse(request.query.processId);
  if (!parsed.success) return response.status(400).json({ error: 'Debes indicar un proceso.' });
  const scope = await scopedProcess(request as AuthenticatedRequest, parsed.data); if ('error' in scope) return response.status(scope.error === 'Proceso no encontrado.' ? 404 : 403).json(scope);
  const executiveId = (request as AuthenticatedRequest).user.role === 'ejecutiva' ? (request as AuthenticatedRequest).user.id : null;
  const [counts, certificates] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE workflow_status='HOMOLOGADO' AND workflow_substatus='VIGENTE')::int AS homologados,
      COUNT(*) FILTER (WHERE workflow_status='INSCRITO')::int AS inscritos,
      COUNT(*) FILTER (WHERE workflow_status='PENDIENTE_INSCRIPCION')::int AS pendientes,
      COUNT(*) FILTER (WHERE workflow_substatus IN ('NO_RESPONDE','NO_UBICADO','NO_UBICADO_VISITA'))::int AS sin_respuesta,
      COUNT(*) FILTER (WHERE workflow_substatus='NO_PARTICIPA')::int AS no_participan,
      COUNT(*) FILTER (WHERE workflow_substatus='DATOS_INCOMPLETOS')::int AS datos_incompletos,
      COUNT(*) FILTER (WHERE workflow_substatus IN ('DESESTIMADO','VISITA_DESESTIMADA'))::int AS desestimados,
      COUNT(*) FILTER (WHERE workflow_substatus='NO_ES_PROVEEDOR')::int AS no_son_proveedores
      FROM providers p WHERE process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL))`, [parsed.data, executiveId]),
    pool.query(`SELECT COUNT(*) FILTER (WHERE expires_on BETWEEN current_date AND current_date + 45)::int AS por_vencer,
      COUNT(*) FILTER (WHERE expires_on < current_date)::int AS vencidos FROM provider_certificates c JOIN providers p ON p.id=c.provider_id WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL))`, [parsed.data, executiveId]),
  ]);
  response.json({ ...counts.rows[0], ...certificates.rows[0] });
});

reportsRouter.get('/status', async (request, response) => {
  const processId = z.string().min(1).safeParse(request.query.processId);
  if (!processId.success) return response.status(400).json({ error: 'Debes indicar un proceso.' });
  const authenticated = request as AuthenticatedRequest;
  const scope = await scopedProcess(authenticated, processId.data);
  if ('error' in scope) return response.status(scope.error === 'Proceso no encontrado.' ? 404 : 403).json(scope);
  const executiveId = authenticated.user.role === 'ejecutiva' ? authenticated.user.id : null;
  const inspectorId = authenticated.user.role === 'inspector' ? authenticated.user.id : null;
  const result = await pool.query(`
    SELECT p.id,p.tax_id AS "ruc",p.legal_name AS "razonSocial",
      COALESCE(certificate.document_type,documents.document_types,'') AS "tipoDocumento",
      COALESCE(filter_one.attribute_value,'') AS "filtro1",
      p.workflow_status AS "estado",p.workflow_substatus AS "subestado",
      COALESCE(certificate.opinion,'') AS "dictamen",certificate.score::float8 AS "puntajeFinalPonderado",
      certificate.issued_on::text AS "fechaEmision",certificate.expires_on::text AS "fechaVencimiento",
      CASE WHEN certificate.expires_on IS NULL THEN NULL ELSE (certificate.expires_on-current_date)::int END AS "diasPorVencer",
      CONCAT_WS(', ',NULLIF(documents.deliverables,''),NULLIF(certificate.document_type,'')) AS "entregables",
      documents.deliverable_documents AS "documentosEntregables"
    FROM providers p
    LEFT JOIN LATERAL (SELECT attribute_value FROM provider_attributes WHERE provider_id=p.id AND attribute_key='filtro_1' LIMIT 1) filter_one ON true
    LEFT JOIN LATERAL (SELECT document_type,opinion,score,issued_on,expires_on FROM provider_certificates WHERE provider_id=p.id ORDER BY expires_on DESC,created_at DESC LIMIT 1) certificate ON true
    LEFT JOIN LATERAL (
      SELECT string_agg(category,', ' ORDER BY created_at DESC) AS document_types,
        string_agg(original_name,', ' ORDER BY created_at DESC) AS deliverables,
        COALESCE(json_agg(json_build_object('id',id,'originalName',original_name,'mimeType',mime_type,'byteSize',byte_size) ORDER BY created_at DESC),'[]'::json) AS deliverable_documents
      FROM provider_documents WHERE provider_id=p.id
    ) documents ON true
    WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) AND ($3::text IS NULL OR p.assigned_inspector_id=$3)
    ORDER BY p.legal_name`, [processId.data, executiveId, inspectorId]);
  response.json({ rows: result.rows });
});

const reportType = z.enum(['directorio', 'facturacion', 'homologados', 'inspecciones', 'trazabilidad']);
reportsRouter.get('/operational', async (request, response) => {
  const processId = z.string().min(1).safeParse(request.query.processId); const type = reportType.safeParse(request.query.type);
  if (!processId.success || !type.success) return response.status(400).json({ error: 'Debes indicar proceso y tipo de reporte válidos.' });
  const scope = await scopedProcess(request as AuthenticatedRequest, processId.data); if ('error' in scope) return response.status(scope.error === 'Proceso no encontrado.' ? 404 : 403).json(scope);
  const executiveId = (request as AuthenticatedRequest).user.role === 'ejecutiva' ? (request as AuthenticatedRequest).user.id : null;
  const queries: Record<z.infer<typeof reportType>, { columns: string[]; sql: string }> = {
    directorio: { columns: ['RUC', 'Razón social', 'Contacto', 'Correo', 'Teléfonos', 'Departamento', 'Distrito', 'Paso', 'Estado', 'Subestado'], sql: `SELECT p.tax_id,p.legal_name,p.contact_name,p.email,p.phones,p.department,p.district,p.current_step,p.workflow_status,p.workflow_substatus FROM providers p WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) ORDER BY p.legal_name` },
    facturacion: { columns: ['RUC', 'Proveedor', 'Banco', 'Monto', 'Modalidad', 'Fecha de pago', 'Operación', 'Factura'], sql: `SELECT p.tax_id,p.legal_name,pa.bank,pa.amount,pa.modality,pa.paid_on,pa.operation_number,pa.invoice_number FROM provider_payments pa JOIN providers p ON p.id=pa.provider_id WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) ORDER BY pa.paid_on DESC` },
    homologados: { columns: ['RUC', 'Proveedor', 'Tipo', 'Dictamen', 'Puntaje', 'Emisión', 'Vencimiento', 'Alcance'], sql: `SELECT p.tax_id,p.legal_name,c.document_type,c.opinion,c.score,c.issued_on,c.expires_on,c.scope FROM provider_certificates c JOIN providers p ON p.id=c.provider_id WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) ORDER BY c.expires_on` },
    inspecciones: { columns: ['RUC', 'Proveedor', 'Modalidad', 'Programada', 'Realizada', 'Estado', 'Motivo', 'Informe'], sql: `SELECT p.tax_id,p.legal_name,i.modality,i.scheduled_at,i.completed_at,i.status,i.reason,i.report_reference FROM provider_inspections i JOIN providers p ON p.id=i.provider_id WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) ORDER BY i.scheduled_at DESC NULLS LAST` },
    trazabilidad: { columns: ['RUC', 'Proveedor', 'Transición', 'Desde', 'Hacia', 'Rol', 'Motivo', 'Fecha'], sql: `SELECT p.tax_id,p.legal_name,h.transition_code,concat(h.from_step,' · ',h.from_substatus),concat(h.to_step,' · ',h.to_substatus),h.actor_role,h.reason,h.created_at FROM provider_status_history h JOIN providers p ON p.id=h.provider_id WHERE p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments a WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_user_id=$2 AND a.released_at IS NULL)) ORDER BY h.created_at DESC` },
  };
  const report = queries[type.data]; const rows = await pool.query(report.sql, [processId.data, executiveId]);
  response.json({ type: type.data, columns: report.columns, rows: rows.rows.map((row) => Object.values(row)) });
});

const productivityQuery = z.object({ processId: z.string().min(1), from: z.string().date(), to: z.string().date() }).refine((value) => value.to >= value.from, { path: ['to'], message: 'La fecha final debe ser posterior a la inicial.' });
reportsRouter.get('/productivity', requireRoles('supervisor_general', 'administradora'), async (request, response) => {
  const parsed = productivityQuery.safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: 'Debes indicar un proceso y un período válidos.' });
  const scope = await scopedProcess(request as AuthenticatedRequest, parsed.data.processId); if ('error' in scope) return response.status(scope.error === 'Proceso no encontrado.' ? 404 : 403).json(scope);
  const values = [parsed.data.processId, parsed.data.from, parsed.data.to];
  const [executives, assignments, metrics, stageTimes] = await Promise.all([
    pool.query(`SELECT u.id,u.name,COUNT(p.id)::int AS current_portfolio,
      COUNT(p.id) FILTER (WHERE p.workflow_status<>'HOMOLOGADO')::int AS pending
      FROM users u JOIN user_companies uc ON uc.user_id=u.id
      LEFT JOIN provider_assignments a ON a.assigned_user_id=u.id AND a.assignment_role='ejecutiva' AND a.released_at IS NULL
      LEFT JOIN providers p ON p.id=a.provider_id AND p.process_id=$1
      WHERE uc.company_id=$2 AND u.role='ejecutiva' AND u.active=true GROUP BY u.id,u.name ORDER BY u.name`, [parsed.data.processId, scope.process.company_id]),
    pool.query(`SELECT a.assigned_user_id,COUNT(*)::int AS assigned_in_period
      FROM provider_assignments a JOIN providers p ON p.id=a.provider_id
      WHERE p.process_id=$1 AND a.assignment_role='ejecutiva' AND a.assigned_at >= $2::date AND a.assigned_at < $3::date + interval '1 day'
      GROUP BY a.assigned_user_id`, values),
    pool.query(`SELECT a.assigned_user_id,
      COUNT(*) FILTER (WHERE h.transition_code='INICIAR_COORDINACION')::int AS contacts,
      COUNT(*) FILTER (WHERE h.transition_code='ENVIAR_FORMULARIO')::int AS forms_sent,
      COUNT(*) FILTER (WHERE h.transition_code='RECIBIR_FORMULARIO')::int AS forms_returned,
      COUNT(*) FILTER (WHERE h.transition_code='PROGRAMAR_VISITA')::int AS visits_coordinated,
      COUNT(*) FILTER (WHERE h.transition_code IN ('EMITIR_ENTREGABLE','REGISTRAR_CERTIFICADO_EXISTENTE'))::int AS homologated
      FROM provider_status_history h JOIN providers p ON p.id=h.provider_id
      JOIN provider_assignments a ON a.provider_id=h.provider_id AND a.assignment_role='ejecutiva'
        AND h.created_at>=a.assigned_at AND (a.released_at IS NULL OR h.created_at<a.released_at)
      WHERE p.process_id=$1 AND h.created_at >= $2::date AND h.created_at < $3::date + interval '1 day'
      GROUP BY a.assigned_user_id`, values),
    pool.query(`WITH ordered AS (
        SELECT h.provider_id,h.from_step,h.created_at,lead(h.created_at) OVER(PARTITION BY h.provider_id ORDER BY h.created_at) AS next_at
        FROM provider_status_history h JOIN providers p ON p.id=h.provider_id WHERE p.process_id=$1
      ) SELECT a.assigned_user_id,o.from_step,ROUND(AVG(EXTRACT(EPOCH FROM (o.next_at-o.created_at))/3600)::numeric,2) AS average_hours
      FROM ordered o JOIN provider_assignments a ON a.provider_id=o.provider_id AND a.assignment_role='ejecutiva'
        AND o.created_at>=a.assigned_at AND (a.released_at IS NULL OR o.created_at<a.released_at)
      WHERE o.next_at IS NOT NULL AND o.created_at >= $2::date AND o.created_at < $3::date + interval '1 day'
      GROUP BY a.assigned_user_id,o.from_step`, values),
  ]);
  const assignmentMap = new Map(assignments.rows.map((row) => [String(row.assigned_user_id), Number(row.assigned_in_period)]));
  const metricMap = new Map(metrics.rows.map((row) => [String(row.assigned_user_id), row]));
  const timeMap = new Map<string, Record<string, number>>();
  for (const row of stageTimes.rows) timeMap.set(String(row.assigned_user_id), { ...(timeMap.get(String(row.assigned_user_id)) || {}), [`paso_${row.from_step}`]: Number(row.average_hours) });
  response.json({ from: parsed.data.from, to: parsed.data.to, rows: executives.rows.map((executive) => {
    const metric = metricMap.get(String(executive.id)) || {};
    return { executiveId: executive.id, executiveName: executive.name, currentPortfolio: Number(executive.current_portfolio), assignedInPeriod: assignmentMap.get(String(executive.id)) || 0, contacts: Number(metric.contacts || 0), formsSent: Number(metric.forms_sent || 0), formsReturned: Number(metric.forms_returned || 0), visitsCoordinated: Number(metric.visits_coordinated || 0), homologated: Number(metric.homologated || 0), pending: Number(executive.pending), averageHoursByStep: timeMap.get(String(executive.id)) || {} };
  }) });
});
