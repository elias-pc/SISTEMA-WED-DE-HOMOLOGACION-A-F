import { describe, expect, it } from 'vitest';
import { expiryTransition } from './certificate-expiry.js';

describe('automatización de vigencia', () => {
  const today = new Date('2026-09-03T12:00:00Z');
  it('marca por vencer solo dentro de 45 días', () => {
    expect(expiryTransition('VIGENTE', '2026-10-18', today)).toBe('MARCAR_POR_VENCER');
    expect(expiryTransition('VIGENTE', '2026-10-19', today)).toBeNull();
  });
  it('marca vencido sin permitir que el sistema altere otros estados', () => {
    expect(expiryTransition('POR_VENCER', '2026-09-02', today)).toBe('MARCAR_VENCIDO');
    expect(expiryTransition('LEVANTAMIENTO_OBSERVACIONES', '2026-09-02', today)).toBeNull();
  });
});
