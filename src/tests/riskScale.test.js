import { describe, expect, it } from 'vitest';
import { getRiskBand } from '../utils/riskScale';

describe('shared risk-index scale', () => {
  it.each([
    [0, 'Low evidence'],
    [19, 'Low evidence'],
    [20, 'Needs verification'],
    [39, 'Needs verification'],
    [40, 'Caution'],
    [59, 'Caution'],
    [60, 'High risk'],
    [79, 'High risk'],
    [80, 'Critical'],
    [100, 'Critical'],
  ])('maps %i to %s', (score, expected) => {
    expect(getRiskBand(score, 'en').label).toBe(expected);
  });

  it('uses the same thresholds for Malay labels', () => {
    expect(getRiskBand(20, 'ms').label).toBe('Perlu Pengesahan');
    expect(getRiskBand(80, 'ms').label).toBe('Kritikal');
  });
});
