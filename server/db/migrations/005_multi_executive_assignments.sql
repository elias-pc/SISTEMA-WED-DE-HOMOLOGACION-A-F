-- Un proveedor puede ser atendido por más de una ejecutiva simultáneamente.
-- Los inspectores conservan su restricción de una asignación activa por proveedor.
DROP INDEX IF EXISTS idx_provider_assignment_active_role;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_assignment_active_executive
  ON provider_assignments(provider_id, assignment_role, assigned_user_id)
  WHERE released_at IS NULL AND assignment_role='ejecutiva';

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_assignment_active_inspector
  ON provider_assignments(provider_id, assignment_role)
  WHERE released_at IS NULL AND assignment_role='inspector';
