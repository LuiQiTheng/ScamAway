import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeTextWithGemini, analyzeScreenshotWithGemini } from '../utils/aiEngine';
import {
  analyzeScamRisk,
  extractIndicators,
  findMatchingVerifiedReports,
  analyzeScreenshotRisk,
} from '../utils/rulesEngine';

vi.mock('../utils/aiEngine', () => ({
  analyzeTextWithGemini: vi.fn(),
  analyzeScreenshotWithGemini: vi.fn(),
}));

vi.mock('../content/educationalContent', () => ({
  QUICK_TEST_PRESETS: [],
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

  it('does not turn an ordinary personal payment into a job scam', async () => {
    const result = await analyzeScamRisk('Please pay RM20 for lunch when you arrive.');

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ label }) => label.includes('Advance Fee'))).toBe(false);
  });

  it('keeps a fee-free WhatsApp recruitment post in verification', async () => {
    const result = await analyzeScamRisk(
      'Urgent hiring for an admin internship. Contact wa.me/60162518403. No fees, deposits, OTPs, or banking details are required.',
    );

    expect(result.score).toBeLessThan(30);
    expect(result.riskBand).toBe('Needs verification');
    expect(result.explanations.some(({ category }) => category === 'credentials')).toBe(false);
    expect(result.explanations.some(({ label }) => label.includes('Advance Fee'))).toBe(false);
  });

  it('understands a negated courier safety warning', async () => {
    const result = await analyzeScamRisk(
      'Pos Laju safety reminder: We will never ask you to pay RM2 through an SMS link.',
    );

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ label }) => label === 'Fake Courier Scam')).toBe(false);
  });

  it('does not classify an expected COD delivery notice as a courier scam', async () => {
    const result = await analyzeScamRisk(
      'Pos Laju delivery update for your expected order: COD RM50 is payable to the courier upon delivery.',
    );

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ label }) => label === 'Fake Courier Scam')).toBe(false);
  });

  it('does not treat an official anti-scam warning as a credential request', async () => {
    const result = await analyzeScamRisk(
      'PDRM anti-scam reminder: Never transfer money to police and do not share your OTP with anyone.',
    );

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ category }) => category === 'credentials')).toBe(false);
    expect(
      result.explanations.some(({ label }) => label.includes('Authority Impersonation')),
    ).toBe(false);
  });

  it('does not classify a legitimate MyTax reminder as authority impersonation', async () => {
    const result = await analyzeScamRisk(
      'LHDN reminder: Your tax balance is RM500. Payment is not required through this message. Sign in through the official hasil.gov.my website.',
    );

    expect(result.score).toBeLessThan(30);
    expect(
      result.explanations.some(({ label }) => label.includes('Authority Impersonation')),
    ).toBe(false);
  });

  it('does not classify a family status update without solicitation as extortion', async () => {
    const result = await analyzeScamRisk(
      'Mum is in hospital after an accident. She is stable and no payment or transfer is required. Call her directly.',
    );

    expect(result.score).toBeLessThan(30);
    expect(result.explanations.some(({ label }) => label === 'Emergency Extortion')).toBe(false);
  });

  it('does not classify a normal investment settlement as an impossible scheme', async () => {
    const result = await analyzeScamRisk(
      'Your regulated broker confirms an RM500 investment settlement. No guaranteed return is promised and no payment is requested in this message.',
    );

    expect(result.score).toBeLessThan(30);
    expect(
      result.explanations.some(({ label }) => label === 'Impossible Investment Scheme'),
    ).toBe(false);
  });

  it('normalizes Malaysian phone formats before blacklist matching', async () => {
    const result = await analyzeScamRisk('Contact 011-8762512 for details.', {
      blacklist: {
        phoneNumbers: ['+6011-8762512'],
        urls: [],
        bankAccounts: [],
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.explanations.some(({ category }) => category === 'reputation')).toBe(true);
    expect(result.explanations.map(({ text }) => text).join(' ')).not.toMatch(
      /\bofficial\b|\bverified\b/i,
    );
  });

  it('matches blacklist domains by hostname boundary, not query-string text', async () => {
    const blacklist = {
      phoneNumbers: [],
      urls: ['evil.example'],
      bankAccounts: [],
    };
    const safeResult = await analyzeScamRisk(
      'Review https://safe.example/check?next=evil.example before continuing.',
      { blacklist },
    );
    const badResult = await analyzeScamRisk(
      'Open https://login.evil.example/verify to continue.',
      { blacklist },
    );

    expect(
      safeResult.explanations.some(
        ({ category, label }) => category === 'technical' && /listed/i.test(label),
      ),
    ).toBe(false);
    expect(badResult.score).toBeGreaterThanOrEqual(80);
  });

  it('only counts community reports with the same canonical indicator', () => {
    const reports = [
      {
        id: 'unrelated',
        status: 'confirmed',
        text: 'Contact 011-9999999 about this report.',
      },
      {
        id: 'same-phone',
        status: 'confirmed',
        text: 'Reported recruiter number: 016-2518403.',
      },
    ];

    const matches = findMatchingVerifiedReports(
      'Send a resume through wa.me/60162518403.',
      reports,
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('same-phone');
    expect(matches[0].matchedIndicators).toContain('+60162518403');
  });

  it('matches indicators from the original copy when the shared report is redacted', () => {
    const reports = [
      {
        id: 'redacted-report',
        status: 'confirmed',
        text: 'Contact [REDACTED PHONE] about this report.',
        originalText: 'Contact 016-2518403 about this report.',
      },
    ];

    const matches = findMatchingVerifiedReports(
      'Send a resume through wa.me/60162518403.',
      reports,
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('redacted-report');
  });

  it('detects an affirmative scam instruction after a negated warning', async () => {
    const result = await analyzeScamRisk(
      'Part-time online job. Do not pay strangers, but pay us RM50 now to unlock your first task.',
    );

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.explanations.some(({ label }) => label === 'Advance Fee to Start a Job')).toBe(true);
  });

  it('does not double-count a single core scam archetype', async () => {
    const result = await analyzeScamRisk(
      'Investment opportunity with guaranteed profit and no risk.',
    );

    expect(result.score).toBe(85);
    expect(result.riskBand).toBe('Critical');
  });

  it('ignores an AI score outside the trusted range', async () => {
    analyzeTextWithGemini.mockResolvedValue({
      score: 999,
      riskBand: 'Critical',
      explanations: [
        {
          category: 'payment',
          label: 'Invented payment request',
          text: 'This claim is not grounded in the submitted message.',
          evidence: 'transfer all your money',
          weight: 40,
        },
      ],
    });

    const result = await analyzeScamRisk(
      'Reminder: our study group meets in the library at 3pm.',
    );

    expect(result.score).toBeLessThan(20);
    expect(result.explanations.some(({ label }) => label.includes('Invented'))).toBe(false);
  });

  it('accepts grounded AI evidence but derives the risk band internally', async () => {
    analyzeTextWithGemini.mockResolvedValue({
      score: 65,
      riskBand: 'Low evidence',
      explanations: [
        {
          category: 'payment',
          label: 'Unexpected payment request',
          text: 'The sender asks for an unexpected transfer.',
          evidence: 'transfer RM300',
          weight: 25,
        },
      ],
    });

    const result = await analyzeScamRisk(
      'Please transfer RM300 to the supplied account before we continue.',
    );

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.riskBand).toBe('High risk');
    expect(result.explanations.some(({ label }) => label.includes('Unexpected payment'))).toBe(true);
  });

  describe('Dynamic Risk Scoring (90-99 Scale) & 100% Confirmed Reports [BUG-01]', () => {
    it('directly assigns score = 100 and unshifts official confirmation badge when verified reports > 0', async () => {
      const result = await analyzeScamRisk('Please contact 011-8762512 for parcel delivery', {
        verifiedReports: 2,
        matchedVerifiedReports: [
          { id: 'rep-1', matchedIndicators: ['+6011-8762512'] }
        ]
      });

      expect(result.score).toBe(100);
      expect(result.riskBand).toBe('Critical');
      expect(result.explanations[0].label).toBe('🚨 OFFICIALLY CONFIRMED SCAM');
      expect(result.explanations[0].weight).toBe(100);
    });

    it('returns Malay confirmation badge when requested for confirmed reports', async () => {
      const result = await analyzeScamRisk('Sila hubungi 011-8762512', {
        lang: 'ms',
        verifiedReports: 1,
        matchedVerifiedReports: [
          { id: 'rep-1', matchedIndicators: ['+6011-8762512'] }
        ]
      });

      expect(result.score).toBe(100);
      expect(result.explanations[0].label).toBe('🚨 KES PENIPUAN DISAHKAN RASMI');
    });

    it('dynamically scales blacklisted indicators between 90 and 99 instead of clamping to 85', async () => {
      const blacklist = {
        phoneNumbers: ['+6011-8762512'],
        urls: [],
        bankAccounts: [],
      };

      // Base blacklisted indicator without extra threats -> base 90 (never 85)
      const baseResult = await analyzeScamRisk('Contact 011-8762512.', { blacklist });
      expect(baseResult.score).toBeGreaterThanOrEqual(90);
      expect(baseResult.score).toBeLessThanOrEqual(99);

      // Blacklist + police impersonation + transfer demand + urgency -> dynamic scale towards 99
      const compoundingResult = await analyzeScamRisk(
        'AMARAN POLIS DARI SARJAN: Waran tangkap dikeluarkan. Pindahkan RM5,000 ke akaun mahkamah segera. Hubungi 011-8762512 sekarang!',
        { blacklist }
      );
      expect(compoundingResult.score).toBeGreaterThanOrEqual(95);
      expect(compoundingResult.score).toBeLessThanOrEqual(99);
      expect(compoundingResult.score).not.toBe(85);
    });

    it('caps unconfirmed threats at 99 maximum', async () => {
      const blacklist = {
        phoneNumbers: ['+6011-8762512'],
        urls: [],
        bankAccounts: ['164228910239'],
      };

      const result = await analyzeScamRisk(
        'PDRM tangkap lokap. Bayar saman segera ke akaun 164228910239 atau lokap sekarang juga wa.me/60118762512',
        { blacklist }
      );

      expect(result.score).toBeLessThanOrEqual(99);
    });
  });

  describe('Multimodal Vision Analysis Engine [ENH-01]', () => {
    it('analyzes screenshot, merges visual forensics, and returns comprehensive risk assessment', async () => {
      analyzeScreenshotWithGemini.mockResolvedValue({
        platform: 'WhatsApp',
        sender: '+2348012345678',
        senderIsOverseas: true,
        visualRedFlags: ['Forged PDRM Crest', 'Spoofed Police Header'],
        extractedText: 'Surat Saman Mahkamah PDRM: Sila pindah wang RM500 segera',
        riskScore: 88,
        explanation: 'Forged police crest detected with overseas WhatsApp sender.'
      });

      const result = await analyzeScreenshotRisk('data:image/jpeg;base64,mockBase64Data');

      expect(analyzeScreenshotWithGemini).toHaveBeenCalled();
      expect(result.visionForensics).toBeDefined();
      expect(result.visionForensics.platform).toBe('WhatsApp');
      expect(result.visionForensics.senderIsOverseas).toBe(true);
      expect(result.explanations.some(({ label }) => label.includes('Visual Red Flags'))).toBe(true);
      expect(result.explanations.some(({ label }) => label.includes('Overseas Sender'))).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
    });

    it('defangs URLs and accurately identifies banking phishing alerts', async () => {
      const phishingMessage = 'CIMB Alert: RM2,850.00 has been charged to your account. If you did not authorize this transaction, click here immediately to cancel: https://cimb-secure[.]com';
      const result = await analyzeScamRisk(phishingMessage, { lang: 'en' });

      // Ensure defanged URL is properly extracted as cimb-secure.com
      expect(result.indicators.urls).toContain('cimb-secure.com');
      // Ensure risk score is High / Critical (>= 85)
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.explanations.some(exp => exp.category === 'phishing')).toBe(true);
    });

    it('does not flag legitimate bank SMS notifications without links as phishing', async () => {
      const legitSms = 'RM0 CIMB: RM50.00 was charged to your account ending 8899 at LOTUS STORES on 10/09/2026. If you did not authorize this, please contact customer support at 03-62047788 immediately.';
      const result = await analyzeScamRisk(legitSms, { lang: 'en' });

      // Ensure legitimate bank SMS without links is not flagged as high-risk phishing
      expect(result.score).toBeLessThan(60);
      expect(result.explanations.some(exp => exp.label.includes('Banking Phishing'))).toBe(false);
    });

    it('does not flag normal courier delivery notifications as scams', async () => {
      const courierDeliveryMessage = 'Hi, your parcel from J&T Express has been delivered to your front door today. Thank you for using our service!';
      const result = await analyzeScamRisk(courierDeliveryMessage, { lang: 'en' });

      // Normal courier delivery update should have low risk
      expect(result.score).toBeLessThan(30);
      expect(result.explanations.some(exp => exp.label.includes('Courier Scam'))).toBe(false);
    });

    it('returns score 0 and Verified Safe label for Test Safe Text preset', async () => {
      const safeText = 'Hi Aina, our study group will meet at the campus library tomorrow at 3:00 PM. Bring your notes if you can. See you there!';
      const result = await analyzeScamRisk(safeText, { lang: 'en' });

      expect(result.score).toBe(0);
      expect(result.explanations.some(exp => exp.label.includes('Verified Safe'))).toBe(true);
      expect(result.explanations.some(exp => exp.label.includes('Known Scam Pattern'))).toBe(false);
      const safeExp = result.explanations.find(exp => exp.category === 'safe');
      expect(safeExp).toBeDefined();
      expect(safeExp.weight).toBe(0);
    });

    it('returns score 10 and Precautionary Advisory for clean target bank account check', async () => {
      const result = await analyzeScamRisk('Target check request: Bank account: 114228990123.', {
        isTargetCheck: true,
        targets: { bank: '114228990123' },
        lang: 'en'
      });

      expect(result.score).toBe(10);
      expect(result.explanations.some(exp => exp.label.includes('PDRM SemakMule Check: Clean'))).toBe(true);
      expect(result.explanations.some(exp => exp.category === 'safe_advisory')).toBe(true);
      // Ensure AI conversational critique is NOT present
      expect(result.explanations.some(exp => exp.text.includes('without any further context'))).toBe(false);
    });

    it('detects CCID mule bank account in target check and returns critical/high risk', async () => {
      const result = await analyzeScamRisk('Target check request: Bank account: 1234567890.', {
        isTargetCheck: true,
        targets: { bank: '1234567890' },
        lang: 'en'
      });

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.explanations.some(exp => exp.label.includes('CCID Record Found'))).toBe(true);
    });
  });
});

