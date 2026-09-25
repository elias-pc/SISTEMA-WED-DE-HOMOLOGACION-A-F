import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { queueWorkflowNotification } from './notifications.js';
import type { WorkflowTransitionCode } from './workflow.js';

type Queryable = Pick<PoolClient, 'query'>;
const text = (value: unknown) => String(value ?? '').trim();
const date = (value: unknown) => text(value).slice(0, 10);

export async function persistTransitionRecords(
  client: Queryable,
  input: { providerId: string; transition: WorkflowTransitionCode; data: Record<string, unknown>; actorUserId: string },
) {
  const { providerId, transition, data, actorUserId } = input;
  if (transition === 'ASIGNAR_EJECUTIVA') {
    const executiveId = text(data.ejecutivaId);
    const existing = await client.query(`SELECT 1 FROM provider_assignments WHERE provider_id=$1 AND assignment_role='ejecutiva' AND assigned_user_id=$2 AND released_at IS NULL`, [providerId, executiveId]);
    if (!existing.rowCount) await client.query(`INSERT INTO provider_assignments(id,provider_id,assignment_role,assigned_user_id,assigned_by_user_id,reason) VALUES($1,$2,'ejecutiva',$3,$4,$5)`, [randomUUID(), providerId, executiveId, actorUserId, text(data.motivo) || null]);
  }
  if (transition === 'ASIGNAR_INSPECTOR' || transition === 'RETOMAR_VISITA') {
    await client.query(`UPDATE provider_assignments SET released_at=now() WHERE provider_id=$1 AND assignment_role='inspector' AND released_at IS NULL`, [providerId]);
    await client.query(`INSERT INTO provider_assignments(id,provider_id,assignment_role,assigned_user_id,assigned_by_user_id,reason) VALUES($1,$2,'inspector',$3,$4,$5)`, [randomUUID(), providerId, text(data.inspectorId), actorUserId, text(data.motivo) || null]);
  }
  if (transition === 'REGISTRAR_PAGO') {
    await client.query(`INSERT INTO provider_payments(id,provider_id,bank,amount,modality,paid_on,operation_number,invoice_number,registered_by_user_id)
      VALUES($1,$2,$3,$4,$5,$6::date,$7,$8,$9)`, [randomUUID(), providerId, text(data.banco), data.monto, text(data.modalidad), date(data.fechaPago), text(data.numeroOperacion), text(data.numeroFactura), actorUserId]);
  }
  if (transition === 'ENVIAR_FORMULARIO') {
    await client.query(`INSERT INTO provider_forms(id,provider_id,form_name,sent_at,registered_by_user_id) VALUES($1,$2,$3,now(),$4)`, [randomUUID(), providerId, text(data.formulario), actorUserId]);
  }
  if (transition === 'RECIBIR_FORMULARIO') {
    await client.query(`UPDATE provider_forms SET received_at=now(),documents_conform=$2,registered_by_user_id=$3
      WHERE id=(SELECT id FROM provider_forms WHERE provider_id=$1 ORDER BY created_at DESC LIMIT 1)`, [providerId, Boolean(data.documentosConformes), actorUserId]);
  }
  if (transition === 'PROGRAMAR_VISITA') {
    await client.query(`INSERT INTO provider_inspections(id,provider_id,modality,scheduled_at,status,created_by_user_id)
      VALUES($1,$2,$3,$4::timestamptz,'PROGRAMADA',$5)`, [randomUUID(), providerId, text(data.modalidadVisita), text(data.fechaVisita), actorUserId]);
  }
  if (transition === 'REPROGRAMAR_VISITA') {
    await client.query(`UPDATE provider_inspections SET scheduled_at=$2::timestamptz,status='REPROGRAMADA',reason=$3,updated_at=now()
      WHERE id=(SELECT id FROM provider_inspections WHERE provider_id=$1 ORDER BY created_at DESC LIMIT 1)`, [providerId, text(data.fechaVisita), text(data.motivo) || null]);
  }
  if (transition === 'MARCAR_NO_UBICADO_VISITA' || transition === 'DESESTIMAR_VISITA') {
    await client.query(`UPDATE provider_inspections SET status=$2,reason=$3,updated_at=now()
      WHERE id=(SELECT id FROM provider_inspections WHERE provider_id=$1 ORDER BY created_at DESC LIMIT 1)`, [providerId, transition === 'MARCAR_NO_UBICADO_VISITA' ? 'NO_UBICADO' : 'DESESTIMADA', text(data.motivo) || null]);
  }
  if (transition === 'REGISTRAR_VISITA') {
    await client.query(`UPDATE provider_inspections SET completed_at=$2::timestamptz,status='REALIZADA',report_reference=$3,updated_at=now()
      WHERE id=(SELECT id FROM provider_inspections WHERE provider_id=$1 ORDER BY created_at DESC LIMIT 1)`, [providerId, text(data.fechaVisita), text(data.informeVisita)]);
  }
  if (transition === 'CONFIRMAR_CONFORMIDAD') {
    await client.query(`UPDATE provider_inspections SET documents_conform=$2,status='CONFORME',updated_at=now()
      WHERE id=(SELECT id FROM provider_inspections WHERE provider_id=$1 ORDER BY created_at DESC LIMIT 1)`, [providerId, Boolean(data.documentosConformes)]);
  }
  if (transition === 'EMITIR_ENTREGABLE' || transition === 'REGISTRAR_CERTIFICADO_EXISTENTE') {
    await client.query(`INSERT INTO provider_certificates(id,provider_id,document_type,opinion,score,issued_on,expires_on,scope,modules,result_summary,issued_by_user_id)
      VALUES($1,$2,$3,$4,$5,$6::date,$7::date,$8,$9::jsonb,$10,$11)`, [
      randomUUID(), providerId, text(data.tipoDocumento), text(data.dictamen) || 'Conforme', data.puntaje ?? null,
      date(data.fechaEmision), date(data.fechaVencimiento), text(data.alcance) || 'Certificado existente', JSON.stringify(data.modulos ?? []), text(data.resultados) || null, actorUserId,
    ]);
  }
  await queueWorkflowNotification(client, { providerId, transition, actorUserId, payload: { ...data, transition } });
}

export async function providerDossier(client: Queryable, providerId: string) {
  const [assignments, payments, forms, inspections, documents, certificates, preferences, notifications] = await Promise.all([
    client.query(`SELECT * FROM provider_assignments WHERE provider_id=$1 ORDER BY assigned_at DESC`, [providerId]),
    client.query(`SELECT * FROM provider_payments WHERE provider_id=$1 ORDER BY paid_on DESC,created_at DESC`, [providerId]),
    client.query(`SELECT * FROM provider_forms WHERE provider_id=$1 ORDER BY created_at DESC`, [providerId]),
    client.query(`SELECT * FROM provider_inspections WHERE provider_id=$1 ORDER BY created_at DESC`, [providerId]),
    client.query(`SELECT id,category,original_name,mime_type,byte_size,expires_on,created_at FROM provider_documents WHERE provider_id=$1 ORDER BY created_at DESC`, [providerId]),
    client.query(`SELECT * FROM provider_certificates WHERE provider_id=$1 ORDER BY expires_on DESC,created_at DESC`, [providerId]),
    client.query(`SELECT provider_id,whatsapp_phone,whatsapp_opt_in,whatsapp_opt_in_at,whatsapp_opt_in_source,updated_at FROM provider_contact_preferences WHERE provider_id=$1`, [providerId]),
    client.query(`SELECT id,channel,template_code,status,scheduled_for,sent_at,provider_message_id,failure_reason,created_at FROM provider_notifications WHERE provider_id=$1 ORDER BY created_at DESC`, [providerId]),
  ]);
  return { assignments: assignments.rows, payments: payments.rows, forms: forms.rows, inspections: inspections.rows, documents: documents.rows, certificates: certificates.rows, contactPreferences: preferences.rows[0] || null, notifications: notifications.rows };
}
