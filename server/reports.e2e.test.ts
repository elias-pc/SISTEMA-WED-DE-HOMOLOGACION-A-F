import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('reportes operativos locales', () => {
  it('entrega indicadores y una exportación tabular del proceso autorizado', async () => {
    const agent = request.agent(app);
    expect((await agent.post('/api/auth/login').send({ email: 'ejecutiva@decal.com', password: 'Ejecutiva123' })).status).toBe(200);
    const dashboard = await agent.get('/api/reports/dashboard').query({ processId: 'proc-decal-2026' });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body).toMatchObject({ total: 1, datos_incompletos: 0, desestimados: 0, no_son_proveedores: 0 });
    const report = await agent.get('/api/reports/operational').query({ processId: 'proc-decal-2026', type: 'directorio' });
    expect(report.status).toBe(200);
    expect(report.body.columns).toContain('Estado');
    expect(report.body.rows).toHaveLength(1);
    const status = await agent.get('/api/reports/status').query({ processId: 'proc-decal-2026' });
    expect(status.status).toBe(200);
    expect(status.body.rows).toHaveLength(1);
    expect(status.body.rows[0]).toMatchObject({ ruc: '20501234567', razonSocial: 'Soluciones A&F SAC', estado: 'INSCRITO', subestado: 'VISITA_EN_COORDINACION' });
  });
});
