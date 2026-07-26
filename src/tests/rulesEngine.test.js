import { describe, it, expect } from 'vitest';
import { extractIndicators, analyzeScamRisk } from '../utils/rulesEngine';

describe('Bilingual Scam Detection Engine', () => {
  
  it('should detect Malay urgency and threat keywords', () => {
    const text = 'AMARAN: LHDN mendapati anda mempunyai tunggakan cukai. Waran tangkap akan dikeluarkan dengan segera. Sila hubungi kami sekarang.';
    const result = analyzeScamRisk(text);
    
    expect(result.score).toBeGreaterThan(60); // Should trigger high score due to threat and urgency
    expect(result.explanations.some(e => e.category === 'threat')).toBe(true);
    expect(result.explanations.some(e => e.category === 'urgency')).toBe(true);
  });

  it('should detect English impossible ROI investment scams', () => {
    const text = 'Give RM100 and you will receive a guaranteed return of RM10000 in just 30 minutes!';
    const result = analyzeScamRisk(text);
    
    expect(result.score).toBeGreaterThan(70);
    expect(result.explanations.some(e => e.label.includes('Impossible Investment'))).toBe(true);
  });

  it('should detect Malay family emergency impersonation', () => {
    const text = 'Mak, telefon saya rosak. Ini nombor baru. Tolong bank in duit ke akaun kawan saya segera untuk bayar bil hospital.';
    const result = analyzeScamRisk(text);

    expect(result.score).toBeGreaterThan(50);
    expect(result.explanations.some(e => e.category === 'impersonation')).toBe(true);
  });

  it('should flag URLs and phone numbers correctly', () => {
    const text = 'Sila semak bungkusan anda di https://pos-laju.info atau hubungi 011-8762512.';
    const analysis = extractIndicators(text);
    
    expect(analysis.urls).toContain('pos-laju.info');
    expect(analysis.phones).toContain('011-8762512');
  });

  it('should output BM strings when lang is ms', () => {
    const text = 'Mak, telefon saya rosak. Ini nombor baru. Tolong bank in duit ke akaun kawan saya segera untuk bayar bil hospital.';
    const result = analyzeScamRisk(text, { lang: 'ms' });

    expect(result.riskBand).toBe('Berisiko tinggi');
    expect(result.explanations.some(e => e.label === 'Umpan Penyamaran Keluarga')).toBe(true);
    expect(result.recommendedActions[0]).toBe('Jangan bayar atau kongsi kelayakan dalam apa jua keadaan.');
  });

});
