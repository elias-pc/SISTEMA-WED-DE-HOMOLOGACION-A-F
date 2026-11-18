-- Roles reales de A&F: Administrador, Jefe de inspectores, Ejecutiva, Inspector y Cliente.
-- El Supervisor general pasa a ser Administrador y el Supervisor de empresa pasa a ser Inspector.
-- Los valores antiguos se mantienen en el tipo user_role (PostgreSQL no permite quitarlos sin recrearlo),
-- pero una restricción impide volver a usarlos.
UPDATE users SET role = 'administradora' WHERE role = 'supervisor_general';
UPDATE users SET role = 'inspector' WHERE role = 'supervisor_empresa';
UPDATE users SET name = regexp_replace(name, '^Supervisor ', 'Inspector ') WHERE role = 'inspector' AND name LIKE 'Supervisor %';
UPDATE users SET name = regexp_replace(name, 'Supervisor General', 'Administrador') WHERE role = 'administradora' AND name LIKE '%Supervisor General%';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_vigente;
ALTER TABLE users ADD CONSTRAINT users_role_vigente
  CHECK (role IN ('administradora', 'jefe_inspecciones', 'ejecutiva', 'inspector', 'cliente'));
