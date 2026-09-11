-- Registros operativos normalizados para el flujo de homologación.
-- Las tablas conservan el historial del expediente; no sustituyen provider_status_history.

CREATE TABLE IF NOT EXISTS provider_assignments (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  assignment_role text NOT NULL CHECK (assignment_role IN ('ejecutiva', 'inspector')),
  assigned_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  reason text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_assignment_active_role
  ON provider_assignments(provider_id, assignment_role) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_provider_assignments_user_active
  ON provider_assignments(assigned_user_id, assigned_at DESC) WHERE released_at IS NULL;

CREATE TABLE IF NOT EXISTS provider_payments (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  bank text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  modality text NOT NULL,
  paid_on date NOT NULL,
  operation_number text NOT NULL,
  invoice_number text NOT NULL,
  registered_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, operation_number)
);

CREATE TABLE IF NOT EXISTS provider_forms (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  form_name text NOT NULL,
  sent_at timestamptz,
  received_at timestamptz,
  documents_conform boolean,
  registered_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_inspections (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  inspector_id text REFERENCES users(id) ON DELETE SET NULL,
  modality text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('PROGRAMADA', 'REPROGRAMADA', 'NO_UBICADO', 'DESESTIMADA', 'REALIZADA', 'CONFORME')),
  reason text,
  report_reference text,
  documents_conform boolean,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_inspections_provider ON provider_inspections(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_inspections_inspector ON provider_inspections(inspector_id, scheduled_at);

CREATE TABLE IF NOT EXISTS provider_documents (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category text NOT NULL,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size >= 0),
  storage_driver text NOT NULL,
  storage_key text NOT NULL,
  uploaded_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  expires_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, storage_key)
);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider ON provider_documents(provider_id, category, created_at DESC);

CREATE TABLE IF NOT EXISTS provider_attributes (
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value text NOT NULL,
  PRIMARY KEY(provider_id, attribute_key)
);
CREATE INDEX IF NOT EXISTS idx_provider_attributes_filter ON provider_attributes(attribute_key, attribute_value);

CREATE TABLE IF NOT EXISTS provider_certificates (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  opinion text NOT NULL,
  score numeric(5,2),
  issued_on date NOT NULL,
  expires_on date NOT NULL CHECK (expires_on >= issued_on),
  scope text NOT NULL,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_summary text,
  issued_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_certificates_expiry ON provider_certificates(expires_on);

CREATE TABLE IF NOT EXISTS provider_contact_preferences (
  provider_id text PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  whatsapp_phone text,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  whatsapp_opt_in_at timestamptz,
  whatsapp_opt_in_source text,
  updated_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_import_batches (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_id text NOT NULL REFERENCES homologation_processes(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  imported_rows integer NOT NULL DEFAULT 0,
  rejected_rows integer NOT NULL DEFAULT 0,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_import_rows (
  id text PRIMARY KEY,
  batch_id text NOT NULL REFERENCES provider_import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('IMPORTADA', 'RECHAZADA')),
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider_id text REFERENCES providers(id) ON DELETE SET NULL,
  UNIQUE(batch_id, row_number)
);

CREATE TABLE IF NOT EXISTS provider_notifications (
  id text PRIMARY KEY,
  provider_id text NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('WHATSAPP')),
  template_code text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('PENDIENTE', 'OMITIDA', 'ENVIADA', 'ENTREGADA', 'LEIDA', 'FALLIDA', 'CANCELADA')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  failure_reason text,
  created_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_notifications_dispatch ON provider_notifications(status, scheduled_for, created_at);

CREATE TABLE IF NOT EXISTS provider_notification_events (
  id text PRIMARY KEY,
  notification_id text NOT NULL REFERENCES provider_notifications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);
