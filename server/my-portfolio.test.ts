import { describe, expect, it } from 'vitest';
import { buildMyPortfolio } from './my-portfolio.js';

describe('resumen de mi cartera', () => {
  it('separa nuevos, gestión y prioridades sin duplicar proveedores', () => {
    const result = buildMyPortfolio([
      { id: 'nuevo', legalName: 'Nuevo S.A.C.', taxId: '20111111111', currentStep: 3, workflowStatus: 'PENDIENTE_INSCRIPCION', workflowSubstatus: 'ASIGNADO_EJECUTIVA', assignedAt: '2026-09-24', validUntil: null },
      { id: 'gestion', legalName: 'Gestión S.A.C.', taxId: '20222222222', currentStep: 5, workflowStatus: 'INSCRITO', workflowSubstatus: 'FORMULARIO_ENVIADO', assignedAt: '2026-09-01', validUntil: null },
      { id: 'prioridad', legalName: 'Prioridad S.A.C.', taxId: '20333333333', currentStep: 8, workflowStatus: 'INSCRITO', workflowSubstatus: 'PENDIENTE_ENTREGABLES', assignedAt: '2026-09-23', validUntil: null },
      { id: 'vence', legalName: 'Vence S.A.C.', taxId: '20444444444', currentStep: 9, workflowStatus: 'HOMOLOGADO', workflowSubstatus: 'CERTIFICADO_EMITIDO', assignedAt: '2026-08-01', validUntil: '2026-10-01' },
    ], new Date(2026, 8, 24));

    expect(result.summary).toEqual({ total: 4, newToday: 1, newWeek: 1, inProgress: 1, priority: 2 });
    expect(result.providers.map((provider) => provider.categoria)).toEqual(['nuevos', 'gestion', 'prioritarios', 'prioritarios']);
    expect(result.providers.find((provider) => provider.id === 'vence')?.alerta).toBe('Certificado vence en 7 días');
  });
});
