import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
const companies = [
    ['decal', 'DECAL S.A.C.', '20512345678', 'DECAL', 'María López', 'contacto@decal.com', '987654321'],
    ['ufitec', 'UFITEC S.A.C.', '20698765432', 'UFITEC', 'José Ramos', 'contacto@ufitec.com', '912345678'],
];
const demoPassword = process.env.SEED_DEMO_PASSWORD;
const supervisorPassword = process.env.SEED_SUPERVISOR_PASSWORD;
if (!demoPassword || !supervisorPassword) {
    throw new Error('SEED_DEMO_PASSWORD y SEED_SUPERVISOR_PASSWORD son obligatorias para cargar usuarios iniciales.');
}
const users = [
    ['cli-decal', 'Cliente DECAL', 'cliente@decal.com', demoPassword, 'cliente', 'decal'],
    ['eje-decal', 'Ejecutiva DECAL', 'ejecutiva@decal.com', demoPassword, 'ejecutiva', 'decal'],
    ['sup-decal', 'Supervisor DECAL', 'supervisor@decal.com', demoPassword, 'supervisor_empresa', 'decal'],
    ['cli-ufitec', 'Cliente UFITEC', 'cliente@ufitec.com', demoPassword, 'cliente', 'ufitec'],
    ['eje-ufitec', 'Ejecutiva UFITEC', 'ejecutiva@ufitec.com', demoPassword, 'ejecutiva', 'ufitec'],
    ['sup-ufitec', 'Supervisor UFITEC', 'supervisor@ufitec.com', demoPassword, 'supervisor_empresa', 'ufitec'],
    ['supervisor-general', 'Carlos Supervisor General', 'supervisor@af.com', supervisorPassword, 'supervisor_general', null],
];
async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const c of companies)
            await client.query('INSERT INTO companies(id,legal_name,tax_id,trade_name,contact_name,email,phone) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING', c);
        for (const [id, name, email, password, role, companyId] of users) {
            const hash = await bcrypt.hash(password, 12);
            await client.query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,role=EXCLUDED.role,password_hash=EXCLUDED.password_hash', [id, name, email, hash, role]);
            if (companyId)
                await client.query('INSERT INTO user_companies(user_id,company_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [id, companyId]);
        }
        await client.query(`INSERT INTO homologation_processes(id,company_id,code,name,start_date,deadline,status,executive_id) VALUES
   ('proc-decal-2026','decal','DECAL-2026-001','Homologación de proveedores 2026','2026-01-15','2026-10-30','En curso','eje-decal'),
   ('proc-ufitec-2026','ufitec','UFITEC-2026-001','Homologación anual 2026','2026-02-01','2026-11-15','En curso','eje-ufitec') ON CONFLICT(id) DO NOTHING`);
        await client.query('COMMIT');
        console.log('Datos iniciales creados.');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
seed().finally(() => pool.end());
