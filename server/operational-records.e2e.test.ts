import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

async function login(email: string, password: string) {
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ email, password })).status).toBe(200);
  return agent;
}

describe('expediente operativo en modo local', () => {
  it('persiste pago, consentimiento y notificación preparada sin llamar a Meta', async () => {
    const admin = await login('administradora@af.com', 'super20226ayf');
    const created = await admin.post('/api/providers').send({
      empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Expediente Local SAC', ruc: '20876543210', personaContacto: 'Ana', telefonos: '999888777', email: 'ana@local.test', direccion: 'Av. Local 1', departamento: 'Lima', distrito: 'Lima', actividadPrincipal: 'Servicios',
    });
    const providerId = created.body.provider.id as string;
    const transition = async (agent: ReturnType<typeof request.agent>, transicion: string, datos: Record<string, unknown>) => {
      const workflow = await agent.get(`/api/providers/${providerId}/workflow`);
      return agent.post(`/api/providers/${providerId}/transitions`).send({ transicion, datos, version: workflow.body.provider.flujo.version });
    };
    expect((await transition(admin, 'ASIGNAR_EJECUTIVA', { ejecutivaId: 'eje-decal' })).status).toBe(200);
    const executive = await login('ejecutiva@decal.com', 'Ejecutiva123');
    expect((await transition(executive, 'INICIAR_COORDINACION', {})).status).toBe(200);
    expect((await transition(executive, 'REGISTRAR_PAGO', { banco: 'BCP', monto: 250, modalidad: 'Transferencia', fechaPago: '2026-09-03', numeroOperacion: 'OP-LOCAL-1', numeroFactura: 'F001-LOCAL' })).status).toBe(200);
    expect((await executive.put(`/api/providers/${providerId}/contact-preferences`).send({ whatsappPhone: '51999888777', whatsappOptIn: true, whatsappOptInSource: 'Formulario firmado' })).status).toBe(200);

    const dossier = await executive.get(`/api/providers/${providerId}/dossier`);
    expect(dossier.status).toBe(200);
    expect(dossier.body.payments).toHaveLength(1);
    expect(dossier.body.contactPreferences).toMatchObject({ whatsapp_phone: '51999888777', whatsapp_opt_in: true });
    expect(dossier.body.notifications).toEqual(expect.arrayContaining([expect.objectContaining({ template_code: 'INVITACION_INICIAL', status: 'OMITIDA' })]));
  });
});
