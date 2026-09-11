import { describe, expect, it } from 'vitest';
import { buildBalancedAssignmentPlan, buildQuantityAssignmentPlan } from './assignment-planning.js';

describe('planificación de carteras', () => {
  it('reparte una cartera de forma equilibrada y determinista', () => {
    const plan = buildBalancedAssignmentPlan(['p1', 'p2', 'p3', 'p4', 'p5'], ['e1', 'e2']);
    expect(plan.filter((item) => item.executiveId === 'e1')).toHaveLength(3);
    expect(plan.filter((item) => item.executiveId === 'e2')).toHaveLength(2);
    expect(plan.map((item) => item.providerId)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('respeta cantidades explícitas', () => {
    const plan = buildQuantityAssignmentPlan(['p1', 'p2', 'p3'], [
      { executiveId: 'e1', quantity: 1 },
      { executiveId: 'e2', quantity: 2 },
    ]);
    expect(plan).toEqual([
      { providerId: 'p1', executiveId: 'e1' },
      { providerId: 'p2', executiveId: 'e2' },
      { providerId: 'p3', executiveId: 'e2' },
    ]);
  });

  it('rechaza cantidades que no cubren toda la selección', () => {
    expect(() => buildQuantityAssignmentPlan(['p1', 'p2'], [{ executiveId: 'e1', quantity: 1 }])).toThrow('deben sumar 2');
  });
});
