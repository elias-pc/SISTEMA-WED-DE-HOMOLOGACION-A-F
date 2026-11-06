import type { Pool, PoolClient } from 'pg';

export const operationalReportTypes = ['directorio', 'facturacion', 'homologados', 'inspecciones', 'trazabilidad'] as const;
export type OperationalReportType = typeof operationalReportTypes[number];
export const operationalReportTitles: Record<OperationalReportType, string> = {
  directorio: 'Directorio de proveedores', facturacion: 'Facturación y pagos', homologados: 'Homologados y vigencias', inspecciones: 'Inspecciones', trazabilidad: 'Trazabilidad',
};
type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export interface OperationalReportColumn { key: string; label: string; kind: 'text' | 'date' | 'number' | 'currency'; width: number; }
export interface OperationalReport { type: OperationalReportType; columns: readonly OperationalReportColumn[]; rows: Array<Record<string, unknown>>; }

export const operationalReportColumns: Record<OperationalReportType, readonly OperationalReportColumn[]> = {
  directorio: [
    { key: 'nro', label: 'Nro', kind: 'number', width: 8 }, { key: 'razonSocial', label: 'Razón social', kind: 'text', width: 34 },
    { key: 'contacto', label: 'Contacto', kind: 'text', width: 24 }, { key: 'correo', label: 'Correo', kind: 'text', width: 30 },
    { key: 'telefonos', label: 'Teléfonos', kind: 'text', width: 20 }, { key: 'departamento', label: 'Departamento', kind: 'text', width: 18 },
    { key: 'distrito', label: 'Distrito', kind: 'text', width: 18 }, { key: 'status', label: 'Status', kind: 'text', width: 22 },
    { key: 'subStatus', label: 'Sub Status', kind: 'text', width: 26 },
  ],
  facturacion: [
    { key: 'usuario', label: 'Usuario', kind: 'text', width: 24 }, { key: 'ruc', label: 'RUC', kind: 'text', width: 15 },
    { key: 'cliente', label: 'Cliente', kind: 'text', width: 22 }, { key: 'razonSocialProveedor', label: 'Razón Social Proveedor', kind: 'text', width: 34 },
    { key: 'importe', label: 'Importe', kind: 'currency', width: 15 }, { key: 'fechaPago', label: 'Fecha de pago', kind: 'date', width: 15 },
    { key: 'nroOperacion', label: 'Nro Operación', kind: 'text', width: 18 }, { key: 'nroFactura', label: 'Nro factura', kind: 'text', width: 18 },
    { key: 'fechaEnvioFormulario', label: 'Fecha envío formulario', kind: 'date', width: 21 }, { key: 'dias', label: 'Días', kind: 'number', width: 10 },
  ],
  homologados: [
    { key: 'nro', label: 'Nro', kind: 'number', width: 8 }, { key: 'ejecutivaCuenta', label: 'Ejecutiva de Cta', kind: 'text', width: 24 },
    { key: 'cliente', label: 'Cliente', kind: 'text', width: 22 }, { key: 'ruc', label: 'RUC', kind: 'text', width: 15 },
    { key: 'razonSocialProveedor', label: 'Razón Social del Proveedor', kind: 'text', width: 34 }, { key: 'subStatus', label: 'Sub-Status', kind: 'text', width: 24 },
    { key: 'tipoDocumento', label: 'Tipo de Documento', kind: 'text', width: 24 }, { key: 'dictamen', label: 'Dictamen', kind: 'text', width: 18 },
    { key: 'puntaje', label: 'Puntaje', kind: 'number', width: 12 }, { key: 'fechaEmision', label: 'Fecha de Emisión', kind: 'date', width: 17 },
    { key: 'fechaVencimiento', label: 'Fecha de Vcto.', kind: 'date', width: 17 }, { key: 'diasPorVencer', label: 'Días por Vencer', kind: 'number', width: 17 },
  ],
  inspecciones: [
    { key: 'nro', label: 'Nro', kind: 'number', width: 8 }, { key: 'inspector', label: 'Inspector', kind: 'text', width: 24 },
    { key: 'cliente', label: 'Cliente', kind: 'text', width: 22 }, { key: 'ruc', label: 'RUC', kind: 'text', width: 15 },
    { key: 'razonSocial', label: 'Razón Social', kind: 'text', width: 34 }, { key: 'proveedor', label: 'Proveedor', kind: 'text', width: 34 },
    { key: 'fechaAsignacion', label: 'Fecha de Asignación', kind: 'date', width: 20 }, { key: 'subStatus', label: 'Sub-Status', kind: 'text', width: 24 },
    { key: 'fechaVisita', label: 'Fecha de Visita', kind: 'date', width: 18 }, { key: 'dias', label: 'Días', kind: 'number', width: 10 },
  ],
  trazabilidad: [
    { key: 'nro', label: 'Nro', kind: 'number', width: 8 }, { key: 'ejecutiva', label: 'Ejecutiva', kind: 'text', width: 24 },
    { key: 'ruc', label: 'RUC', kind: 'text', width: 15 }, { key: 'cliente', label: 'Cliente', kind: 'text', width: 22 },
    { key: 'razonSocial', label: 'Razón Social', kind: 'text', width: 34 }, { key: 'fechaAsignacion', label: 'Fecha de Asignación', kind: 'date', width: 20 },
    { key: 'enCoordinacion', label: 'En Coordinación', kind: 'date', width: 18 }, { key: 'diasCoordinacion', label: 'Días', kind: 'number', width: 10 },
    { key: 'pagoResultado', label: 'Pago / No Participa / Desestimado', kind: 'date', width: 31 }, { key: 'envioFormulario', label: 'Envío Formulario', kind: 'date', width: 19 },
    { key: 'diasEnvioFormulario', label: 'Días', kind: 'number', width: 10 }, { key: 'fechaDevolucionFormulario', label: 'Fecha de Devolución de Formulario', kind: 'date', width: 25 },
    { key: 'diasDevolucionFormulario', label: 'Días', kind: 'number', width: 10 }, { key: 'fechaHomologacion', label: 'Fecha de Homologación', kind: 'date', width: 22 },
    { key: 'diasHomologacion', label: 'Días', kind: 'number', width: 10 }, { key: 'diasTotales', label: 'Días', kind: 'number', width: 10 },
  ],
};

const toNumber = (value: unknown) => value === null || value === undefined ? null : Number(value);
const scopeClause = `(p.process_id=$1 AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments scope_assignment WHERE scope_assignment.provider_id=p.id AND scope_assignment.assignment_role='ejecutiva' AND scope_assignment.assigned_user_id=$2 AND scope_assignment.released_at IS NULL)) AND ($3::text IS NULL OR EXISTS (SELECT 1 FROM provider_assignments user_assignment WHERE user_assignment.provider_id=p.id AND user_assignment.assigned_user_id=$3 AND user_assignment.released_at IS NULL)))`;

export async function listOperationalReportUsers(db: Queryable, processId: string, executiveId: string | null) {
  const result = await db.query(`SELECT DISTINCT u.id,u.name FROM users u JOIN provider_assignments a ON a.assigned_user_id=u.id JOIN providers p ON p.id=a.provider_id WHERE p.process_id=$1 AND a.released_at IS NULL AND ($2::text IS NULL OR u.id=$2) ORDER BY u.name`, [processId, executiveId]);
  return result.rows.map((row) => ({ id: String(row.id), name: String(row.name) }));
}

export async function buildOperationalReport(db: Queryable, type: OperationalReportType, processId: string, executiveId: string | null, userId: string | null): Promise<OperationalReport> {
  const parameters = [processId, executiveId, userId];
  let result;
  if (type === 'directorio') {
    result = await db.query(`SELECT p.legal_name AS "razonSocial",p.contact_name AS contacto,p.email AS correo,p.phones AS telefonos,p.department AS departamento,p.district AS distrito,p.workflow_status AS status,p.workflow_substatus AS "subStatus" FROM providers p WHERE ${scopeClause} ORDER BY p.legal_name`, parameters);
  } else if (type === 'facturacion') {
    result = await db.query(`SELECT COALESCE(payment_user.name,executive.name,'') AS usuario,p.tax_id AS ruc,c.trade_name AS cliente,p.legal_name AS "razonSocialProveedor",pa.amount AS importe,pa.paid_on AS "fechaPago",pa.operation_number AS "nroOperacion",pa.invoice_number AS "nroFactura",form.sent_at::date AS "fechaEnvioFormulario",CASE WHEN form.sent_at IS NULL THEN NULL ELSE (pa.paid_on-form.sent_at::date) END AS dias FROM provider_payments pa JOIN providers p ON p.id=pa.provider_id JOIN companies c ON c.id=p.company_id LEFT JOIN users payment_user ON payment_user.id=pa.registered_by_user_id LEFT JOIN LATERAL (SELECT u.name FROM provider_assignments a JOIN users u ON u.id=a.assigned_user_id WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_at::date<=pa.paid_on AND (a.released_at IS NULL OR a.released_at::date>=pa.paid_on) ORDER BY a.assigned_at DESC LIMIT 1) executive ON true LEFT JOIN LATERAL (SELECT sent_at FROM provider_forms f WHERE f.provider_id=p.id AND f.sent_at::date<=pa.paid_on ORDER BY f.sent_at DESC LIMIT 1) form ON true WHERE ${scopeClause} ORDER BY pa.paid_on DESC`, parameters);
  } else if (type === 'homologados') {
    result = await db.query(`SELECT COALESCE(executive.name,'') AS "ejecutivaCuenta",company.trade_name AS cliente,p.tax_id AS ruc,p.legal_name AS "razonSocialProveedor",p.workflow_substatus AS "subStatus",certificate.document_type AS "tipoDocumento",certificate.opinion AS dictamen,certificate.score AS puntaje,certificate.issued_on AS "fechaEmision",certificate.expires_on AS "fechaVencimiento",(certificate.expires_on-current_date) AS "diasPorVencer" FROM provider_certificates certificate JOIN providers p ON p.id=certificate.provider_id JOIN companies company ON company.id=p.company_id LEFT JOIN LATERAL (SELECT u.name FROM provider_assignments a JOIN users u ON u.id=a.assigned_user_id WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.assigned_at::date<=certificate.issued_on AND (a.released_at IS NULL OR a.released_at::date>=certificate.issued_on) ORDER BY a.assigned_at DESC LIMIT 1) executive ON true WHERE ${scopeClause} ORDER BY certificate.expires_on`, parameters);
  } else if (type === 'inspecciones') {
    result = await db.query(`SELECT COALESCE(assignment.name,'') AS inspector,company.trade_name AS cliente,p.tax_id AS ruc,p.legal_name AS "razonSocial",p.legal_name AS proveedor,assignment.assigned_at::date AS "fechaAsignacion",p.workflow_substatus AS "subStatus",COALESCE(inspection.completed_at,inspection.scheduled_at)::date AS "fechaVisita",CASE WHEN assignment.assigned_at IS NULL OR COALESCE(inspection.completed_at,inspection.scheduled_at) IS NULL THEN NULL ELSE (COALESCE(inspection.completed_at,inspection.scheduled_at)::date-assignment.assigned_at::date) END AS dias FROM provider_inspections inspection JOIN providers p ON p.id=inspection.provider_id JOIN companies company ON company.id=p.company_id LEFT JOIN LATERAL (SELECT a.assigned_at,u.name FROM provider_assignments a JOIN users u ON u.id=a.assigned_user_id WHERE a.provider_id=p.id AND a.assignment_role='inspector' AND a.assigned_at<=inspection.created_at AND (a.released_at IS NULL OR a.released_at>=inspection.created_at) ORDER BY a.assigned_at DESC LIMIT 1) assignment ON true WHERE ${scopeClause} ORDER BY COALESCE(inspection.completed_at,inspection.scheduled_at) DESC NULLS LAST`, parameters);
  } else {
    result = await db.query(`WITH milestones AS (SELECT provider_id,MIN(created_at) FILTER (WHERE transition_code='INICIAR_COORDINACION') AS coordination_at,MIN(created_at) FILTER (WHERE transition_code IN ('REGISTRAR_PAGO','MARCAR_NO_PARTICIPA','DESESTIMAR_INSCRIPCION','DESESTIMAR_VISITA')) AS outcome_at,MIN(created_at) FILTER (WHERE transition_code='ENVIAR_FORMULARIO') AS form_sent_at,MIN(created_at) FILTER (WHERE transition_code='RECIBIR_FORMULARIO') AS form_received_at,MIN(created_at) FILTER (WHERE transition_code IN ('EMITIR_ENTREGABLE','REGISTRAR_CERTIFICADO_EXISTENTE')) AS homologated_at FROM provider_status_history GROUP BY provider_id) SELECT COALESCE(executive.name,'') AS ejecutiva,p.tax_id AS ruc,company.trade_name AS cliente,p.legal_name AS "razonSocial",assignment.assigned_at::date AS "fechaAsignacion",milestones.coordination_at::date AS "enCoordinacion",CASE WHEN assignment.assigned_at IS NULL OR milestones.coordination_at IS NULL THEN NULL ELSE (milestones.coordination_at::date-assignment.assigned_at::date) END AS "diasCoordinacion",milestones.outcome_at::date AS "pagoResultado",milestones.form_sent_at::date AS "envioFormulario",CASE WHEN milestones.outcome_at IS NULL OR milestones.form_sent_at IS NULL THEN NULL ELSE (milestones.form_sent_at::date-milestones.outcome_at::date) END AS "diasEnvioFormulario",milestones.form_received_at::date AS "fechaDevolucionFormulario",CASE WHEN milestones.form_sent_at IS NULL OR milestones.form_received_at IS NULL THEN NULL ELSE (milestones.form_received_at::date-milestones.form_sent_at::date) END AS "diasDevolucionFormulario",milestones.homologated_at::date AS "fechaHomologacion",CASE WHEN milestones.form_received_at IS NULL OR milestones.homologated_at IS NULL THEN NULL ELSE (milestones.homologated_at::date-milestones.form_received_at::date) END AS "diasHomologacion",CASE WHEN assignment.assigned_at IS NULL OR milestones.homologated_at IS NULL THEN NULL ELSE (milestones.homologated_at::date-assignment.assigned_at::date) END AS "diasTotales" FROM providers p JOIN companies company ON company.id=p.company_id LEFT JOIN milestones ON milestones.provider_id=p.id LEFT JOIN LATERAL (SELECT a.assigned_at,u.name FROM provider_assignments a JOIN users u ON u.id=a.assigned_user_id WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' ORDER BY a.assigned_at LIMIT 1) assignment ON true LEFT JOIN users executive ON executive.name=assignment.name WHERE ${scopeClause} ORDER BY p.legal_name`, parameters);
  }
  const rows = result.rows.map((row, index) => {
    const normalized: Record<string, unknown> = {};
    for (const column of operationalReportColumns[type]) normalized[column.key] = row[column.key] ?? null;
    if ('nro' in normalized) normalized.nro = index + 1;
    for (const column of operationalReportColumns[type]) if (column.kind === 'number' || column.kind === 'currency') normalized[column.key] = column.key === 'nro' ? normalized[column.key] : toNumber(normalized[column.key]);
    return normalized;
  });
  return { type, columns: operationalReportColumns[type], rows };
}
