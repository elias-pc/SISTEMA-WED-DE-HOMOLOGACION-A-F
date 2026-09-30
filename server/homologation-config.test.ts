import { describe, expect, it } from 'vitest';
import { automaticExpirationDate, normalizeHomologationConfig } from './homologation-config.js';

describe('parámetros de homologación', () => {
  it('normaliza la configuración por empresa y conserva los valores predeterminados seguros', () => {
    const config = normalizeHomologationConfig({
      filters: ['Clasificación', 'Riesgo'],
      documentTypes: [{ name: 'Certificado SSO', validityDays: 45 }],
      opinions: ['Aprobado', 'Observado'],
      evaluationModules: ['Seguridad', 'Calidad'],
    });
    expect(config).toEqual({
      filters: ['Clasificación', 'Riesgo'], documentTypes: [{ name: 'Certificado SSO', validityDays: 45 }],
      opinions: ['Aprobado', 'Observado'], evaluationModules: ['Seguridad', 'Calidad'],
    });
    expect(normalizeHomologationConfig({ documentTypes: [] }).documentTypes.length).toBeGreaterThan(0);
  });

  it('calcula el vencimiento con los días configurados', () => {
    expect(automaticExpirationDate('2026-09-11', 360)).toBe('2027-09-06');
    expect(automaticExpirationDate('fecha inválida', 45)).toBeNull();
  });
});
