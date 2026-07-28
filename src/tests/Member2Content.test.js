import { describe, expect, it } from 'vitest';
import {
  CHEAT_SHEETS,
  QUICK_TEST_PRESETS,
  QUIZ_SCENARIOS,
} from '../content/member2Content';

describe('Member 2 learning content', () => {
  it('provides the three requested Malaysian cheat sheets', () => {
    expect(CHEAT_SHEETS).toHaveLength(3);
    expect(CHEAT_SHEETS.map((sheet) => sheet.id)).toEqual([
      'lhdn-tax',
      'pos-laju',
      'telegram-job',
    ]);
  });

  it('provides five Safe-or-Scam scenarios', () => {
    expect(QUIZ_SCENARIOS).toHaveLength(5);
    expect(QUIZ_SCENARIOS.every(({ answer }) => ['safe', 'scam'].includes(answer))).toBe(true);
  });

  it('provides scam and safe scanner presets for the live demo', () => {
    expect(QUICK_TEST_PRESETS.some(({ tone }) => tone === 'safe')).toBe(true);
    expect(QUICK_TEST_PRESETS.some(({ id }) => id === 'pos-laju')).toBe(true);
  });
});
