import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { config } from './config.js';
import type { WorkflowTransitionCode } from './workflow.js';

export type NotificationTemplateCode =
  | 'INVITACION_INICIAL'
  | 'RECORDATORIO_INSCRIPCION'
  | 'FORMULARIO_ENVIADO'
  | 'VISITA_PROGRAMADA'
  | 'CERTIFICADO_EMITIDO'
  | 'CERTIFICADO_POR_VENCER'
  | 'CERTIFICADO_VENCIDO';

const templateByTransition: Partial<Record<WorkflowTransitionCode, NotificationTemplateCode>> = {
  INICIAR_COORDINACION: 'INVITACION_INICIAL',
  MARCAR_NO_RESPONDE: 'RECORDATORIO_INSCRIPCION',
  ENVIAR_FORMULARIO: 'FORMULARIO_ENVIADO',
  PROGRAMAR_VISITA: 'VISITA_PROGRAMADA',
  REPROGRAMAR_VISITA: 'VISITA_PROGRAMADA',
  EMITIR_ENTREGABLE: 'CERTIFICADO_EMITIDO',
  REGISTRAR_CERTIFICADO_EXISTENTE: 'CERTIFICADO_EMITIDO',
  MARCAR_POR_VENCER: 'CERTIFICADO_POR_VENCER',
  MARCAR_VENCIDO: 'CERTIFICADO_VENCIDO',
};

export function notificationTemplateForTransition(transition: WorkflowTransitionCode) {
  return templateByTransition[transition] || null;
}

export async function queueWorkflowNotification(
  client: Pick<PoolClient, 'query'>,
  input: { providerId: string; transition: WorkflowTransitionCode; actorUserId?: string; payload: Record<string, unknown> },
) {
  const template = notificationTemplateForTransition(input.transition);
  if (!template) return null;
  const status = config.notificationsProvider === 'disabled' || !config.whatsappEnabled ? 'OMITIDA' : 'PENDIENTE';
  const omission = status === 'OMITIDA' ? 'WhatsApp está preparado pero permanece desactivado.' : null;
  const id = randomUUID();
  await client.query(
    `INSERT INTO provider_notifications(id,provider_id,channel,template_code,payload,status,failure_reason,created_by_user_id)
     VALUES($1,$2,'WHATSAPP',$3,$4::jsonb,$5,$6,$7)`,
    [id, input.providerId, template, JSON.stringify(input.payload), status, omission, input.actorUserId || null],
  );
  return { id, template, status };
}

export function isWhatsAppDispatchReady() {
  return config.notificationsProvider === 'whatsapp' && config.whatsappEnabled;
}
