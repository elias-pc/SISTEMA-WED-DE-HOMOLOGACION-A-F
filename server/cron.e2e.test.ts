import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('cron local de vigencias', () => {
  it('rechaza solicitudes sin secreto y permite el trabajo autorizado', async () => {
    expect((await request(app).get('/api/cron/certificates')).status).toBe(401);
    const result = await request(app).get('/api/cron/certificates').set('Authorization', 'Bearer local-cron-test-secret');
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true });
  });
});
