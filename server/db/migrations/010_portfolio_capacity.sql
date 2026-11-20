-- Capacidad de cartera por ejecutiva: cuántos proveedores puede atender. La barra de carga de
-- «Cartera de ejecutivas» se calcula contra este valor (si es NULL se usa 40 por defecto).
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_capacity integer;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_portfolio_capacity_check;
ALTER TABLE users ADD CONSTRAINT users_portfolio_capacity_check CHECK (portfolio_capacity IS NULL OR portfolio_capacity BETWEEN 1 AND 1000);
