import { describe, expect, it } from 'vitest';
import { calculateEvaluationMetrics } from '../utils/evaluationMetrics';

describe('accuracy evaluation metrics', () => {
  it('calculates the confusion matrix and standard metrics', () => {
    const metrics = calculateEvaluationMetrics([
      { expected: 'scam', score: 90 },
      { expected: 'scam', score: 30 },
      { expected: 'safe', score: 75 },
      { expected: 'safe', score: 5 },
    ]);

    expect(metrics.confusionMatrix).toEqual({
      truePositive: 1,
      trueNegative: 1,
      falsePositive: 1,
      falseNegative: 1,
    });
    expect(metrics.precision).toBe(0.5);
    expect(metrics.recall).toBe(0.5);
    expect(metrics.falsePositiveRate).toBe(0.5);
    expect(metrics.accuracy).toBe(0.5);
    expect(metrics.f1).toBe(0.5);
  });

  it('returns zero instead of NaN when a metric has no denominator', () => {
    const metrics = calculateEvaluationMetrics([
      { expected: 'safe', score: 5 },
    ]);

    expect(metrics.precision).toBe(0);
    expect(metrics.recall).toBe(0);
    expect(metrics.f1).toBe(0);
  });

  it('rejects malformed labels, scores, and thresholds', () => {
    expect(() =>
      calculateEvaluationMetrics([{ expected: 'unknown', score: 50 }]),
    ).toThrow(TypeError);
    expect(() =>
      calculateEvaluationMetrics([{ expected: 'safe', score: '5' }]),
    ).toThrow(TypeError);
    expect(() => calculateEvaluationMetrics([], 101)).toThrow(RangeError);
  });
});
