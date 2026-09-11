import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { expiryTransition } from '../certificate-expiry.js';
import { pool } from '../db/pool.js';
import { legacyProviderStatus, validateTransition, type WorkflowState } from '../workflow.js';
import { queueWorkflowNotification } from '../notifications.js';

export const cronRouter = Router();

cronRouter.get('/certificates', async (request, response) => {
  if (!config.cronSecret) return response.status(503).json({ error: 'CRON_SECRET no está configurado.' });
  if (request.get('authorization') !== `Bearer ${config.cronSecret}`) return response.status(401).json({ error: 'Cron no autorizado.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const candidates = await client.query(`SELECT id,current_step,workflow_status,workflow_substatus,valid_until FROM providers WHERE workflow_substatus IN ('VIGENTE','POR_VENCER') AND valid_until IS NOT NULL FOR UPDATE`);
    const counters = { porVencer: 0, vencidos: 0 };
    for (const row of candidates.rows) {
      const from: WorkflowState = { step: Number(row.current_step) as WorkflowState['step'], status: row.workflow_status, substatus: row.workflow_substatus };
      const transition = expiryTransition(from.substatus, String(row.valid_until), new Date());
      if (!transition) continue;
      const validation = validateTransition(from, transition, 'sistema', {}); if (!validation.ok) continue;
      const to = validation.transition.to;
      await client.query(`UPDATE providers SET current_step=$1,workflow_status=$2,workflow_substatus=$3,status=$4,transition_version=transition_version+1,updated_at=now() WHERE id=$5`, [to.step, to.status, to.substatus, legacyProviderStatus(to), row.id]);
      await client.query(`INSERT INTO provider_status_history(id,provider_id,transition_code,from_step,from_status,from_substatus,to_step,to_status,to_substatus,actor_role,reason,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'sistema',$10,'{}'::jsonb)`, [randomUUID(), row.id, transition, from.step, from.status, from.substatus, to.step, to.status, to.substatus, transition === 'MARCAR_VENCIDO' ? 'Vencimiento automático del certificado.' : 'Aviso automático a 45 días del vencimiento.']);
      await queueWorkflowNotification(client, { providerId: row.id, transition, payload: { validUntil: String(row.valid_until) } });
      if (transition === 'MARCAR_VENCIDO') counters.vencidos += 1; else counters.porVencer += 1;
    }
    await client.query('COMMIT'); response.json({ ok: true, ...counters });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});
