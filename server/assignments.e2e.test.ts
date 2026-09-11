import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

async function login(email: string, password: string) {
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
  return agent;
}

describe('cartera e historial de ejecutivas en modo local', () => {
  it('reparte, restringe visibilidad, reasigna, retira y reporta el historial', async () => {
    const admin = await login('administradora@af.com', 'super20226ayf');
    const providerIds: string[] = [];
    for (let index = 1; index <= 4; index += 1) {
      const created = await admin.post('/api/providers').send({
        empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: `Proveedor cartera ${index} S.A.C.`,
        ruc: `2088000000${index}`, personaContacto: `Contacto ${index}`, telefonos: '999888777',
        email: `cartera${index}@prueba.test`, direccion: 'Av. Pruebas 123', departamento: 'LIMA',
        distrito: 'Lima', actividadPrincipal: 'Servicios de prueba',
      });
      expect(created.status).toBe(201);
      providerIds.push(created.body.provider.id);
    }

    const split = await admin.post('/api/assignments/distribute').send({ processId: 'proc-decal-2026', providerIds, mode: 'balanced', executiveIds: ['eje-decal', 'eje-decal-2'], reason: 'Reparto inicial de cartera' });
    expect(split.status).toBe(200);
    expect(split.body).toMatchObject({ assigned: 4, reassigned: 0, unchanged: 0, total: 4 });
    const portfolio = await admin.get('/api/assignments/portfolio').query({ processId: 'proc-decal-2026' });
    expect(portfolio.status).toBe(200);
    const createdProviders = portfolio.body.providers.filter((provider: { id: string }) => providerIds.includes(provider.id));
    expect(createdProviders.filter((provider: { assigned_executive_id: string }) => provider.assigned_executive_id === 'eje-decal')).toHaveLength(2);
    expect(createdProviders.filter((provider: { assigned_executive_id: string }) => provider.assigned_executive_id === 'eje-decal-2')).toHaveLength(2);
    expect(createdProviders.every((provider: { current_step: number; workflow_substatus: string }) => provider.current_step === 3 && provider.workflow_substatus === 'ASIGNADO_EJECUTIVA')).toBe(true);

    const executiveOne = await login('ejecutiva@decal.com', 'Ejecutiva123');
    const visible = await executiveOne.get('/api/providers').query({ processId: 'proc-decal-2026' });
    expect(visible.status).toBe(200);
    const visibleCreated = visible.body.providers.filter((provider: { id: string }) => providerIds.includes(provider.id));
    expect(visibleCreated).toHaveLength(2);
    expect(visibleCreated.every((provider: { ejecutivaAsignadaId: string }) => provider.ejecutivaAsignadaId === 'eje-decal')).toBe(true);
    expect((await executiveOne.post('/api/assignments/unassign').send({ processId: 'proc-decal-2026', providerIds: [providerIds[0]], reason: 'Intento sin permiso' })).status).toBe(403);

    const supervisor = await login('supervisor@af.com', 'super20226ayf');
    const reassigned = await supervisor.post('/api/assignments/assign').send({ processId: 'proc-decal-2026', providerIds: [providerIds[0]], executiveId: 'eje-decal-2', reason: 'Rebalanceo por carga' });
    expect(reassigned.status).toBe(200);
    expect(reassigned.body.reassigned).toBe(1);
    expect((await executiveOne.get(`/api/providers/${providerIds[0]}/workflow`)).status).toBe(403);

    const removed = await admin.post('/api/assignments/unassign').send({ processId: 'proc-decal-2026', providerIds: [providerIds[1]], reason: 'Proveedor pendiente de nueva responsable' });
    expect(removed.status).toBe(200);
    expect(removed.body.unassigned).toBe(1);
    const finalPortfolio = await admin.get('/api/assignments/portfolio').query({ processId: 'proc-decal-2026' });
    const removedProvider = finalPortfolio.body.providers.find((provider: { id: string }) => provider.id === providerIds[1]);
    expect(removedProvider).toMatchObject({ assigned_executive_id: null, current_step: 3, workflow_substatus: 'ASIGNADO_EJECUTIVA' });
    const releasedHistory = finalPortfolio.body.history.filter((item: { provider_id: string; released_at?: string }) => providerIds.includes(item.provider_id) && item.released_at);
    expect(releasedHistory.length).toBeGreaterThanOrEqual(2);

    const productivity = await admin.get('/api/reports/productivity').query({ processId: 'proc-decal-2026', from: '2026-01-01', to: '2026-12-31' });
    expect(productivity.status).toBe(200);
    expect(productivity.body.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ executiveId: 'eje-decal' }),
      expect.objectContaining({ executiveId: 'eje-decal-2' }),
    ]));
    expect(productivity.body.rows.reduce((sum: number, row: { assignedInPeriod: number }) => sum + row.assignedInPeriod, 0)).toBeGreaterThanOrEqual(5);
  });
});
