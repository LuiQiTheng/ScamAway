# ScamShield Accuracy Benchmark

This benchmark checks whether the deterministic ScamShield rule engine can
separate common Malaysian scam patterns from ordinary or safety-focused
messages.

## What it measures

- **Precision:** Of messages classified as scams, how many benchmark labels are
  scams?
- **Recall:** Of labelled scams, how many does the engine detect?
- **False-positive rate:** Of labelled safe messages, how many are incorrectly
  classified as scams?
- **F1:** A balance between precision and recall.

A message counts as a positive scam detection when its Risk Index is at least
`60/100`.

## Important limitation

The messages in `src/data/accuracyBenchmark.js` are curated, synthetic
regression fixtures. They contain no real victim information and no active
malicious links. Results from this benchmark must not be presented as
production accuracy or as proof that ScamShield can guarantee whether a
message is safe.

Before deployment, the team should evaluate a larger, independently labelled
dataset reviewed by Malaysian fraud specialists. The production evaluation
should report sample size, category distribution, precision, recall,
false-positive rate, false-negative rate, and confidence intervals.

## Running the benchmark

The project test command is non-watch:

```powershell
npm run test:accuracy
```
