import { describe, expect, it } from 'vitest';
import { applyWorkflowTransition, availableTransitions, initialProviderWorkflowState, validateTransition } from './workflow.js';

describe('motor formal de homologación', () => {
  it('inicia todo proveedor en el paso 2 pendiente de inscripción', () => {
    expect(initialProviderWorkflowState).toEqual({ step: 2, status: 'PENDIENTE_INSCRIPCION', substatus: 'REGISTRADO' });
  });

  it('impide saltar directamente de registrado a pagado', () => {
    expect(validateTransition(initialProviderWorkflowState, 'REGISTRAR_PAGO', 'ejecutiva', {}).ok).toBe(false);
  });

  it('exige los datos completos del pago', () => {
    const state = { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'EN_COORDINACION' } as const;
    const result = validateTransition(state, 'REGISTRAR_PAGO', 'ejecutiva', { banco: 'BCP' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missingFields).toContain('numeroOperacion');
  });

  it('cambia automáticamente a inscrito al registrar el pago', () => {
    const state = { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'EN_COORDINACION' } as const;
    const next = applyWorkflowTransition(state, 'REGISTRAR_PAGO', 'ejecutiva', {
      banco: 'BCP', monto: 500, modalidad: 'Transferencia', fechaPago: '2026-09-01', numeroOperacion: '123', numeroFactura: 'F001-10',
    });
    expect(next).toEqual({ step: 5, status: 'INSCRITO', substatus: 'PAGO_CONFIRMADO' });
  });

  it('separa las acciones del jefe y del inspector', () => {
    const state = { step: 6, status: 'INSCRITO', substatus: 'FORMULARIO_DEVUELTO' } as const;
    expect(availableTransitions(state, 'ejecutiva')).toHaveLength(0);
    expect(availableTransitions(state, 'jefe_inspecciones').map((item) => item.code)).toEqual(['ASIGNAR_INSPECTOR']);
  });

  it('reserva los cambios de vigencia automáticos al sistema', () => {
    const state = { step: 9, status: 'HOMOLOGADO', substatus: 'VIGENTE' } as const;
    expect(validateTransition(state, 'MARCAR_POR_VENCER', 'ejecutiva').ok).toBe(false);
    expect(validateTransition(state, 'MARCAR_POR_VENCER', 'sistema').ok).toBe(true);
  });

  it('obliga a retomar coordinación antes de cambiar entre resultados alternativos del paso 4', () => {
    const state = { step: 4, status: 'PENDIENTE_INSCRIPCION', substatus: 'NO_RESPONDE' } as const;
    expect(validateTransition(state, 'MARCAR_NO_UBICADO', 'ejecutiva', { motivo: 'Nuevo intento' }).ok).toBe(false);
    expect(validateTransition(state, 'INICIAR_COORDINACION', 'ejecutiva').ok).toBe(true);
  });

  it('impide que la ejecutiva se asigne una cartera y autoriza a la supervisora general como administradora', () => {
    expect(validateTransition(initialProviderWorkflowState, 'ASIGNAR_EJECUTIVA', 'ejecutiva', { ejecutivaId: 'eje-decal' }).ok).toBe(false);
    expect(validateTransition(initialProviderWorkflowState, 'ASIGNAR_EJECUTIVA', 'supervisor_general', { ejecutivaId: 'eje-decal' }).ok).toBe(true);
  });
});
