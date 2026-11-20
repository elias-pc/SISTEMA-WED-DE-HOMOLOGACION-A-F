import { describe, expect, it } from 'vitest';
import { isoDate, mapProcess } from './mappers.js';

describe('fechas de PostgreSQL', () => {
  it('convierte objetos Date a AAAA-MM-DD', () => {
    expect(isoDate(new Date('2026-11-30T00:00:00.000Z'))).toBe('2026-11-30');
    expect(isoDate('2026-11-30')).toBe('2026-11-30');
    expect(mapProcess({ start_date: new Date('2026-11-20T00:00:00.000Z'), deadline: new Date('2027-03-31T00:00:00.000Z') }).fechaInicio).toBe('2026-11-20');
  });
});
