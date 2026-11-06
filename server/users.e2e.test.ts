import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

async function login(email: string, password: string) {
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
  return agent;
}

describe('asociación de ejecutivas a empresas en modo local', () => {
  it('permite ampliar empresas, asignar proveedores y protege asociaciones con cartera activa', async () => {
    const admin = await login('administradora@af.com', 'super20226ayf');
    const initial = await admin.get('/api/users/executives');
    expect(initial.status).toBe(200);
    expect(initial.body.users).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'eje-decal-2', empresaIds: ['decal'] }),
    ]));

    const linked = await admin.patch('/api/users/eje-decal-2/companies').send({ empresaIds: ['decal', 'ufitec'] });
    expect(linked.status).toBe(200);
    expect(linked.body.user.empresaIds).toEqual(['decal', 'ufitec']);

    const ufitecPortfolio = await admin.get('/api/assignments/portfolio').query({ processId: 'proc-ufitec-2026' });
    expect(ufitecPortfolio.body.executives).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'eje-decal-2' }),
    ]));

    const created = await admin.post('/api/providers').send({
      empresaId: 'ufitec', procesoId: 'proc-ufitec-2026', razonSocial: 'Proveedor de prueba multempresa S.A.C.',
      ruc: '20987654321', personaContacto: 'Contacto de prueba', telefonos: '999888777', email: 'multiempresa@prueba.test',
      direccion: 'Av. Prueba 100', departamento: 'LIMA', distrito: 'Lima', actividadPrincipal: 'Servicios',
    });
    expect(created.status).toBe(201);
    const providerId = created.body.provider.id as string;
    const assigned = await admin.post('/api/assignments/assign').send({
      processId: 'proc-ufitec-2026', providerIds: [providerId], executiveId: 'eje-decal-2', reason: 'Prueba de asociación a empresa',
    });
    expect(assigned.status).toBe(200);
    expect(assigned.body.assigned).toBe(1);

    const blockedRemoval = await admin.patch('/api/users/eje-decal-2/companies').send({ empresaIds: ['decal'] });
    expect(blockedRemoval.status).toBe(409);
    expect(blockedRemoval.body.error).toContain('proveedor(es) asignado(s)');

    const unassigned = await admin.post('/api/assignments/unassign').send({
      processId: 'proc-ufitec-2026', providerIds: [providerId], executiveId: 'eje-decal-2', reason: 'Fin de prueba',
    });
    expect(unassigned.status).toBe(200);
    expect((await admin.patch('/api/users/eje-decal-2/companies').send({ empresaIds: ['decal'] })).status).toBe(200);

    const client = await login('cliente@decal.com', 'Cliente123');
    expect((await client.patch('/api/users/eje-decal-2/companies').send({ empresaIds: ['decal', 'ufitec'] })).status).toBe(403);
  });
});
