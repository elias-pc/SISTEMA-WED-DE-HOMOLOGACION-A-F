import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

async function login(email: string, password: string) {
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
  return agent;
}

describe('mi cartera de ejecutiva en modo local', () => {
  it('muestra únicamente los proveedores asignados a la ejecutiva y restringe otros roles', async () => {
    const executive = await login('ejecutiva@decal.com', 'Ejecutiva123');
    const response = await executive.get('/api/providers/my-portfolio').query({ processId: 'proc-decal-2026' });

    expect(response.status).toBe(200);
    expect(response.body.summary.total).toBe(1);
    expect(response.body.providers).toEqual([expect.objectContaining({ id: 'p-001', razonSocial: 'Soluciones A&F SAC' })]);

    const client = await login('cliente@decal.com', 'Cliente123');
    expect((await client.get('/api/providers/my-portfolio').query({ processId: 'proc-decal-2026' })).status).toBe(403);
  });
});
