-- Completa el historial de asignaciones para carteras y productividad.

ALTER TABLE provider_assignments
  ADD COLUMN IF NOT EXISTS released_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS release_reason text;

CREATE INDEX IF NOT EXISTS idx_provider_assignments_process_period
  ON provider_assignments(provider_id, assignment_role, assigned_at, released_at);

-- Conserva las asignaciones existentes antes de habilitar reasignación y retiro.
INSERT INTO provider_assignments(id, provider_id, assignment_role, assigned_user_id, assigned_at, reason)
SELECT concat('legacy-executive-', p.id), p.id, 'ejecutiva', p.assigned_executive_id, p.updated_at,
       'Asignación recuperada del proveedor existente.'
FROM providers p
WHERE p.assigned_executive_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM provider_assignments a
    WHERE a.provider_id=p.id AND a.assignment_role='ejecutiva' AND a.released_at IS NULL
  )
ON CONFLICT(id) DO NOTHING;
