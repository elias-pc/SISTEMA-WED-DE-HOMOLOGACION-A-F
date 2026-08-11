CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('cliente', 'ejecutiva', 'supervisor_empresa', 'supervisor_general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE company_status AS ENUM ('Activa', 'Inactiva', 'Archivada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE process_status AS ENUM ('Planificación', 'En curso', 'Suspendido', 'Finalizado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE provider_status AS ENUM ('Homologado', 'En proceso', 'Observado', 'Vencido'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS companies (
 id text PRIMARY KEY, legal_name text NOT NULL, tax_id varchar(11) NOT NULL UNIQUE CHECK (tax_id ~ '^[0-9]{11}$'),
 trade_name text NOT NULL, contact_name text NOT NULL, email text NOT NULL, phone text NOT NULL,
 status company_status NOT NULL DEFAULT 'Activa', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, password_hash text NOT NULL, role user_role NOT NULL,
 active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_companies (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 PRIMARY KEY (user_id, company_id)
);
CREATE TABLE IF NOT EXISTS homologation_processes (
 id text PRIMARY KEY, company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE, code text NOT NULL UNIQUE, name text NOT NULL,
 start_date date NOT NULL, deadline date NOT NULL, status process_status NOT NULL DEFAULT 'Planificación', executive_id text REFERENCES users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (deadline >= start_date)
);
CREATE TABLE IF NOT EXISTS providers (
 id text PRIMARY KEY, company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 process_id text NOT NULL REFERENCES homologation_processes(id) ON DELETE CASCADE, legal_name text NOT NULL,
 tax_id varchar(11) NOT NULL CHECK (tax_id ~ '^[0-9]{11}$'), contact_name text NOT NULL, phones text NOT NULL, email text NOT NULL,
 address text NOT NULL, department text NOT NULL, district text NOT NULL, main_activity text NOT NULL,
 status provider_status NOT NULL DEFAULT 'En proceso', executive_status text, supervisor_status text, score numeric(3,2) NOT NULL DEFAULT 0,
 registered_at date NOT NULL DEFAULT current_date, valid_until date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (process_id, tax_id)
);
CREATE TABLE IF NOT EXISTS sessions (
 id uuid PRIMARY KEY, token_hash char(64) NOT NULL UNIQUE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_processes_company ON homologation_processes(company_id);
CREATE INDEX IF NOT EXISTS idx_processes_executive ON homologation_processes(executive_id);
CREATE INDEX IF NOT EXISTS idx_providers_scope ON providers(company_id, process_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
