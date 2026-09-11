import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('reportes operativos locales', () => {
  it('entrega indicadores y una exportación tabular del proceso autorizado', async () => {
    const agent = request.agent(app);
    expect((await agent.post('/api/auth/login').send({ email: 'ejecutiva@decal.com', password: 'Ejecutiva123' })).status).toBe(200);
    const dashboard = await agent.get('/api/reports/dashboard').query({ processId: 'proc-decal-2026' });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body).toMatchObject({ total: 1 });
    const report = await agent.get('/api/reports/operational').query({ processId: 'proc-decal-2026', type: 'directorio' });
    expect(report.status).toBe(200);
    expect(report.body.columns).toContain('Estado');
    expect(report.body.rows).toHaveLength(1);
  });
});
