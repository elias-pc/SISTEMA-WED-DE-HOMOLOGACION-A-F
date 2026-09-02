ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'administradora';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'jefe_inspecciones';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'inspector';

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS current_step smallint NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'PENDIENTE_INSCRIPCION',
  ADD COLUMN IF NOT EXISTS workflow_substatus text NOT NULL DEFAULT 'REGISTRADO',
  ADD COLUMN IF NOT EXISTS assigned_executive_id text REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_inspector_id text REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transition_version integer NOT NULL DEFAULT 0;

UPDATE providers SET
  current_step = CASE
    WHEN status IN ('Homologado', 'Vencido') THEN 9
    WHEN supervisor_status IS NOT NULL THEN 7
    WHEN executive_status = 'Formulario respondido' THEN 6
    WHEN executive_status = 'Formulario enviado' THEN 5
    WHEN executive_status IS NOT NULL THEN 4
    ELSE 2
  END,
  workflow_status = CASE
    WHEN status IN ('Homologado', 'Vencido') THEN 'HOMOLOGADO'
    WHEN supervisor_status IS NOT NULL OR executive_status IN ('Formulario respondido', 'Formulario enviado') THEN 'INSCRITO'
    ELSE 'PENDIENTE_INSCRIPCION'
  END,
  workflow_substatus = CASE
    WHEN status = 'Homologado' THEN 'VIGENTE'
    WHEN status = 'Vencido' THEN 'VENCIDO'
    WHEN supervisor_status = 'En coordinación' THEN 'VISITA_EN_COORDINACION'
    WHEN supervisor_status = 'No se ubica' THEN 'NO_UBICADO_VISITA'
    WHEN supervisor_status = 'Visita no realizada' THEN 'VISITA_REPROGRAMADA'
    WHEN supervisor_status = 'Desestimado' THEN 'VISITA_DESESTIMADA'
    WHEN supervisor_status = 'Visita realizada' THEN 'VISITA_REALIZADA'
    WHEN executive_status = 'Formulario respondido' THEN 'FORMULARIO_DEVUELTO'
    WHEN executive_status = 'Formulario enviado' THEN 'FORMULARIO_ENVIADO'
    WHEN executive_status = 'No encontrado' THEN 'NO_UBICADO'
    WHEN executive_status = 'Contactado' THEN 'EN_COORDINACION'
    ELSE 'REGISTRADO'
  END,
  assigned_executive_id = COALESCE(assigned_executive_id, (
    SELECT executive_id FROM homologation_processes WHERE homologation_processes.id = providers.process_id
  ));

DO $$ BEGIN
  ALTER TABLE providers ADD CONSTRAINT providers_current_step_check CHECK (current_step BETWEEN 2 AND 9);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE providers ADD CONSTRAINT providers_workflow_status_check CHECK (workflow_status IN ('PENDIENTE_INSCRIPCION', 'INSCRITO', 'HOMOLOGADO'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE providers ADD CONSTRAINT providers_transition_version_check CHECK (transition_version >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE providers ADD CONSTRAINT providers_workflow_substatus_check CHECK (workflow_substatus IN (
    'REGISTRADO','ASIGNADO_EJECUTIVA','EN_COORDINACION','CERTIFICADO_EXISTENTE','DATOS_INCOMPLETOS','NO_ES_PROVEEDOR',
    'NO_UBICADO','NO_RESPONDE','DESESTIMADO','NO_PARTICIPA','PAGO_CONFIRMADO','FORMULARIO_ENVIADO','FORMULARIO_DEVUELTO',
    'INSPECTOR_ASIGNADO','VISITA_EN_COORDINACION','VISITA_REPROGRAMADA','VISITA_DESESTIMADA','NO_UBICADO_VISITA',
    'VISITA_REALIZADA','PENDIENTE_ENTREGABLES','VIGENTE','POR_VENCER','VENCIDO','LEVANTAMIENTO_OBSERVACIONES'
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS provider_status_history (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  transition_code text NOT NULL,
  from_step smallint NOT NULL,
  from_status text NOT NULL,
  from_substatus text NOT NULL,
  to_step smallint NOT NULL,
  to_status text NOT NULL,
  to_substatus text NOT NULL,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_status_history_provider_created
  ON provider_status_history(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_workflow
  ON providers(process_id, workflow_status, workflow_substatus);
