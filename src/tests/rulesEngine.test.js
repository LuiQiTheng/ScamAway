import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeTextWithGemini } from '../utils/aiEngine';
import { analyzeScamRisk, extractIndicators } from '../utils/rulesEngine';

vi.mock('../utils/aiEngine', () => ({
  analyzeTextWithGemini: vi.fn(),
}));

const urgentHiringPost = `Urgent Hiring (Full-time / Part-time)
Penang, Melaka, Negeri Sembilan, KL, Selangor & Johor
WFH / Hybrid / Office
Positions: Admin, Customer Service, Sales, Accountant, Content Creator, UX/UI and Web Developer.
Internship available for Finance, Marketing, Business, Accounting and HR.
Requirements: SPM pass, able to speak/read/write Chinese, Malaysian only.
Send resume to Mingxing: wa.me/60162518403`;

describe('Context-aware scam detection engine', () => {
  beforeEach(() => {
    analyzeTextWithGemini.mockResolvedValue(null);
  });

  it('treats Urgent Hiring as a job title rather than immediate pressure', async () => {
    const result = await analyzeScamRisk(urgentHiringPost);

    expect(result.context).toMatchObject({
      type: 'job_post',
      verificationStatus: 'unverified',
      hasWhatsAppLink: true,
    });
    expect(result.riskBand).toBe('Needs verification');
    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ category }) => category === 'urgency')).toBe(false);
  });

  it('explains that wa.me is a contact link requiring recruiter verification', async () => {
    const result = await analyzeScamRisk(urgentHiringPost);
    const whatsappExplanation = result.explanations.find(
      ({ category }) => category === 'contact',
    );

    expect(result.indicators.urls).toContain('wa.me');
    expect(whatsappExplanation?.label).toBe('WhatsApp Contact Link');
    expect(whatsappExplanation?.text).toContain('not proof of a scam');
    expect(result.explanations.some(({ label }) => label.includes('Unregistered'))).toBe(false);
  });

  it('flags a job post that requires an advance activation deposit', async () => {
    const result = await analyzeScamRisk(
      'Part-time job: earn RM500 daily for simple online tasks. Pay RM100 registration deposit now to start. Contact wa.me/60123456789.',
    );

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.explanations.some(({ label }) => label === 'Advance Fee to Start a Job')).toBe(true);
    expect(result.explanations.some(({ category }) => category === 'urgency')).toBe(true);
  });

  it('detects explicit Malay urgency and legal threats', async () => {
    const result = await analyzeScamRisk(
      'AMARAN LHDN: Waran tangkap akan dikeluarkan. Bayar sekarang untuk mengelakkan tindakan undang-undang.',
    );

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.explanations.some(({ category }) => category === 'threat')).toBe(true);
    expect(result.explanations.some(({ category }) => category === 'urgency')).toBe(true);
  });

  it('detects a family emergency impersonation pattern', async () => {
    const result = await analyzeScamRisk(
      "Mum, my phone is broken and this is my new number. Transfer RM1,000 to my friend's account and don't call.",
    );

    expect(result.score).toBeGreaterThanOrEqual(45);
    expect(result.explanations.some(({ label }) => label === 'Family Impersonation Pattern')).toBe(true);
    expect(result.explanations.some(({ category }) => category === 'secrecy')).toBe(true);
  });

  it('extracts URLs and Malaysian phone numbers', () => {
    const analysis = extractIndicators(
      'Check https://pos-laju.info or contact wa.me/60162518403 and 011-8762512.',
    );

    expect(analysis.urls).toEqual(expect.arrayContaining(['pos-laju.info', 'wa.me']));
    expect(analysis.phones).toEqual(
      expect.arrayContaining(['60162518403', '011-8762512']),
    );
  });

  it('caps AI escalation for an ordinary unverified job post', async () => {
    analyzeTextWithGemini.mockResolvedValue({
      score: 88,
      explanations: [
        {
          category: 'urgency',
          label: 'Urgent wording',
          text: 'The title says urgent.',
          weight: 20,
        },
        {
          category: 'phishing',
          label: 'WhatsApp link',
          text: 'The message contains wa.me.',
          weight: 25,
        },
      ],
    });

    const result = await analyzeScamRisk(urgentHiringPost);

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ category }) => category === 'urgency')).toBe(false);
    expect(result.explanations.some(({ category }) => category === 'phishing')).toBe(false);
  });

  it('returns Malay verification guidance when requested', async () => {
    const result = await analyzeScamRisk(urgentHiringPost, { lang: 'ms' });

    expect(result.riskBand).toBe('Perlu Pengesahan');
    expect(result.recommendedActions[0]).toContain('SSM');
    expect(result.explanations.some(({ label }) => label === 'Pautan Hubungan WhatsApp')).toBe(true);
  });
});
