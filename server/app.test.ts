import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('API local y serverless', () => {
  it('reporta el almacenamiento disponible', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', storage: 'memory' });
  });

  it('autentica al supervisor desde localhost y crea una cookie segura', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:4173')
      .send({ email: 'supervisor@af.com', password: 'super20226ayf' });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('supervisor_general');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });

  it('rechaza operaciones desde un origen externo', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://sitio-no-autorizado.example')
      .send({ email: 'supervisor@af.com', password: 'super20226ayf' });
    expect(response.status).toBe(403);
  });
});
