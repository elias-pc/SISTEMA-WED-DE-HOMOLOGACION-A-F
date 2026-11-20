-- Registro de correcciones de los datos de un proveedor (quién cambió qué dato, valor anterior y nuevo).
CREATE TABLE IF NOT EXISTS provider_data_changes (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  changed_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  changed_by_role text NOT NULL,
  field text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_data_changes_provider ON provider_data_changes(provider_id, created_at DESC);
