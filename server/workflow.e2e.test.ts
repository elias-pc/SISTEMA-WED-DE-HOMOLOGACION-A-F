import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

async function login(email: string, password: string) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  return agent;
}

describe('flujo formal por API en entorno local temporal', () => {
  it('recorre proveedor registrado hasta homologado vigente y conserva el historial', async () => {
    const administradora = await login('administradora@af.com', 'super20226ayf');
    const created = await administradora.post('/api/providers').send({
      empresaId: 'decal', procesoId: 'proc-decal-2026', razonSocial: 'Proveedor de prueba E2E S.A.C.',
      ruc: '20987654321', personaContacto: 'Ana Prueba', telefonos: '999888777',
      email: 'ana@prueba.test', direccion: 'Av. Pruebas 123', departamento: 'LIMA',
      distrito: 'Lima', actividadPrincipal: 'Servicios de prueba',
    });
    expect(created.status).toBe(201);
    const providerId = created.body.provider.id as string;

    const transition = async (agent: ReturnType<typeof request.agent>, transicion: string, datos: Record<string, unknown>) => {
      const workflow = await agent.get(`/api/providers/${providerId}/workflow`);
      const version = workflow.body.provider.flujo.version;
      return agent.post(`/api/providers/${providerId}/transitions`).send({ transicion, datos, version });
    };

    expect((await transition(administradora, 'ASIGNAR_EJECUTIVA', { ejecutivaId: 'eje-decal' })).status).toBe(200);
    const ejecutiva = await login('ejecutiva@decal.com', 'Ejecutiva123');
    expect((await transition(ejecutiva, 'INICIAR_COORDINACION', {})).status).toBe(200);
    expect((await transition(ejecutiva, 'REGISTRAR_PAGO', { banco: 'BCP', monto: 500, modalidad: 'Transferencia', fechaPago: '2026-09-02', numeroOperacion: 'OP-001', numeroFactura: 'F001-001' })).status).toBe(200);
    expect((await transition(ejecutiva, 'ENVIAR_FORMULARIO', { formulario: 'formulario.pdf' })).status).toBe(200);
    expect((await transition(ejecutiva, 'RECIBIR_FORMULARIO', { documentosConformes: true })).status).toBe(200);

    const jefe = await login('jefe.inspecciones@decal.com', 'Jefe123');
    expect((await transition(jefe, 'ASIGNAR_INSPECTOR', { inspectorId: 'inspector-decal' })).status).toBe(200);
    const inspector = await login('inspector@decal.com', 'Inspector123');
    expect((await transition(inspector, 'PROGRAMAR_VISITA', { fechaVisita: '2026-09-10', modalidadVisita: 'Presencial' })).status).toBe(200);
    expect((await transition(inspector, 'REGISTRAR_VISITA', { fechaVisita: '2026-09-10', informeVisita: 'informe.pdf' })).status).toBe(200);
    expect((await transition(inspector, 'CONFIRMAR_CONFORMIDAD', { documentosConformes: true })).status).toBe(200);
    expect((await transition(ejecutiva, 'EMITIR_ENTREGABLE', { tipoDocumento: 'Certificado', dictamen: 'Conforme', puntaje: 95, fechaEmision: '2026-09-11', fechaVencimiento: '2027-09-11', alcance: 'Integral' })).status).toBe(200);

    const finalWorkflow = await ejecutiva.get(`/api/providers/${providerId}/workflow`);
    expect(finalWorkflow.status).toBe(200);
    expect(finalWorkflow.body.provider.flujo).toMatchObject({ paso: 9, estado: 'HOMOLOGADO', subestado: 'VIGENTE', version: 10 });
    expect(finalWorkflow.body.historial).toHaveLength(10);

    const status = await ejecutiva.get('/api/reports/status').query({ processId: 'proc-decal-2026' });
    const reportRow = status.body.rows.find((row: { id: string }) => row.id === providerId);
    expect(reportRow).toMatchObject({
      ruc: '20987654321', tipoDocumento: 'Certificado', estado: 'HOMOLOGADO', subestado: 'VIGENTE',
      dictamen: 'Conforme', puntajeFinalPonderado: 95, fechaEmision: '2026-09-11', fechaVencimiento: '2027-09-11',
    });
    expect(reportRow.diasPorVencer).toEqual(expect.any(Number));

    const staleUpdate = await ejecutiva.post(`/api/providers/${providerId}/transitions`).send({
      transicion: 'INICIAR_OBSERVACIONES', datos: { motivo: 'Prueba de concurrencia' }, version: 9,
    });
    expect(staleUpdate.status).toBe(409);
  });
});
