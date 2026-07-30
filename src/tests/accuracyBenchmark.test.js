import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeTextWithGemini } from '../utils/aiEngine';
import { ACCURACY_BENCHMARK } from '../data/accuracyBenchmark';
import {
  calculateEvaluationMetrics,
  DEFAULT_SCAM_THRESHOLD,
} from '../utils/evaluationMetrics';
import { analyzeScamRisk } from '../utils/rulesEngine';

vi.mock('../utils/aiEngine', () => ({
  analyzeTextWithGemini: vi.fn(),
}));

describe('Malaysian scam accuracy benchmark', () => {
  beforeEach(() => {
    analyzeTextWithGemini.mockResolvedValue(null);
  });

  it('meets the minimum deterministic rule-engine quality gates', async () => {
    const evaluatedCases = await Promise.all(
      ACCURACY_BENCHMARK.map(async (benchmarkCase) => {
        const result = await analyzeScamRisk(benchmarkCase.message, {
          lang: benchmarkCase.language,
        });

        return {
          id: benchmarkCase.id,
          expected: benchmarkCase.label,
          score: result.riskIndex,
          riskBand: result.riskBand,
        };
      }),
    );

    const metrics = calculateEvaluationMetrics(
      evaluatedCases,
      DEFAULT_SCAM_THRESHOLD,
    );
    const errors = evaluatedCases.filter(({ expected, score }) =>
      expected === 'scam'
        ? score < DEFAULT_SCAM_THRESHOLD
        : score >= DEFAULT_SCAM_THRESHOLD,
    );

    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(metrics.precision).toBeGreaterThanOrEqual(0.9);
    expect(metrics.recall).toBeGreaterThanOrEqual(0.9);
    expect(metrics.falsePositiveRate).toBeLessThanOrEqual(0.1);
    expect(metrics.f1).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps the benchmark balanced and free of duplicate IDs', () => {
    const scamCount = ACCURACY_BENCHMARK.filter(
      ({ label }) => label === 'scam',
    ).length;
    const safeCount = ACCURACY_BENCHMARK.filter(
      ({ label }) => label === 'safe',
    ).length;
    const uniqueIds = new Set(ACCURACY_BENCHMARK.map(({ id }) => id));

    expect(scamCount).toBe(safeCount);
    expect(uniqueIds.size).toBe(ACCURACY_BENCHMARK.length);
  });
});
