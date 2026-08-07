import { describe, expect, it } from 'vitest';
import { SCAM_CATEGORIES, getCategoryLabel } from '../config/categories';

describe('scam categories configuration', () => {
  it('defines the 6 canonical scam categories', () => {
    const ids = SCAM_CATEGORIES.map(c => c.id);
    expect(ids).toEqual([
      'phishing',
      'parcel',
      'job',
      'emergency',
      'marketplace',
      'finance',
    ]);
  });

  it('translates category IDs using provided translation function', () => {
    const mockT = (key) => {
      const translations = {
        'report.cat_phishing': 'Phishing / Suspicious Link',
        'report.cat_parcel': 'Courier / Parcel scam',
        'report.cat_job': 'Part-time Job offer',
        'report.cat_emergency': 'Family emergency impersonation',
        'report.cat_marketplace': 'Off-platform trading / Marketplace scam',
        'report.cat_finance': 'Mule Bank accounts / Finance bait',
      };
      return translations[key] || key;
    };

    expect(getCategoryLabel('phishing', mockT)).toBe('Phishing / Suspicious Link');
    expect(getCategoryLabel('emergency', mockT)).toBe('Family emergency impersonation');
    expect(getCategoryLabel('marketplace', mockT)).toBe('Off-platform trading / Marketplace scam');
    expect(getCategoryLabel('finance', mockT)).toBe('Mule Bank accounts / Finance bait');
  });

  it('provides a fallback capitalized string for unknown categories or missing translation function', () => {
    expect(getCategoryLabel('custom_scam')).toBe('Custom_scam');
    expect(getCategoryLabel('')).toBe('');
  });
});
