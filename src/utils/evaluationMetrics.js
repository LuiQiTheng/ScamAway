export const DEFAULT_SCAM_THRESHOLD = 60;

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate binary evaluation metrics from labelled risk-index results.
 *
 * Expected item shape:
 * { expected: 'scam' | 'safe', score: number }
 */
export function calculateEvaluationMetrics(
  results,
  threshold = DEFAULT_SCAM_THRESHOLD,
) {
  if (!Array.isArray(results)) {
    throw new TypeError('Evaluation results must be an array.');
  }
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    throw new RangeError('Evaluation threshold must be between 0 and 100.');
  }

  const confusionMatrix = {
    truePositive: 0,
    trueNegative: 0,
    falsePositive: 0,
    falseNegative: 0,
  };

  for (const result of results) {
    if (!result || !['scam', 'safe'].includes(result.expected)) {
      throw new TypeError('Each result must have an expected scam or safe label.');
    }
    if (typeof result.score !== 'number' || !Number.isFinite(result.score)) {
      throw new TypeError('Each result must have a finite numeric score.');
    }

    const expectedScam = result.expected === 'scam';
    const predictedScam = result.score >= threshold;

    if (expectedScam && predictedScam) confusionMatrix.truePositive += 1;
    else if (!expectedScam && !predictedScam) confusionMatrix.trueNegative += 1;
    else if (!expectedScam && predictedScam) confusionMatrix.falsePositive += 1;
    else confusionMatrix.falseNegative += 1;
  }

  const {
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
  } = confusionMatrix;
  const precision = safeDivide(truePositive, truePositive + falsePositive);
  const recall = safeDivide(truePositive, truePositive + falseNegative);
  const falsePositiveRate = safeDivide(
    falsePositive,
    falsePositive + trueNegative,
  );
  const accuracy = safeDivide(
    truePositive + trueNegative,
    results.length,
  );
  const f1 = safeDivide(2 * precision * recall, precision + recall);

  return {
    threshold,
    sampleSize: results.length,
    confusionMatrix,
    precision,
    recall,
    falsePositiveRate,
    accuracy,
    f1,
  };
}
