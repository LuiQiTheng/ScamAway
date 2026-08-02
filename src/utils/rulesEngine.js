import { analyzeTextWithGemini } from './aiEngine';
import { validateAiAnalysis } from './aiValidation';
import { getRiskBand } from './riskScale';
import { LESSON_CARDS } from './lessonCards';
import { QUIZ_POOL } from './quizDatabase';
import { QUICK_TEST_PRESETS } from '../content/member2Content';

const STOP_WORDS = new Set([
  'and', 'is', 'the', 'me', 'i', 'said', 'to', 'for', 'of', 'a', 'in', 'that', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'this', 'which', 'or', 'but', 'not', 'are', 'was', 'were', 'it', 'they', 'them',
  'dan', 'ini', 'itu', 'ke', 'dari', 'yang', 'saya', 'dia', 'mereka', 'kami', 'kita', 'untuk', 'dengan', 'di', 'ada', 'adalah', 'kepada', 'ia'
]);

export function extractKeywords(text) {
  if (!text) return new Set();
  const words = String(text).toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)));
}

export function calculateJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

const knownSignatures = [];
let signaturesInitialized = false;

function initSignatures() {
  if (signaturesInitialized) return;
  
  LESSON_CARDS.forEach(c => {
    const labelEn = `Known Scam Pattern - ${c.category}`;
    const labelMs = `Corak Penipuan Dikenali - ${c.category}`;
    const expObj = { en: c.summary || c.title, ms: c.summary_ms || c.title_ms };
    if (c.exampleMessage) knownSignatures.push({ type: 'case_study', isScam: true, keywords: extractKeywords(c.exampleMessage), explanation: expObj, label: { en: labelEn, ms: labelMs } });
    if (c.exampleMessage_ms) knownSignatures.push({ type: 'case_study', isScam: true, keywords: extractKeywords(c.exampleMessage_ms), explanation: expObj, label: { en: labelEn, ms: labelMs } });
  });

  QUIZ_POOL.forEach(q => {
    const labelEn = `Known Scam Pattern - ${q.category}`;
    const labelMs = `Corak Penipuan Dikenali - ${q.category}`;
    const expObj = { en: q.explanation, ms: q.explanation_ms || q.explanation };
    if (q.text) knownSignatures.push({ type: 'quiz', isScam: q.isScam, keywords: extractKeywords(q.text), explanation: expObj, label: { en: labelEn, ms: labelMs } });
    if (q.text_ms) knownSignatures.push({ type: 'quiz', isScam: q.isScam, keywords: extractKeywords(q.text_ms), explanation: expObj, label: { en: labelEn, ms: labelMs } });
  });

  QUICK_TEST_PRESETS.forEach(qt => {
    const isScam = qt.tone === 'danger' || qt.tone === 'warning';
    const isCaution = qt.tone === 'caution';
    
    const labelEn = `Known Scam Pattern - ${qt.pattern_label_en || "Demo Pattern"}`;
    const labelMs = `Corak Penipuan Dikenali - ${qt.pattern_label_ms || "Corak Demo"}`;
    const expObj = { en: qt.explanation_en, ms: qt.explanation_ms || qt.explanation_en };
    
    if (qt.text) knownSignatures.push({ type: 'demo', isScam, isCaution, keywords: extractKeywords(qt.text), explanation: expObj, label: { en: labelEn, ms: labelMs } });
    if (qt.text_ms) knownSignatures.push({ type: 'demo', isScam, isCaution, keywords: extractKeywords(qt.text_ms), explanation: expObj, label: { en: labelEn, ms: labelMs } });
  });

  signaturesInitialized = true;
}


const WHATSAPP_DOMAINS = new Set(['wa.me', 'api.whatsapp.com', 'whatsapp.com']);
const NON_UNIQUE_COMMUNITY_DOMAINS = new Set([
  ...WHATSAPP_DOMAINS,
  't.me',
  'telegram.me',
]);

function getIndicatorValue(entry) {
  if (typeof entry === 'string') return entry;
  return entry?.value || entry?.indicator || '';
}

export function normalizePhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+6${digits}`;
  if (digits.startsWith('1')) return `+60${digits}`;
  return `+${digits}`;
}

export function normalizeHostname(value = '') {
  const trimmed = String(value)
    .trim()
    .replace(/^[("'`<\u005b]+/, '')
    .replace(/[)"'`>\],;.!?]+$/, '');

  if (!trimmed) return '';

  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(candidate).hostname
      .toLowerCase()
      .replace(/\.$/, '')
      .replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function normalizeBankAccount(value = '') {
  return String(value).replace(/\D/g, '');
}

function extractBankAccountCandidates(text = '') {
  return [
    ...new Set(
      (String(text).match(/\b(?:\d[\s-]?){8,16}\b/g) || [])
        .map(normalizeBankAccount)
        .filter((value) => value.length >= 8),
    ),
  ];
}

function domainMatches(candidate, listed) {
  const candidateHost = normalizeHostname(candidate);
  const listedHost = normalizeHostname(getIndicatorValue(listed));
  if (!candidateHost || !listedHost) return false;
  return candidateHost === listedHost || candidateHost.endsWith(`.${listedHost}`);
}

const NEGATION_BEFORE_PATTERN =
  /\b(?:never|no|not|without|do\s+not|don'?t|does\s+not|doesn'?t|will\s+not|won'?t|jangan|tidak\s+perlu|tak\s+perlu|tiada|tanpa)\b[^.!?\n;]{0,70}$/i;
const NEGATION_AFTER_PATTERN =
  /^[^.!?\n;]{0,24}\b(?:not|required\s+not|not\s+required|tidak\s+diperlukan|tidak\s+perlu|tiada)\b/i;

function isNegatedMatch(clause, match) {
  const before = clause.slice(Math.max(0, match.index - 70), match.index);
  const after = clause.slice(match.index + match[0].length, match.index + match[0].length + 35);
  return NEGATION_BEFORE_PATTERN.test(before) || NEGATION_AFTER_PATTERN.test(after);
}

function hasAffirmativePattern(text, patterns) {
  const clauses = String(text)
    .split(/[.!?\n;]+/)
    .flatMap((clause) =>
      clause.split(/\b(?:but|however|yet|instead|tetapi|namun|sebaliknya)\b/i),
    );

  return clauses.some((clause) =>
    patterns.some((pattern) => {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      const matcher = new RegExp(pattern.source, flags);
      let match = matcher.exec(clause);

      while (match) {
        if (!isNegatedMatch(clause, match)) return true;
        if (match[0] === '') matcher.lastIndex += 1;
        match = matcher.exec(clause);
      }

      return false;
    }),
  );
}

function isWhatsAppDomain(domain = '') {
  return WHATSAPP_DOMAINS.has(normalizeHostname(domain));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

// Demo mock screenshots database for OCR simulation
export const DEMO_SCREENSHOTS = {
  pos_laju_scam: {
    name: "Urgent Parcel Screenshot (Pos Laju theme)",
    extractedText: "Your parcel is being held. Pay RM2.50 within 30 minutes using the QR code below or the parcel will be returned.",
    detectedQr: "https://pos-laju.info/pay-fee/2.50",
    detectedUrls: ["https://pos-laju.info/pay-fee/2.50"],
    detectedPhones: [],
    paymentRequested: "RM2.50",
    theme: "Pos Laju / Courier Impersonation"
  },
  shopee_job_scam: {
    name: "Shopee Job Offer Screenshot",
    extractedText: "CONGRATULATIONS! You have been selected for a part-time online marketing role. Earn RM300-800 daily. Just pay RM50 registration deposit to start processing your first task.",
    detectedQr: null,
    detectedUrls: [],
    detectedPhones: ["+6011-8762512"],
    paymentRequested: "RM50",
    theme: "Part-time Job Offer / Task Scam"
  },
  family_emergency: {
    name: "Family Emergency Chat Screenshot",
    extractedText: "Mum, I lost my phone. This is my new number. I need you to transfer RM1,000 urgently to my friend's account 164228910239 for my medical bill. Please keep it a secret, don't call me now as my speaker is broken.",
    detectedQr: null,
    detectedUrls: [],
    detectedPhones: ["+6017-9921102"],
    paymentRequested: "RM1,000",
    theme: "Impersonation / Family Emergency"
  },
  legitimate_tnb: {
    name: "Official TNB Advisory Screenshot",
    extractedText: "Tenaga Nasional Berhad: Please be informed that maintenance work will be carried out on 28th July 2026. No payments or login credentials are required. For queries, call 15454.",
    detectedQr: null,
    detectedUrls: [],
    detectedPhones: ["15454"],
    paymentRequested: null,
    theme: "TNB Maintenance Notification"
  }
};

/**
 * Parses input text to extract key indicators: URLs, Phone numbers, and Payment details
 */
export function extractIndicators(text) {
  const urlRegex = /(https?:\/\/[^\s]+|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/gi;
  const phoneRegex = /(?:\+?6[\s-]?)?0?1\d(?:[\s-]?\d){7,8}/g;
  const paymentRegex = /(RM\s*\d+(\.\d{2})?|\b\d+,\d{3}\s*(RM|ringgit)?|bank\s*transfer|pay\b)/gi;

  const foundUrls = String(text).match(urlRegex) || [];
  const foundPhones = String(text).match(phoneRegex) || [];
  
  const cleanedUrls = foundUrls.map(normalizeHostname).filter(Boolean);
  const phones = [...new Set(foundPhones.map((phone) => phone.trim()))];

  return {
    urls: [...new Set(cleanedUrls)],
    phones,
    normalizedPhones: [...new Set(phones.map(normalizePhone).filter(Boolean))],
    hasPaymentKeywords: paymentRegex.test(text),
    extractedPayment: text.match(/(RM\s*\d+(\.\d{2})?)/gi)?.[0] || null
  };
}

function collectComparableIndicators(text, metadata = {}) {
  const extracted = extractIndicators(text);
  const phoneDigits = new Set(extracted.normalizedPhones.map(normalizeBankAccount));
  const domains = extracted.urls
    .map(normalizeHostname)
    .filter((domain) => domain && !NON_UNIQUE_COMMUNITY_DOMAINS.has(domain));
  const qrHost = normalizeHostname(metadata.qrCode || '');
  if (qrHost && !NON_UNIQUE_COMMUNITY_DOMAINS.has(qrHost)) domains.push(qrHost);

  return {
    domains: [...new Set(domains)],
    phones: [...new Set(extracted.normalizedPhones)],
    bankAccounts: extractBankAccountCandidates(text).filter(
      (account) => !phoneDigits.has(account),
    ),
  };
}

export function findMatchingVerifiedReports(text, reports = [], metadata = {}) {
  const submitted = collectComparableIndicators(text, metadata);

  return reports
    .filter((report) => report?.status === 'confirmed')
    .map((report) => {
      const reportText = report.originalText || report.text || '';
      const known = collectComparableIndicators(reportText, {
        qrCode: report.qrCode || report.qrDestination,
      });
      const matchedIndicators = [
        ...submitted.domains.filter((value) => known.domains.includes(value)),
        ...submitted.phones.filter((value) => known.phones.includes(value)),
        ...submitted.bankAccounts.filter((value) => known.bankAccounts.includes(value)),
      ];

      return {
        id: report.id ?? report.firebaseId,
        matchedIndicators: [...new Set(matchedIndicators)],
      };
    })
    .filter((match) => match.matchedIndicators.length > 0);
}

/**
 * Runs the hybrid scoring algorithm on extracted inputs (Blacklist + Gemini AI)
 * @param {string} text - Message content
 * @param {object} metadata - Extra context (e.g. source, verified reports, QR code)
 */
export async function analyzeScamRisk(text, metadata = {}) {
  const lang = metadata.lang || 'en';
  initSignatures();
  
  const inputKeywords = extractKeywords(text);
  let bestMatch = null;
  let maxJaccard = 0;

  for (const sig of knownSignatures) {
    const score = calculateJaccard(inputKeywords, sig.keywords);
    if (score > maxJaccard) {
      maxJaccard = score;
      bestMatch = sig;
    }
  }

  // Trigger NLP bypass if overlap is high enough (>55%)
  if (bestMatch && maxJaccard >= 0.55) {
    let finalScore = 0;
    
    if (bestMatch.type === 'case_study') {
      finalScore = 100;
    } else if (bestMatch.isCaution) {
      // Scale from 40 to 59
      const jitter = (text.length % 5);
      finalScore = Math.floor(40 + ((maxJaccard - 0.55) / 0.45) * 14) + jitter;
      finalScore = Math.min(59, finalScore);
    } else if (bestMatch.isScam) {
      // Scale from 80 to 95, plus a small deterministic jitter based on text length so they aren't all identically 98
      const jitter = (text.length % 5);
      finalScore = Math.floor(80 + ((maxJaccard - 0.55) / 0.45) * 15) + jitter;
      finalScore = Math.min(99, finalScore);
    } else {
      // Scale from 15 down to 0, with jitter
      const jitter = (text.length % 4);
      finalScore = Math.max(0, Math.floor(15 - ((maxJaccard - 0.55) / 0.45) * 12)) + jitter;
      finalScore = Math.min(19, finalScore);
    }

    const bandResult = getRiskBand(finalScore, lang);
    let explanationStr = "";
    if (typeof bestMatch.explanation === 'object') {
      explanationStr = lang === 'ms' ? (bestMatch.explanation.ms || bestMatch.explanation.en) : (bestMatch.explanation.en || bestMatch.explanation.ms);
    } else {
      explanationStr = bestMatch.explanation;
    }

    const isHighRisk = finalScore >= 60;
    const recommendedActions = lang === 'ms' 
      ? (isHighRisk 
        ? ["Hentikan semua komunikasi dengan segera.", "Jangan buat sebarang transaksi kewangan atau pindahan wang.", "Lapor dan sekat nombor atau akaun ini."]
        : ["Abaikan mesej ini jika anda tidak menjangkakannya.", "Jangan klik sebarang pautan."])
      : (isHighRisk
        ? ["Cease all communication immediately.", "Do not make any financial transactions or transfers.", "Report and block this number or account."]
        : ["Ignore this message if you did not expect it.", "Do not click any links."]);

    return {
      score: finalScore,
      riskIndex: finalScore,
      riskBand: bandResult.label,
      bandColor: bandResult.color,
      evidenceStrength: lang === 'ms' ? 'Tinggi' : 'High',
      confidence: lang === 'ms' ? 'Tinggi' : 'High',
      explanations: [
        {
          category: bestMatch.isScam ? "other" : "safe",
          label: bestMatch.label 
                 ? (lang === 'ms' ? bestMatch.label.ms : bestMatch.label.en) 
                 : (lang === 'ms' ? "Corak Dikesan" : "Pattern Detected"),
          text: explanationStr
        }
      ],
      indicators: extractIndicators(text),
      indicatorsMatched: [],
      context: { type: 'general', verificationStatus: 'risk_assessed', hasWhatsAppLink: false },
      recommendedActions
    };
  }

  let score = 0;
  let acceptedAiAnalysis = false;
  let explanations = [];
  const indicatorsMatched = [];
  const analysis = extractIndicators(text);
  const qrDestination = metadata.qrCode || null;

  // Track if we hit a critical blacklist match that forces base high-risk
  let matchedBlacklistIndicator = false;

  const blacklist = {
    phoneNumbers: metadata.blacklist?.phoneNumbers || [],
    urls: metadata.blacklist?.urls || [],
    bankAccounts: metadata.blacklist?.bankAccounts || [],
  };

  // 1. SENDER REPUTATION & BLACKLIST MATCHES (Instant Rule Engine)
  if (analysis.normalizedPhones.length > 0) {
    const normalizedBlacklistedPhones = blacklist.phoneNumbers
      .map((entry) => normalizePhone(getIndicatorValue(entry)))
      .filter(Boolean);
    const matchedPhone = analysis.normalizedPhones.find((phone) =>
      normalizedBlacklistedPhones.includes(phone),
    );

    if (matchedPhone) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "reputation",
        label: lang === 'ms' ? "Penunjuk Nombor Telefon Tersenarai" : "Listed Phone Indicator",
        text: lang === 'ms'
          ? "Nombor telefon sepadan dengan penunjuk dalam senarai Scam Away semasa. Semak sumber dan tarikh rekod sebelum membuat keputusan."
          : "The phone number matches an indicator in Scam Away's current list. Check the record source and date before acting.",
        weight: 35
      });
      indicatorsMatched.push(matchedPhone);
    }
  }

  // Check account blacklist
  const phoneDigits = new Set(analysis.normalizedPhones.map(normalizeBankAccount));
  const bankAccountCandidates = extractBankAccountCandidates(text).filter(
    (account) => !phoneDigits.has(account),
  );
  const matchedBlacklistAccount = blacklist.bankAccounts.find((entry) =>
    bankAccountCandidates.includes(normalizeBankAccount(getIndicatorValue(entry))),
  );
  if (matchedBlacklistAccount) {
    const accountValue = normalizeBankAccount(getIndicatorValue(matchedBlacklistAccount));
    matchedBlacklistIndicator = true;
    explanations.push({
      category: "payment",
      label: lang === 'ms' ? "Penunjuk Akaun Bank Tersenarai" : "Listed Bank Account Indicator",
      text: lang === 'ms'
        ? `Akaun (${accountValue}) sepadan dengan penunjuk dalam senarai Scam Away semasa. Semak sumber rekod sebelum membuat keputusan.`
        : `The account (${accountValue}) matches an indicator in Scam Away's current list. Check the record source before acting.`,
      weight: 45
    });
    indicatorsMatched.push(accountValue);
  }

  // URL blacklist check
  if (analysis.urls.length > 0) {
    const matchedBadDomain = analysis.urls.find((url) =>
      blacklist.urls.some((listed) => domainMatches(url, listed)),
    );

    if (matchedBadDomain) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "technical",
        label: lang === 'ms' ? "Penunjuk Domain Tersenarai" : "Listed Domain Indicator",
        text: lang === 'ms'
          ? `Domain (${matchedBadDomain}) sepadan dengan penunjuk dalam senarai Scam Away semasa. Semak sumber dan tarikh rekod sebelum membuat keputusan.`
          : `The domain (${matchedBadDomain}) matches an indicator in Scam Away's current list. Check the record source and date before acting.`,
        weight: 40
      });
      indicatorsMatched.push(matchedBadDomain);
    }
  }

  // QR destination check
  if (qrDestination) {
    const qrHost = normalizeHostname(qrDestination);
    const matchedQrDomain = blacklist.urls.find((listed) => domainMatches(qrHost, listed));
    if (matchedQrDomain) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "technical",
        label: lang === 'ms' ? "Penunjuk Domain QR Tersenarai" : "Listed QR Domain Indicator",
        text: lang === 'ms'
          ? `Kod QR menghala ke domain (${qrHost}) yang sepadan dengan senarai Scam Away semasa. Semak sumber rekod sebelum membuat keputusan.`
          : `The QR code points to a domain (${qrHost}) that matches Scam Away's current list. Check the record source before acting.`,
        weight: 35
      });
      indicatorsMatched.push(qrHost);
    }
  }

  // Base score setting if matched a blacklisted element
  if (matchedBlacklistIndicator) {
    score = 85; 
  }

  // 2. CONTEXT-AWARE RULE LAYER
  // A word such as "urgent" or the presence of a link is not enough on its own.
  // The engine looks for an instruction, time pressure, payment, credential, or
  // impersonation context before increasing the risk substantially.
  let ruleContribution = 0;

  const isJobPost = hasAny(text, [
    /\b(?:urgent\s+)?hiring\b/i,
    /\bjob\s+(?:offer|opening|vacancy|posting)\b/i,
    /\b(?:full[- ]?time|part[- ]?time|internship|vacancy|recruiter|recruitment|positions?)\b/i,
    /\b(?:send|submit)\s+(?:your\s+)?(?:resume|cv)\b/i,
    /\b(?:wfh|work\s+from\s+home|hybrid)\b/i,
    /\b(?:kerja|jawatan|pengambilan|latihan industri)\b/i,
    /\b(?:task|tugasan)\s+\d+/i,
    /\b(?:review|like)\s+(?:videos?|hotels?|products?)\b/i,
    /\b(?:shopee|lazada|tiktok|youtube|agoda|digital media)\s+(?:hr|marketing|agent|hiring)\b/i,
    /\b(?:earn|gaji|income).{0,30}rm\s*\d+/i,
    /\b(?:commission|komisen)\s+(?:instantly|segera|daily|sehari)\b/i,
    /\b(?:get paid|dibayar).{0,30}(?:rm|every|setiap|per)\b/i,
    /\b(?:no interview|no experience|tiada temuduga|tiada pengalaman)\b/i,
    /\b(?:working|bekerja)\s+\d+\s*(?:hr|hour|jam)\b/i
  ]);

  const hasDirectPressure = hasAffirmativePattern(text, [
    /\b(?:act|apply|pay|reply|respond|transfer|click|verify|submit|contact)\s+(?:now|immediately|urgently|segera|sekarang)\b/i,
    /\b(?:pay|transfer|click|verify|submit|bayar|pindah).{1,60}(?:now|immediately|urgently|segera|sekarang)\b/i,
    /\bwithin\s*\d+\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/i,
    /\bdalam\s+\d+\s*(?:minit|jam|hari)\b/i,
    /\b(?:today only|last chance|limited time|before it expires)\b/i,
    /\b(?:or|otherwise)\s+(?:your\s+)?(?:account|parcel|application).{0,30}(?:blocked|suspended|cancelled|returned|rejected)\b/i,
    /\b(?:bayar|klik|pindah|balas|mohon|hubungi|sahkan)\s+(?:sekarang|segera)\b/i,
    /\b(?:avoid|to avoid|elak|untuk elak|before)\s+.{0,30}(?:return|dispose|cancel|block|freeze|suspend|batal|pulang|buang|beku|lokap|penjara|lockup)\b/i,
    /\b(?:prepare|sediakan)\s+(?:exact|tepat)?\s*(?:cash|wang|duit)\b/i
  ]);

  const hasSecrecy = hasAny(text, [
    /\b(?:keep (?:it|this) secret|between us|don'?t tell|don'?t call)\b/i,
    /\b(?:rahsia|jangan beritahu|jangan hubungi|jgn beritahu|jgn telefon|jgn hubungi)\b/i
  ]);
  const hasCreds = hasAffirmativePattern(text, [
    /\b(?:share|send|provide|enter|submit|verify|update|give)\s+(?:your\s+)?(?:otp|tac(?:\s+code)?|password|login|banking details|account credentials)\b/i,
    /\b(?:otp|tac(?:\s+code)?|password|banking details).{0,30}\b(?:required|needed|send|share|provide|enter)\b/i,
    /\b(?:kongsi|hantar|masukkan|berikan|sahkan)\s+(?:kod\s+)?(?:otp|tac|kata laluan|butiran bank)\b/i
  ]);
  const hasPrizeOrRefundBait = hasAffirmativePattern(text, [
    /\b(?:congratulations|tahniah).{0,35}(?:won|winner|reward|gift|hadiah)\b/i,
    /\b(?:tax refund|cash refund|refund portal|tebus hadiah|hadiah percuma)\b/i
  ]);
  const hasImpossibleReturn = hasAffirmativePattern(text, [
    /\b(?:guaranteed|dijamin|pasti)\s+(?:profit|return|income|untung|allocation|pulangan)\b/i,
    /\b(?:100%|1000%)\s*(?:untung|profit|return|sah|legit)\b/i,
    /\b(?:no risk|without risk|tanpa risiko|zero risk|sifar risiko)\b/i,
    /\b(?:\d+%\s+daily\s+(?:profit|commission|return))\b/i,
    /\b(?:earn|untung)\s+\d+%\s+(?:daily|setiap hari|automatically)\b/i
  ]);
  const hasFearThreat = hasAffirmativePattern(text, [
    /\b(?:fined|jail|arrested?|warrant|blacklisted|tax debt|account frozen|court action|legal action)\b/i,
    /\b(?:denda|penjara|waran tangkap|akaun dibeku|dibekukan|tindakan undang-undang|digantung|lokap)\b/i,
    /\b(?:tangkap|ditangkap|ditahan|cuci wang|pengedaran dadah)\b/i,
    /\b(?:saman|summons?)\s+(?:aes|cukai|tax)\b/i,
    /\b(?:license|lesen)\s+(?:will be|akan)\s*(?:suspended|revoked|digantung|dibatal)\b/i
  ]);
  const hasFamilyEmergency = hasAffirmativePattern(text, [
    /\b(?:mum|dad|mak|ayah|ibu|bapa|abang|adik|anak).{0,80}(?:new number|phone.{0,10}(?:lost|broken|damaged)|hospital|accident|kidnap|tangkap|culik)\b/i,
    /\b(?:telefon rosak|tukar nombor|masuk hospital|kemalangan|akaun kawan|fon jatuh|nombor baru)\b/i
  ]);
  const hasAuthority = hasAny(text, [
    /\b(?:police|polis|court|mahkamah|lhdn|jpj|pos\s*laju|poslaju|customs|kastam|sprm|mcmc|skmm|bank negara|bnm|kwsp|epf|pdrm|ipk|sarjan|sergeant)\b/i
  ]);

  const hasPaymentRequest = hasAffirmativePattern(text, [
    /\b(?:pay|transfer|deposit|send)\s+(?:me|us|them|to|into|rm\s*\d+|\d{2,})\b/i,
    /\b(?:pay|transfer|deposit|bayar|pindah)\s+(?:now|immediately|sekarang|segera)\b/i,
    /\b(?:payment|fee|deposit|cod)\b.{0,40}\b(?:required|due|must be paid|to release|to unlock|to start|diperlukan)\b/i,
    /\b(?:bayar|pindah|deposit|hantar)\s+(?:kepada|ke|rm\s*\d+|\d{2,})\b/i,
    /\b(?:pay\s+(?:a\s+)?rm\s*\d+)\b/i,
    /\b(?:deposit\s+rm\s*\d+)\b/i,
    /\b(?:rm\s*\d+).{0,30}(?:fee|deposit|activation|processing|customs|cukai|yuran|bayaran)\b/i,
    /\b(?:fee|deposit|activation|processing|customs|cukai|yuran|bayaran).{0,30}(?:rm\s*\d+)\b/i,
    /\b(?:pindahkan|kumpul|urus jaminan|hantar wang)\s+rm\s*\d+/i,
    /\b(?:cash\s+amount\s+due|prepare\s+exact\s+cash)\b/i,
    /\b(?:minimum\s+investment|deposit\s+\d)\b/i,
    /\b(?:pindahkan|pindah|transfer|masukkan).{0,30}(?:simpanan|wang|duit|funds|savings|kesemua).{0,30}(?:akaun|account)\b/i
  ]);

  const hasJobAdvanceFee = hasAny(text, [
    /\b(?:registration|processing|training|starter|security|activation)\s+(?:fee|deposit)\b/i,
    /\b(?:pay|deposit|transfer).{0,55}(?:to start|before you start|unlock|activate|first task|obtain the job)\b/i,
    /\b(?:bayar|deposit|pindah).{0,45}(?:untuk mula|yuran pendaftaran|aktifkan|tugasan pertama|dapatkan kerja)\b/i,
    /\bdeposit\s+(?:to\s+)?(?:unlock|activate)\b/i,
    /\b(?:deposit|pay).{0,30}(?:rm\s*\d+).{0,30}(?:unlock|activate|order|task|commission|start)\b/i,
    /\b(?:unlock|activate).{0,30}(?:deposit|pay|rm\s*\d+)\b/i
  ]);

  const hasHighDailyIncomeClaim = hasAny(text, [
    /\b(?:earn|income|salary|gaji|get paid).{0,25}rm\s*\d+(?:\s*[-\u2013]\s*\d+)?\s*(?:daily|per day|sehari|instantly)\b/i,
    /\b(?:rm\s*\d+)(?:\s*[-\u2013]\s*(?:rm\s*)?\d+)?\s*(?:daily|per day|sehari)\b/i,
    /\b(?:earn|get paid|dibayar).{0,30}rm\s*\d+/i,
    /\b(?:\d+%\s+daily\s+(?:profit|commission|return|interest))\b/i
  ]);
  
  const hasEasyTaskClaim = hasAny(text, [
    /\b(?:easy|simple)\s+(?:online\s+)?(?:job|task|work)\b/i,
    /\b(?:like products|post reviews|process orders|click orders|no experience needed|no interview needed|liking products)\b/i,
    /\b(?:video(?:s)?\s+liked|like(?:s)?\s+video|menonton\s+video|tiktok\s+video)\b/i,
    /\b(?:complete|buat).{0,20}(?:likes|tugasan|task|pesanan|orders)\b/i,
    /\b(?:working|bekerja)\s+\d+\s*(?:hr|hour|jam)\s+(?:daily|sehari)\b/i,
    /\b(?:from home|dari rumah)\b/i
  ]);

  const isCourierContext = hasAny(text, [
    /\b(?:parcel|bungkusan|courier|delivery|redelivery|cod|cash-on-delivery)\b/i,
    /\b(?:ninja\s*van|pos\s*laju|poslaju|pos\s*malaysia|j&t|dhl|fedex)\b/i
  ]);
  const hasParcelProblemClaim = hasAffirmativePattern(text, [
    /\b(?:parcel|bungkusan|delivery).{0,55}(?:held|on hold|ditahan|failed|gagal|invalid address|customs|kastam|returned|cancelled|disposal|return to sender)\b/i,
    /\b(?:sorting hub|clearance|redelivery|customs).{0,35}(?:fee|payment|required|failed)\b/i,
    /\b(?:unpaid|tertunggak|belum dibayar).{0,30}(?:customs|fee|tax|cukai)\b/i,
    /\b(?:rider|penghantar).{0,30}(?:on the way|dalam perjalanan|deliver)\b/i,
    /\b(?:cash amount due|prepare exact cash|cod|bayar semasa terima)\b/i
  ]);

  const isInvestmentContext = hasAny(text, [
    /\b(?:pelaburan|investment|insider trading|cryptoai|arbitrage|crypto[- ]?task)\b/i,
    /\b(?:guaranteed allocation|pre-ipo|bursa insider|1000%\s*profit)\b/i,
    /\b(?:trade|trading)\s+(?:btc|usdt|eth|crypto|forex)\b/i,
    /\b(?:automated|auto)\s+(?:trading|arbitrage|bot)\b/i,
    /\b(?:we provide the capital|kami sediakan modal)\b/i
  ]);

  const isEmergencyContext = hasAny(text, [
    /\b(?:fon\s+jatuh\s+air|masuk\s+hospital|kemalangan)\b/i,
    /\b(?:kena\s+tangkap|diculik|polis\s+bail|wang\s+jaminan|tahan\s+di\s+balai|ditahan di balai)\b/i,
    /\b(?:hospital|accident|kidnapped?|detained|bail money|medical emergency)\b/i,
    /\b(?:anak.{0,30}(?:tangkap|culik|ada dengan kami))\b/i,
    /\b(?:sepupu|saudara|cousin|sibling).{0,40}(?:ditahan|detained|arrested|tangkap)\b/i,
    /\b(?:kesalahan\s+dadah|drug\s+offence)\b/i
  ]);

  const hasUnrealisticJobIncome = isJobPost && (hasImpossibleReturn || (hasHighDailyIncomeClaim && hasEasyTaskClaim));

  const whatsappDomains = analysis.urls.filter(isWhatsAppDomain);
  const hasWhatsAppLink = whatsappDomains.length > 0;
  const hasOnlyWhatsAppLinks = analysis.urls.length > 0 && analysis.urls.every(isWhatsAppDomain);
  const hasCorporateEmail = /[\w.+-]+@(?!gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|protonmail\.com)[\w.-]+\.[a-z]{2,}/i.test(text);
  const hasNamedBusinessEntity = /\b(?:sdn\.?\s*bhd\.?|berhad|enterprise|plc|ltd\.?|inc\.?)\b/i.test(text);
  const hasNonWhatsAppWebSource = analysis.urls.some((domain) => !isWhatsAppDomain(domain));
  const hasEmployerIdentitySource = hasCorporateEmail || hasNamedBusinessEntity || hasNonWhatsAppWebSource;
  const hasRiskyPressure = hasDirectPressure && (
    hasPaymentRequest ||
    hasCreds ||
    hasFearThreat ||
    hasPrizeOrRefundBait ||
    hasFamilyEmergency ||
    hasNonWhatsAppWebSource
  );

  const isCourierScam = isCourierContext &&
    (hasParcelProblemClaim || hasPaymentRequest) &&
    (hasPaymentRequest || hasNonWhatsAppWebSource || hasDirectPressure || Boolean(qrDestination));

  const isInvestmentScam = isInvestmentContext &&
    (hasImpossibleReturn || hasHighDailyIncomeClaim || hasPaymentRequest);

  const isEmergencyScam = isEmergencyContext &&
    (hasPaymentRequest || hasSecrecy || hasFearThreat);

  const hasAuthorityExtortion = hasAuthority &&
    (hasFearThreat || hasDirectPressure) &&
    (hasPaymentRequest || hasCreds || hasNonWhatsAppWebSource || hasDirectPressure);

  const hasStrongJobRisk = hasJobAdvanceFee ||
    hasCreds ||
    hasUnrealisticJobIncome ||
    (isJobPost && hasPaymentRequest) ||
    (isJobPost && hasHighDailyIncomeClaim && hasPaymentRequest) ||
    (hasRiskyPressure && hasPaymentRequest);

  // --- CORE SCAM ARCHETYPE SCORING ---
  // Each evidence contribution is added once. Scores are not artificially
  // floored and then incremented by the same evidence a second time.

  if (isJobPost || hasJobAdvanceFee || hasHighDailyIncomeClaim) {
    if (hasJobAdvanceFee || hasUnrealisticJobIncome || hasStrongJobRisk || (hasPaymentRequest && hasHighDailyIncomeClaim) || (hasSecrecy && hasPaymentRequest)) {
      ruleContribution += 55;
      explanations.push({
        category: "payment",
        label: lang === 'ms' ? "Penipuan Pendahuluan Tugasan" : "Advance Fee Task Scam",
        text: lang === 'ms' 
          ? "Tawaran tidak sah yang memerlukan anda mendeposit wang untuk 'membuka' tugas atau gaji." 
          : "Illegitimate offer requiring you to deposit money to 'unlock' tasks or payouts.",
        weight: 55
      });
    }
  }

  if (isCourierScam) {
    ruleContribution += 55;
    explanations.push({
      category: "phishing",
      label: lang === 'ms' ? "Penipuan Kurier Palsu" : "Fake Courier Scam",
      text: lang === 'ms' 
        ? "Mesej kurier mencurigakan mendesak bayaran cukai/COD luar jangkaan untuk bungkusan tidak sah." 
        : "Suspicious courier message demanding unexpected fees/COD for an unverified parcel.",
      weight: 55
    });
  }

  if (isInvestmentScam) {
    ruleContribution += 55;
    explanations.push({
      category: "other",
      label: lang === 'ms' ? "Skim Pelaburan Mustahil" : "Impossible Investment Scheme",
      text: lang === 'ms' 
        ? "Menawarkan pulangan yang tidak realistik atau jaminan yang selalunya berakhir dengan kerugian total." 
        : "Offers completely unrealistic returns or guarantees which always result in a total loss.",
      weight: 55
    });
  }

  if (isEmergencyScam) {
    ruleContribution += 60;
    explanations.push({
      category: "urgency",
      label: lang === 'ms' ? "Pemerasan Kecemasan" : "Emergency Extortion",
      text: lang === 'ms' 
        ? "Mengeksploitasi panik melalui dakwaan kecemasan perubatan, penculikan, atau amaran tangkapan polis." 
        : "Exploits panic via false claims of medical emergencies, kidnappings, or police detentions.",
      weight: 60
    });
  }

  if (hasAuthorityExtortion) {
    ruleContribution += 55;
    explanations.push({
      category: "impersonation",
      label: lang === 'ms' ? "Penyamaran Pihak Berkuasa (Macau Scam)" : "Authority Impersonation (Macau Scam)",
      text: lang === 'ms'
        ? "Nama agensi rasmi digunakan bersama tekanan, ancaman, atau amaran waran untuk merampas wang."
        : "An official agency name is combined with pressure, threats, or warrant warnings to extort money.",
      weight: 55
    });
  }

  // If ANY core archetype triggered, guarantee a minimum Critical score
  const hitCoreArchetype = isCourierScam || isInvestmentScam || isEmergencyScam || hasAuthorityExtortion ||
    (isJobPost && (hasJobAdvanceFee || hasUnrealisticJobIncome || hasStrongJobRisk || (hasPaymentRequest && hasHighDailyIncomeClaim)));
  if (hitCoreArchetype) {
    score = Math.max(score, 85);
  }

  if (hasCreds) {
    ruleContribution += 30;
    explanations.push({
      category: "credentials",
      label: lang === 'ms' ? "Permintaan Maklumat Sulit" : "Sensitive Information Request",
      text: lang === 'ms'
        ? "Mesej meminta OTP, TAC, kata laluan atau butiran perbankan yang tidak patut dikongsi."
        : "The message requests an OTP, TAC, password, or banking details that should not be shared.",
      weight: 30
    });
  }

  if (hasRiskyPressure) {
    ruleContribution += 20;
    explanations.push({
      category: "urgency",
      label: lang === 'ms' ? "Tekanan Untuk Bertindak Segera" : "Immediate Action Pressure",
      text: lang === 'ms'
        ? "Mesej memberikan arahan segera, had masa atau akibat untuk menghalang semakan yang teliti."
        : "The message gives an immediate instruction, deadline, or consequence that discourages careful verification.",
      weight: 20
    });
  }

  if (hasFearThreat) {
    ruleContribution += 25;
    explanations.push({
      category: "threat",
      label: lang === 'ms' ? "Ancaman Undang-undang atau Akaun" : "Legal or Account Threat",
      text: lang === 'ms'
        ? "Ancaman tangkapan, tindakan undang-undang atau pembekuan akaun digunakan untuk menimbulkan ketakutan."
        : "Arrest, legal-action, or account-freeze language is used to create fear.",
      weight: 25
    });
  }

  if (hasFamilyEmergency && hasPaymentRequest) {
    ruleContribution += 30;
    explanations.push({
      category: "impersonation",
      label: lang === 'ms' ? "Umpan Penyamaran Keluarga" : "Family Impersonation Pattern",
      text: lang === 'ms'
        ? "Mesej menggunakan nombor baharu, telefon rosak atau kecemasan keluarga untuk meminta bantuan tanpa pengesahan."
        : "The message uses a new number, broken phone, or family emergency to request help without verification.",
      weight: 30
    });
  }

  if (hasSecrecy && hasPaymentRequest) {
    ruleContribution += 15;
    explanations.push({
      category: "secrecy",
      label: lang === 'ms' ? "Diminta Merahsiakan Urusan" : "Secrecy Request",
      text: lang === 'ms'
        ? "Penghantar meminta anda tidak menghubungi atau memberitahu orang lain."
        : "The sender asks you not to call or tell anyone else.",
      weight: 15
    });
  }

  if (hasPrizeOrRefundBait || hasImpossibleReturn) {
    ruleContribution += hasImpossibleReturn ? 30 : 15;
    explanations.push({
      category: "bait",
      label: lang === 'ms' ? "Janji Kewangan Tidak Realistik" : "Unrealistic Financial Promise",
      text: lang === 'ms'
        ? "Ganjaran, pemulangan wang atau pulangan terjamin digunakan untuk menarik tindakan tanpa pengesahan."
        : "A reward, refund, or guaranteed return is used to encourage action without verification.",
      weight: hasImpossibleReturn ? 30 : 15
    });
  }

  if (hasJobAdvanceFee) {
    ruleContribution += 35;
    explanations.push({
      category: "payment",
      label: lang === 'ms' ? "Bayaran Pendahuluan Untuk Mendapat Kerja" : "Advance Fee to Start a Job",
      text: lang === 'ms'
        ? "Iklan pekerjaan meminta yuran, deposit atau bayaran sebelum kerja bermula—tanda utama penipuan pekerjaan."
        : "The job post requests a fee, deposit, or payment before work begins—a major job-scam warning sign.",
      weight: 35
    });
  }

  if (hasUnrealisticJobIncome) {
    ruleContribution += 20;
    explanations.push({
      category: "job",
      label: lang === 'ms' ? "Janji Pendapatan Kerja Tidak Realistik" : "Unrealistic Job Income Claim",
      text: lang === 'ms'
        ? "Pendapatan harian yang tinggi dijanjikan untuk tugasan yang sangat mudah atau tanpa pengalaman."
        : "High daily income is promised for extremely simple tasks or no experience.",
      weight: 20
    });
  }

  if (!matchedBlacklistIndicator) {
    if (hasWhatsAppLink) {
      ruleContribution += 4;
      explanations.push({
        category: "contact",
        label: lang === 'ms' ? "Pautan Hubungan WhatsApp" : "WhatsApp Contact Link",
        text: lang === 'ms'
          ? `Pautan ${whatsappDomains[0]} hanya membuka perbualan WhatsApp. Ia bukan bukti penipuan, tetapi identiti perekrut masih perlu disahkan melalui sumber rasmi.`
          : `The ${whatsappDomains[0]} link only opens a WhatsApp conversation. It is not proof of a scam, but the recruiter should still be verified through an official source.`,
        weight: 4
      });
    }

    if (isJobPost && !hasEmployerIdentitySource) {
      ruleContribution += 6;
      explanations.push({
        category: "verification",
        label: lang === 'ms' ? "Maklumat Majikan Perlu Disahkan" : "Employer Details Need Verification",
        text: lang === 'ms'
          ? "Iklan tidak menyediakan laman kerjaya rasmi, e-mel korporat atau nama entiti perniagaan yang boleh disemak. Ini tidak bermaksud penipuan, tetapi kesahihannya belum dapat dipastikan."
          : "The post does not provide an official careers page, corporate email, or checkable business entity. This does not mean it is a scam, but its legitimacy is not yet confirmed.",
        weight: 6
      });
    }

    const otherDomains = analysis.urls.filter((domain) => !isWhatsAppDomain(domain));
    if (otherDomains.length > 0) {
      ruleContribution += 12;
      explanations.push({
        category: "technical",
        label: lang === 'ms' ? "Pautan Luar Perlu Disahkan" : "External Link Requires Verification",
        text: lang === 'ms'
          ? `Pautan (${otherDomains[0]}) perlu dibandingkan dengan laman rasmi organisasi sebelum dibuka.`
          : `The link (${otherDomains[0]}) should be compared with the organisation's official website before it is opened.`,
        weight: 12
      });
    }

    if (hitCoreArchetype) {
      score = 85;
    } else {
      score += ruleContribution;
    }
  }

  // 3. TRUE AI SEMANTIC ANALYSIS (Gemini API)
  try {
    const geminiResult = await analyzeTextWithGemini(text, lang);
    const validatedGeminiResult = validateAiAnalysis(geminiResult, text, lang);
    if (validatedGeminiResult) {
      acceptedAiAnalysis = true;
      let semanticScore = validatedGeminiResult.score;

      // A normal job advertisement with only a WhatsApp contact must not be
      // escalated to high risk unless there is another concrete scam signal.
      if (isJobPost && !hasStrongJobRisk) {
        semanticScore = Math.min(semanticScore, 29);
      }

      score = Math.max(score, semanticScore);

      if (validatedGeminiResult.explanations.length > 0) {
        validatedGeminiResult.explanations
          .filter((exp) => {
            const category = String(exp.category || '').toLowerCase();
            if (isJobPost && !hasDirectPressure && category === 'urgency') return false;
            if (isJobPost && hasOnlyWhatsAppLinks && !hasStrongJobRisk && category === 'phishing') return false;
            return true;
          })
          .forEach((exp) => {
            explanations.push({
              category: exp.category || 'ai_insight',
              label: `AI: ${exp.label}`,
              text: exp.text,
              weight: exp.weight || 0,
              evidence: exp.evidence,
            });
          });
      }
    }
  } catch (err) {
    console.error("Failed to run Gemini analysis, falling back to rule engine", err);
  }


  // 4. COMMUNITY FUSION
  // Only exact canonical phone/domain/account matches are eligible. A global
  // report count or a shared brand word is not evidence about this submission.
  const matchedVerifiedReports = Array.isArray(metadata.matchedVerifiedReports)
    ? metadata.matchedVerifiedReports.filter(
        (report) => Array.isArray(report.matchedIndicators) && report.matchedIndicators.length > 0,
      )
    : [];
  const verifiedReports = matchedVerifiedReports.length;
  if (verifiedReports > 0) {
    const commBonus = verifiedReports >= 3 ? 15 : 8;
    const communityIndicators = [
      ...new Set(matchedVerifiedReports.flatMap((report) => report.matchedIndicators)),
    ];
    score += commBonus;
    explanations.push({
      category: "community",
      label: lang === 'ms' ? "Padanan Penunjuk Komuniti" : "Community Indicator Match",
      text: lang === 'ms'
        ? `Penunjuk yang sama (${communityIndicators.join(', ')}) muncul dalam ${verifiedReports} laporan yang disahkan moderator.`
        : `The same indicator (${communityIndicators.join(', ')}) appears in ${verifiedReports} moderator-confirmed report${verifiedReports === 1 ? '' : 's'}.`,
      weight: commBonus
    });
    indicatorsMatched.push(...communityIndicators);
  }

  if (matchedBlacklistIndicator && verifiedReports === 0) {
    score = 85;
  }

  // Keep score capped between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine risk band
  const scaleBand = getRiskBand(score, lang);
  let riskBand = scaleBand.label;
  let bandColor = scaleBand.color;
  let recommendedActions = lang === 'ms' ? [
    "Sahkan identiti pengirim secara bebas.",
    "Jangan muat turun sebarang lampiran atau klik pada pautan yang bersarang."
  ] : [
    "Verify the sender identity independently.",
    "Do not download any attachments or click on nested links."
  ];

  if (score >= 80) {
    riskBand = lang === 'ms' ? "Kritikal" : "Critical";
    bandColor = "critical";
    recommendedActions = lang === 'ms' ? [
      "JANGAN pindahkan wang atau serahkan kod log masuk.",
      "Sekat pengirim serta-merta dan padam mesej tersebut.",
      "Ambil tangkapan skrin, padamkan butiran peribadi, dan serahkan laporan untuk memberi amaran kepada orang lain.",
      "Hubungi talian bantuan bank anda (997 Pusat Respons Scam Kebangsaan jika di Malaysia) jika wang telah dipindahkan."
    ] : [
      "DO NOT transfer money or submit login codes.",
      "Block the sender immediately and delete the message.",
      "Take a screenshot, redact personal details, and submit a report to alert others.",
      "Contact your bank helpline (997 National Scam Response Centre if in Malaysia) if money was moved."
    ];
  } else if (score >= 60) {
    riskBand = lang === 'ms' ? "Berisiko tinggi" : "High risk";
    bandColor = "high";
    recommendedActions = lang === 'ms' ? [
      "Jangan bayar atau kongsi kelayakan dalam apa jua keadaan.",
      "Hubungi syarikat rasmi atau ahli keluarga menggunakan saluran yang disahkan.",
      "Kongsi keputusan ini dengan penjaga yang dipercayai atau bulatan sokongan."
    ] : [
      "Do not pay or share credentials under any circumstance.",
      "Contact the official company or family member using a verified channel.",
      "Share this result with a trusted guardian or support circle."
    ];
  } else if (isJobPost && !hasStrongJobRisk) {
    riskBand = lang === 'ms' ? "Perlu Pengesahan" : "Needs verification";
    bandColor = "caution";
    recommendedActions = lang === 'ms' ? [
      "Minta nama penuh syarikat dan semak pendaftarannya melalui SSM atau laman rasmi.",
      "Sahkan jawatan melalui laman kerjaya atau e-mel korporat syarikat—bukan melalui profil WhatsApp sahaja.",
      "Minta temu duga yang boleh disahkan dan jangan bayar yuran, deposit atau kos latihan untuk mendapatkan kerja.",
      "Jangan kongsi OTP, kata laluan, butiran bank atau salinan dokumen pengenalan sebelum identiti majikan disahkan."
    ] : [
      "Ask for the full company name and verify its registration through SSM or the official website.",
      "Confirm the vacancy through the company's careers page or corporate email—not only a WhatsApp profile.",
      "Request a verifiable interview and never pay a fee, deposit, or training charge to obtain a job.",
      "Do not share OTPs, passwords, banking details, or identity-document copies before the employer is verified."
    ];
  } else if (score >= 40) {
    riskBand = lang === 'ms' ? "Awas" : "Caution";
    bandColor = "caution";
    recommendedActions = lang === 'ms' ? [
      "Berhenti seketika sebelum klik. Mesej ini menggunakan taktik tekanan.",
      "Periksa sama ada mesej menggunakan saluran komunikasi tidak rasmi (cth. Gmail dan bukannya domain korporat)."
    ] : [
      "Pause before clicking. The message utilizes pressure tactics.",
      "Check if the message uses unofficial communication channels (e.g. Gmail instead of corporate domain)."
    ];
  } else if (score >= 20) {
    riskBand = lang === 'ms' ? "Perlu Pengesahan" : "Needs verification";
    bandColor = "caution";
    recommendedActions = lang === 'ms' ? [
      "Sahkan identiti pengirim melalui laman atau nombor rasmi.",
      "Jangan bayar atau kongsi maklumat sensitif sehingga permintaan itu disahkan."
    ] : [
      "Verify the sender through an official website or phone number.",
      "Do not pay or share sensitive information until the request is confirmed."
    ];
  }

  // Evidence strength describes how many independent signal sources were
  // available. It is not the probability that the message is a scam.
  const evidenceSources = new Set();
  if (analysis.urls.length > 0) evidenceSources.add('url');
  if (analysis.phones.length > 0) evidenceSources.add('phone');
  if (qrDestination) evidenceSources.add('qr');
  if (verifiedReports > 0) evidenceSources.add('community');
  if (matchedBlacklistIndicator) evidenceSources.add('reputation');
  if (ruleContribution > 0) evidenceSources.add('rules');
  if (acceptedAiAnalysis) evidenceSources.add('ai');

  let evidenceStrength = lang === 'ms' ? "Rendah" : "Low";
  if (evidenceSources.size >= 3) evidenceStrength = lang === 'ms' ? "Tinggi" : "High";
  else if (evidenceSources.size >= 1) evidenceStrength = lang === 'ms' ? "Sederhana" : "Medium";

  if (isJobPost && !hasStrongJobRisk && !matchedBlacklistIndicator) {
    evidenceStrength = lang === 'ms' ? "Sederhana" : "Medium";
  }

  return {
    score,
    riskIndex: score,
    riskBand,
    bandColor,
    evidenceStrength,
    // Compatibility alias for reports created before Phase 2.
    confidence: evidenceStrength,
    explanations,
    indicators: analysis,
    indicatorsMatched,
    context: {
      type: isJobPost ? 'job_post' : 'general',
      verificationStatus: isJobPost && !hasStrongJobRisk ? 'unverified' : 'risk_assessed',
      hasWhatsAppLink
    },
    recommendedActions
  };
}
