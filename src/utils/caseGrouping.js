import { normalizePhone, normalizeBankAccount, normalizeHostname, extractIndicators } from './rulesEngine.js';

/**
 * Normalizes scam pattern / concept classification for semantic matching.
 */
export function getScamConceptPattern(report = {}) {
  const text = `${report.text || ''} ${report.description || ''} ${report.title || ''} ${report.category || ''}`.toLowerCase();

  // 1. Parcel / Delivery COD Payment Scam
  if (
    /(?:parcel|package|delivery|bungkusan|pos\s*laju|poslaju|ninja\s*van|j&t|courier|cod|cash-on-delivery)/i.test(text) &&
    /(?:fee|pay|payment|transfer|bayar|clearance|release|held|hold|customs|kastam|tertahan|gagal|cod|cash-on-delivery|demand|demanding|collect|wang|duit|rm\s*\d+)/i.test(text)
  ) {
    return 'parcel_delivery_payment';
  }

  // 2. Bank Account Suspension / Phishing Verification Scam
  if (
    /(?:bank|banking|online\s*banking|account|akaun|maybank|cimb|rhb|public\s*bank|tac|otp)/i.test(text) &&
    /(?:suspend|risk|verify|confirm|update|locked|blocked|gantung|sekat|sahkan|kemaskini|log\s*in)/i.test(text)
  ) {
    return 'bank_account_verification';
  }

  // 3. Government / Tax Refund Scam
  if (
    /(?:lhdn|tax|cukai|government|kerajaan|refund|pemulangan|hasil|kwsp|epf)/i.test(text) &&
    /(?:refund|pay|processing|fee|pemulangan|bayar|yuran)/i.test(text)
  ) {
    return 'government_refund_payment';
  }

  // 4. Job Offer / Task Advance Fee Scam
  if (
    /(?:job|work|hiring|kerja|jawatan|recruiter|task|tugasan|wfh|part-time|like\s*video|tiktok|shopee\s*agent)/i.test(text) &&
    /(?:fee|deposit|commission|komisen|pay|bayar|starter|yuran|unlock|aktifkan)/i.test(text)
  ) {
    return 'job_offer_fee';
  }

  // 5. Investment / High Return Scam
  if (
    /(?:investment|pelaburan|crypto|trading|forex|bursa|profit|untung|guaranteed|pulangan)/i.test(text) &&
    /(?:return|profit|guaranteed|untung|dijamin|deposit|capital|modal)/i.test(text)
  ) {
    return 'investment_return_scam';
  }

  // 6. Police / Authority Impersonation Scam
  if (
    /(?:police|polis|pdrm|court|mahkamah|warrant|waran|arrest|tangkap|lhdn|kastam|sprm|investigation)/i.test(text) &&
    /(?:fine|jail|denda|penjara|transfer|safe\s*account|akaun\s*selamat|bail|jaminan|cuci\s*wang)/i.test(text)
  ) {
    return 'police_impersonation_scam';
  }

  // 7. Family / Friend Emergency Scam
  if (
    /(?:mom|dad|mak|ayah|ibu|bapa|son|daughter|anak|hospital|accident|kemalangan|kidnap|culik|phone\s*broken)/i.test(text) &&
    /(?:money|transfer|wang|duit|pindah|hospital|emergency|kecemasan)/i.test(text)
  ) {
    return 'family_emergency_scam';
  }

  // 8. Loan / Quick Cash Advance Fee Scam
  if (
    /(?:loan|pinjaman|pembiayaan|credit|kredit|fast\s*cash|wang\s*segera)/i.test(text) &&
    /(?:processing\s*fee|upfront|deposit|bayar\s*dulu|yuran\s*proses|lulus\s*segera|guaranteed\s*approval|yuran)/i.test(text)
  ) {
    return 'loan_advance_fee_scam';
  }

  return null;
}

/**
 * Calculates word-level Jaccard token similarity between two text strings,
 * incorporating basic stemming and stop-word filtering to reliably match paraphrased descriptions.
 */
export function calculateTextSimilarity(textA = '', textB = '') {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'just', 'now',
    'at', 'my', 'your', 'with', 'for', 'to', 'in', 'on', 'of', 'by', 'from',
    'dan', 'di', 'ke', 'yang', 'ini', 'itu', 'ada', 'pada', 'telah', 'saya', 'awak', 'dengan', 'untuk', 'oleh'
  ]);

  const stem = (w) => {
    if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
    if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  };

  const tokenize = (t) => {
    const raw = String(t)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    const filtered = raw.filter((w) => !STOP_WORDS.has(w)).map(stem);
    return new Set(filtered.length > 0 ? filtered : raw);
  };

  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Extracts key incident narrative components (brand entity, scam vehicle/modality, amount, victim scenario)
 * to detect semantically identical scam incidents despite sentence reordering or paraphrasing.
 */
export function extractIncidentFingerprint(reportOrText = {}) {
  const text = typeof reportOrText === 'string'
    ? reportOrText
    : `${reportOrText.text || ''} ${reportOrText.description || ''}`;
  const t = text.toLowerCase();

  // 1. Entity / Brand Impersonation
  let entity = null;
  if (/ninja\s*van/i.test(t)) entity = 'ninjavan';
  else if (/shopee/i.test(t)) entity = 'shopee';
  else if (/pos\s*laju/i.test(t)) entity = 'poslaju';
  else if (/lhdn|hasil/i.test(t)) entity = 'lhdn';
  else if (/maybank/i.test(t)) entity = 'maybank';
  else if (/cimb/i.test(t)) entity = 'cimb';
  else if (/touch\s*n\s*go|\btng\b/i.test(t)) entity = 'touchngo';
  else if (/telegram/i.test(t)) entity = 'telegram';
  else if (/whatsapp/i.test(t)) entity = 'whatsapp';
  else if (/bursa/i.test(t)) entity = 'bursa';

  // 2. Modus Operandi / Vehicle
  let modality = null;
  if (/cash[-_\s]*on[-_\s]*delivery|\bcod\b|(?:demanding|arrived|arrives|ask\s*for).*parcel|parcel.*(?:demanding|ask)/i.test(t)) {
    modality = 'cod_parcel';
  } else if (/like\s*product|hiring\s*manager|earn.*daily|part[-_\s]*time/i.test(t)) {
    modality = 'task_job';
  } else if (/customs\s*fee|parcel.*on\s*hold|unpaid.*fee/i.test(t)) {
    modality = 'parcel_fee';
  } else if (/outstanding\s*tax|legal\s*action.*tax|tax\s*arrear/i.test(t)) {
    modality = 'tax_arrears';
  } else if (/phone\s*fell\s*in\s*water|friend.*new\s*number/i.test(t)) {
    modality = 'phone_broken_emergency';
  } else if (/invest.*receive|syariah.*invest|guaranteed\s*allocation/i.test(t)) {
    modality = 'syariah_investment';
  }

  // 3. Monetary demand
  const amountMatch = t.match(/rm\s*(\d+(?:[.,]\d+)?)/i);
  const amount = amountMatch ? amountMatch[1].replace(',', '.') : null;

  // 4. Victim pretext / unsolicited indicator
  const isUnsolicited = /(?:no\s*record\s*of\s*order|didn'?t\s*order|never\s*order|not\s*ordered|tak\s*order|tiada\s*rekod\s*pesan|tidak\s*pesan)/i.test(t);

  return { entity, modality, amount, isUnsolicited };
}

/**
 * Extracts normalized indicators (phone, bank, url) from a report object.
 */
export function extractReportIndicators(report = {}) {
  const combinedText = `${report.text || ''} ${report.phone || ''} ${report.bankAccount || ''} ${report.url || ''}`;
  const extracted = extractIndicators(combinedText);

  const phones = new Set(extracted.normalizedPhones || []);
  if (report.phone) {
    const p = normalizePhone(report.phone);
    if (p) phones.add(p);
  }

  const bankAccounts = new Set(extracted.bankAccounts || []);
  if (report.bankAccount) {
    const b = normalizeBankAccount(report.bankAccount);
    if (b && b.length >= 8) bankAccounts.add(b);
  }

  const urls = new Set((extracted.urls || []).map(normalizeHostname).filter(Boolean));
  if (report.url) {
    const u = normalizeHostname(report.url);
    if (u) urls.add(u);
  }

  return {
    phones: Array.from(phones),
    bankAccounts: Array.from(bankAccounts),
    urls: Array.from(urls),
    category: (report.category || report.type || '').toLowerCase(),
    concept: getScamConceptPattern(report)
  };
}

/**
 * Groups a flat array of reports into structured Case entities.
 * Automatically handles legacy reports without explicit caseId.
 */
export function getGroupedCases(reportsList = []) {
  if (!Array.isArray(reportsList)) return [];

  const caseMap = new Map();

  reportsList.forEach((report) => {
    // Resolve caseId (defaulting to report.id for backwards compatibility)
    const caseId = String(report.caseId || report.id || report.firebaseId);

    if (!caseMap.has(caseId)) {
      caseMap.set(caseId, {
        caseId,
        caseCode: report.caseCode || (report.reportCode ? `CASE-${report.reportCode.replace('#', '')}` : `CASE-${caseId}`),
        status: report.status || 'unverified',
        rationale: report.rationale || '',
        rationaleEn: report.rationaleEn || '',
        rationaleMs: report.rationaleMs || '',
        category: report.category || report.type || 'general',
        rootReport: report,
        reports: [],
        createdAt: report.timestamp || new Date().toISOString(),
        updatedAt: report.timestamp || new Date().toISOString()
      });
    }

    const currentCase = caseMap.get(caseId);
    currentCase.reports.push(report);

    // If report is designated as root/original, adopt its status & metadata as canonical
    if (report.reportType === 'ORIGINAL' || report.isCaseRoot || currentCase.reports.length === 1) {
      currentCase.rootReport = report;
      currentCase.status = report.status || currentCase.status;
      currentCase.rationale = report.rationale || currentCase.rationale;
      currentCase.rationaleEn = report.rationaleEn || currentCase.rationaleEn;
      currentCase.rationaleMs = report.rationaleMs || currentCase.rationaleMs;
      if (report.reportCode) {
        currentCase.caseCode = `CASE-${report.reportCode.replace('#', '')}`;
      }
    }

    // Keep updated timestamps
    if (new Date(report.timestamp) > new Date(currentCase.updatedAt)) {
      currentCase.updatedAt = report.timestamp;
    }
    if (new Date(report.timestamp) < new Date(currentCase.createdAt)) {
      currentCase.createdAt = report.timestamp;
    }
  });

  const cases = Array.from(caseMap.values()).map((c) => {
    // Sort reports chronologically within case (Original first)
    c.reports.sort((a, b) => {
      if (a.reportType === 'ORIGINAL') return -1;
      if (b.reportType === 'ORIGINAL') return 1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    return {
      ...c,
      reportCount: c.reports.length
    };
  });

  // Sort cases latest active first
  cases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return cases;
}

/**
 * Evaluates whether a newly submitted report is an ORIGINAL, DUPLICATE, or SIMILAR report
 * relative to existing cases/reports, applying strict safety rules for REJECTED cases.
 *
 * @param {object} newReport - The user submission
 * @param {Array} existingReports - Flat list of reports in the system
 * @returns {object} Evaluation decision
 */
export function evaluateReportGrouping(newReport, existingReports = []) {
  const newInd = extractReportIndicators(newReport);
  const groupedCases = getGroupedCases(existingReports);

  let bestMatch = null;
  let bestScore = 0;
  let matchType = 'ORIGINAL'; // 'ORIGINAL' | 'DUPLICATE' | 'SIMILAR'
  let matchingFactors = [];

  for (const caseItem of groupedCases) {
    // Skip cancelled/archived cases
    if (caseItem.status === 'cancelled' || caseItem.status === 'archived') continue;

    const caseInds = caseItem.reports.map(extractReportIndicators);
    const allCasePhones = new Set(caseInds.flatMap((i) => i.phones));
    const allCaseBanks = new Set(caseInds.flatMap((i) => i.bankAccounts));
    const allCaseUrls = new Set(caseInds.flatMap((i) => i.urls));
    const allCaseConcepts = new Set(caseInds.map((i) => i.concept).filter(Boolean));
    const allCaseCategories = new Set(caseInds.map((i) => i.category).filter(Boolean));

    const currentFactors = [];
    let isDuplicate = false;
    let duplicateConfidence = 0;

    // 1. Check strong identifier matches (DUPLICATE)
    // Principle: Money amounts have NO bearing on duplicate classification.
    const sharedPhones = newInd.phones.filter((p) => allCasePhones.has(p));
    if (sharedPhones.length > 0) {
      isDuplicate = true;
      duplicateConfidence = Math.max(duplicateConfidence, 96);
      currentFactors.push(`Matching Phone Number: ${sharedPhones.join(', ')}`);
    }

    const sharedBanks = newInd.bankAccounts.filter((b) => allCaseBanks.has(b));
    if (sharedBanks.length > 0) {
      isDuplicate = true;
      duplicateConfidence = Math.max(duplicateConfidence, 98);
      currentFactors.push(`Matching Bank Account: ${sharedBanks.join(', ')}`);
    }

    const sharedUrls = newInd.urls.filter((u) => allCaseUrls.has(u));
    if (sharedUrls.length > 0) {
      isDuplicate = true;
      duplicateConfidence = Math.max(duplicateConfidence, 95);
      currentFactors.push(`Matching URL/Domain: ${sharedUrls.join(', ')}`);
    }

    // Check identical text match or substantial substring (DUPLICATE)
    const cleanNewText = (newReport.text || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanNewText.length >= 20) {
      for (const r of caseItem.reports) {
        const cleanCaseText = (r.text || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanNewText === cleanCaseText) {
          isDuplicate = true;
          duplicateConfidence = Math.max(duplicateConfidence, 98);
          currentFactors.push('Identical Incident Report Content');
          break;
        }
        if (cleanNewText.length >= 35 && cleanCaseText.length >= 35 && (cleanNewText.includes(cleanCaseText) || cleanCaseText.includes(cleanNewText))) {
          isDuplicate = true;
          duplicateConfidence = Math.max(duplicateConfidence, 97);
          currentFactors.push('Substantial Incident Narrative Overlap');
          break;
        }
      }
    }

    // Check high stemmed narrative similarity (DUPLICATE)
    let maxTextSim = 0;
    for (const r of caseItem.reports) {
      const sim = calculateTextSimilarity(newReport.text || '', r.text || '');
      if (sim > maxTextSim) maxTextSim = sim;
    }

    if (!isDuplicate && maxTextSim >= 0.70) {
      isDuplicate = true;
      duplicateConfidence = Math.max(duplicateConfidence, Math.round(92 + maxTextSim * 6));
      currentFactors.push(`Near-Identical Narrative Content (${Math.round(maxTextSim * 100)}%)`);
    }

    // Check core incident scenario fingerprint match (DUPLICATE)
    if (!isDuplicate) {
      const newFingerprint = extractIncidentFingerprint(newReport);
      if (newFingerprint.entity && newFingerprint.modality) {
        for (const r of caseItem.reports) {
          const caseFingerprint = extractIncidentFingerprint(r);
          if (
            caseFingerprint.entity === newFingerprint.entity &&
            caseFingerprint.modality === newFingerprint.modality
          ) {
            const matchesAmount = newFingerprint.amount && caseFingerprint.amount && newFingerprint.amount === caseFingerprint.amount;
            const matchesUnsolicited = newFingerprint.isUnsolicited && caseFingerprint.isUnsolicited;
            const textSim = calculateTextSimilarity(newReport.text || '', r.text || '');

            if (matchesAmount || matchesUnsolicited || textSim >= 0.40) {
              isDuplicate = true;
              duplicateConfidence = Math.max(duplicateConfidence, 96);
              currentFactors.push(`Identical Incident Scenario: ${newFingerprint.entity.toUpperCase()} (${newFingerprint.modality.replace(/_/g, ' ')})`);
              if (matchesAmount) {
                currentFactors.push(`Matching Demand: RM${newFingerprint.amount}`);
              }
              break;
            }
          }
        }
      }
    }

    if (isDuplicate) {
      // Compound confidence if multiple strong identifiers match
      if (sharedPhones.length + sharedBanks.length + sharedUrls.length > 1) {
        duplicateConfidence = 99;
      }

      if (duplicateConfidence > bestScore) {
        bestScore = duplicateConfidence;
        bestMatch = caseItem;
        matchType = 'DUPLICATE';
        matchingFactors = currentFactors;
      }
      continue; // Duplicate found, move to next case
    }

    // 2. Check pattern / concept similarity (SIMILAR)
    // If no strong identifier matched, examine semantic pattern and category
    let similarConfidence = 0;
    const isSameConcept = newInd.concept && allCaseConcepts.has(newInd.concept);
    const isSameCategory = newInd.category && allCaseCategories.has(newInd.category);

    if (isSameConcept && isSameCategory) {
      // High confidence similarity (85% - 95%)
      similarConfidence = Math.round(85 + maxTextSim * 10);
      currentFactors.push(`Matching Scam Method: ${newInd.concept.replace(/_/g, ' ')}`);
      currentFactors.push(`Matching Category: ${newInd.category}`);
    } else if (isSameConcept) {
      similarConfidence = Math.round(78 + maxTextSim * 12);
      currentFactors.push(`Matching Scam Method: ${newInd.concept.replace(/_/g, ' ')}`);
    } else if (isSameCategory && maxTextSim >= 0.5) {
      similarConfidence = Math.round(72 + maxTextSim * 18);
      currentFactors.push(`Matching Category with ${Math.round(maxTextSim * 100)}% content similarity`);
    } else if (maxTextSim >= 0.65) {
      similarConfidence = Math.round(70 + maxTextSim * 15);
      currentFactors.push(`High content pattern similarity (${Math.round(maxTextSim * 100)}%)`);
    }

    if (similarConfidence > bestScore && similarConfidence >= 60) {
      bestScore = similarConfidence;
      bestMatch = caseItem;
      matchType = 'SIMILAR';
      matchingFactors = currentFactors;
    }
  }

  // 3. Apply Decision Thresholds & Safety Rules (Section 5, 9, 10)
  if (!bestMatch || bestScore < 60) {
    return {
      shouldGroup: false,
      targetCaseId: null,
      targetCase: null,
      reportType: 'ORIGINAL',
      aiClassification: 'ORIGINAL',
      aiConfidence: 100,
      matchingFactors: [],
      inheritedStatus: 'unverified'
    };
  }

  // Target Case is CONFIRMED (Section 9)
  if (bestMatch.status === 'confirmed') {
    if (matchType === 'DUPLICATE' && bestScore >= 80) {
      return {
        shouldGroup: true,
        targetCaseId: bestMatch.caseId,
        targetCase: bestMatch,
        reportType: 'DUPLICATE',
        aiClassification: 'DUPLICATE',
        aiConfidence: bestScore,
        matchingFactors,
        inheritedStatus: 'confirmed'
      };
    }
    if (matchType === 'SIMILAR' && bestScore >= 75) {
      return {
        shouldGroup: true,
        targetCaseId: bestMatch.caseId,
        targetCase: bestMatch,
        reportType: 'SIMILAR',
        aiClassification: 'SIMILAR',
        aiConfidence: bestScore,
        matchingFactors,
        inheritedStatus: 'confirmed'
      };
    }
  }

  // Target Case is REJECTED (Critical Safety Rule - Section 10)
  // "Uncertain reports must NEVER automatically inherit REJECTED status."
  // "Prefer False Separation over False Grouping."
  if (bestMatch.status === 'rejected') {
    // Only VERY-HIGH-CONFIDENCE DUPLICATES (>= 95%) with exact strong identifiers may group
    if (matchType === 'DUPLICATE' && bestScore >= 95) {
      return {
        shouldGroup: true,
        targetCaseId: bestMatch.caseId,
        targetCase: bestMatch,
        reportType: 'DUPLICATE',
        aiClassification: 'DUPLICATE',
        aiConfidence: bestScore,
        matchingFactors,
        inheritedStatus: 'rejected'
      };
    }

    // Medium or Low-confidence SIMILAR reports NEVER group into REJECTED
    return {
      shouldGroup: false,
      targetCaseId: null,
      targetCase: null,
      reportType: 'ORIGINAL',
      aiClassification: 'ORIGINAL',
      aiConfidence: bestScore,
      matchingFactors: [
        `Safety Isolation: Evaluated against rejected case ${bestMatch.caseCode} but separated for manual review.`
      ],
      inheritedStatus: 'unverified'
    };
  }

  // Target Case is PENDING (unverified / under_review)
  if (matchType === 'DUPLICATE' && bestScore >= 85) {
    return {
      shouldGroup: true,
      targetCaseId: bestMatch.caseId,
      targetCase: bestMatch,
      reportType: 'DUPLICATE',
      aiClassification: 'DUPLICATE',
      aiConfidence: bestScore,
      matchingFactors,
      inheritedStatus: bestMatch.status
    };
  }

  if (matchType === 'SIMILAR' && bestScore >= 80) {
    return {
      shouldGroup: true,
      targetCaseId: bestMatch.caseId,
      targetCase: bestMatch,
      reportType: 'SIMILAR',
      aiClassification: 'SIMILAR',
      aiConfidence: bestScore,
      matchingFactors,
      inheritedStatus: bestMatch.status
    };
  }

  // Fallback: False Separation over False Grouping
  return {
    shouldGroup: false,
    targetCaseId: null,
    targetCase: null,
    reportType: 'ORIGINAL',
    aiClassification: 'ORIGINAL',
    aiConfidence: bestScore,
    matchingFactors: [],
    inheritedStatus: 'unverified'
  };
}

/**
 * Checks whether an input query (from Scanner) matches an existing Confirmed or Rejected case.
 * Used by Scanner to display report counters for confirmed cases,
 * or rejection rationale (without counter) for rejected cases.
 */
export function findMatchingCaseForScanner(queryText = '', targets = {}, reportsList = []) {
  if (!reportsList || reportsList.length === 0) return { matched: false };

  const extracted = extractIndicators(queryText);
  const targetPhones = new Set(extracted.normalizedPhones || []);
  if (targets.phone) {
    const p = normalizePhone(targets.phone);
    if (p) targetPhones.add(p);
  }

  const targetBanks = new Set(extracted.bankAccounts || []);
  if (targets.bank) {
    const b = normalizeBankAccount(targets.bank);
    if (b && b.length >= 8) targetBanks.add(b);
  }

  const targetUrls = new Set((extracted.urls || []).map(normalizeHostname).filter(Boolean));
  if (targets.url) {
    const u = normalizeHostname(targets.url);
    if (u) targetUrls.add(u);
  }

  const groupedCases = getGroupedCases(reportsList);

  for (const caseItem of groupedCases) {
    if (caseItem.status !== 'confirmed' && caseItem.status !== 'rejected') continue;

    const caseInds = caseItem.reports.map(extractReportIndicators);
    const casePhones = new Set(caseInds.flatMap((i) => i.phones));
    const caseBanks = new Set(caseInds.flatMap((i) => i.bankAccounts));
    const caseUrls = new Set(caseInds.flatMap((i) => i.urls));

    const matchedPhones = Array.from(targetPhones).filter((p) => casePhones.has(p));
    const matchedBanks = Array.from(targetBanks).filter((b) => caseBanks.has(b));
    const matchedUrls = Array.from(targetUrls).filter((u) => caseUrls.has(u));

    const allMatched = [...matchedPhones, ...matchedBanks, ...matchedUrls];

    if (allMatched.length > 0) {
      if (caseItem.status === 'confirmed') {
        return {
          matched: true,
          status: 'confirmed',
          caseId: caseItem.caseId,
          caseCode: caseItem.caseCode,
          reportCount: caseItem.reportCount,
          matchedIndicators: allMatched,
          caseItem
        };
      }

      if (caseItem.status === 'rejected') {
        return {
          matched: true,
          status: 'rejected',
          caseId: caseItem.caseId,
          caseCode: caseItem.caseCode,
          // Report count is NOT included for rejected cases (Section 14)
          rejectionReason: caseItem.rationale || caseItem.rationaleEn || caseItem.rationaleMs || 'Insufficient evidence to verify this case as a scam.',
          rejectionReasonEn: caseItem.rationaleEn || caseItem.rationale || 'Insufficient evidence to verify this case as a scam.',
          rejectionReasonMs: caseItem.rationaleMs || caseItem.rationale || 'Bukti tidak mencukupi untuk mengesahkan kes ini sebagai penipuan.',
          matchedIndicators: allMatched,
          caseItem
        };
      }
    }
  }

  // 2. Pattern & Concept Matching (Strictly for CONFIRMED cases - Section 10 Safety Rule)
  const trimmedQuery = (queryText || '').trim();
  if (trimmedQuery.length >= 10) {
    const cleanQuery = trimmedQuery.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const queryConcept = getScamConceptPattern({ text: trimmedQuery });

    let bestConfirmedMatch = null;
    let highestSim = 0;
    let matchReason = '';

    for (const caseItem of groupedCases) {
      if (caseItem.status !== 'confirmed') continue;

      for (const report of caseItem.reports) {
        const reportText = (report.text || report.description || '').trim();
        if (!reportText) continue;

        const cleanReport = reportText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

        // 2a. Direct or substantial text match
        const isExactMatch = cleanQuery.length >= 15 && cleanQuery === cleanReport;
        const isSubstantialSubstring = cleanQuery.length >= 35 && cleanReport.length >= 35 &&
          (cleanQuery.includes(cleanReport) || cleanReport.includes(cleanQuery));

        if (isExactMatch || isSubstantialSubstring) {
          return {
            matched: true,
            status: 'confirmed',
            caseId: caseItem.caseId,
            caseCode: caseItem.caseCode,
            reportCount: caseItem.reportCount,
            matchedIndicators: ['Identical Incident Report Content'],
            caseItem
          };
        }

        // 2b. Core scenario fingerprint match (DUPLICATE)
        const queryFingerprint = extractIncidentFingerprint(trimmedQuery);
        const reportFingerprint = extractIncidentFingerprint(reportText);
        if (
          queryFingerprint.entity &&
          reportFingerprint.entity &&
          queryFingerprint.entity === reportFingerprint.entity &&
          queryFingerprint.modality === reportFingerprint.modality
        ) {
          const matchesAmount = queryFingerprint.amount && reportFingerprint.amount && queryFingerprint.amount === reportFingerprint.amount;
          const matchesUnsolicited = queryFingerprint.isUnsolicited && reportFingerprint.isUnsolicited;
          const textSim = calculateTextSimilarity(trimmedQuery, reportText);

          if (matchesAmount || matchesUnsolicited || textSim >= 0.40) {
            return {
              matched: true,
              status: 'confirmed',
              caseId: caseItem.caseId,
              caseCode: caseItem.caseCode,
              reportCount: caseItem.reportCount,
              matchedIndicators: [`Identical Incident Scenario: ${queryFingerprint.entity.toUpperCase()} (${queryFingerprint.modality.replace(/_/g, ' ')})`],
              caseItem
            };
          }
        }

        // 2c. Word-level text similarity & concept matching
        const textSim = calculateTextSimilarity(trimmedQuery, reportText);
        const reportConcept = getScamConceptPattern(report);
        const sameConcept = queryConcept && reportConcept && queryConcept === reportConcept;

        if (textSim >= 0.50 && textSim > highestSim) {
          highestSim = textSim;
          bestConfirmedMatch = caseItem;
          matchReason = `Similar Scam Incident Description (${Math.round(textSim * 100)}% match)`;
        } else if (sameConcept && textSim >= 0.20 && (textSim + 0.3) > highestSim) {
          highestSim = textSim + 0.3;
          bestConfirmedMatch = caseItem;
          matchReason = `Scam Pattern: ${queryConcept.replace(/_/g, ' ')}`;
        } else if (sameConcept && report.category && trimmedQuery.toLowerCase().includes(report.category.toLowerCase()) && !bestConfirmedMatch) {
          bestConfirmedMatch = caseItem;
          matchReason = `Scam Pattern: ${queryConcept.replace(/_/g, ' ')}`;
        }
      }
    }

    if (bestConfirmedMatch) {
      return {
        matched: true,
        status: 'confirmed',
        caseId: bestConfirmedMatch.caseId,
        caseCode: bestConfirmedMatch.caseCode,
        reportCount: bestConfirmedMatch.reportCount,
        matchedIndicators: [matchReason || 'Confirmed Scam Pattern'],
        caseItem: bestConfirmedMatch
      };
    }
  }

  return { matched: false };
}

/**
 * Finds all pending/unverified reports that match a confirmed case via indicators,
 * exact content, or pattern/concept similarity.
 *
 * @param {Array} targetReports - The reports belonging to the confirmed case
 * @param {Array} allReports - The entire list of reports in the system
 * @returns {Array} Array of candidate objects { report, matchType, matchReason } to auto-confirm
 */
export function findSimilarReportsForConfirmation(targetReports = [], allReports = []) {
  if (!targetReports.length || !allReports.length) return [];

  const confirmedInds = targetReports.map(extractReportIndicators);
  const confirmedPhones = new Set(confirmedInds.flatMap((i) => i.phones));
  const confirmedBanks = new Set(confirmedInds.flatMap((i) => i.bankAccounts));
  const confirmedUrls = new Set(confirmedInds.flatMap((i) => i.urls));
  const confirmedConcepts = new Set(confirmedInds.map((i) => i.concept).filter(Boolean));
  const confirmedCategories = new Set(confirmedInds.map((i) => i.category).filter(Boolean));

  const targetCaseIds = new Set(targetReports.map((r) => String(r.caseId || r.id)));
  const targetReportIds = new Set(targetReports.map((r) => String(r.id || r.firebaseId)));

  const matchedCandidates = [];

  for (const candidate of allReports) {
    const candidateId = String(candidate.id || candidate.firebaseId);
    const candidateCaseId = String(candidate.caseId || candidate.id);

    // Skip if already part of the target case
    if (targetCaseIds.has(candidateCaseId) || targetReportIds.has(candidateId)) continue;

    // Only auto-confirm pending / unverified / under_review reports (never rejected or archived)
    if (candidate.status === 'confirmed' || candidate.status === 'rejected' || candidate.status === 'archived') continue;

    const candInd = extractReportIndicators(candidate);
    const candText = (candidate.text || candidate.description || '').trim();
    const cleanCandText = candText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    let isMatch = false;
    let matchType = 'SIMILAR';
    let matchReason = '';

    // 1. Check strong indicators (DUPLICATE)
    const matchedPhones = candInd.phones.filter((p) => confirmedPhones.has(p));
    const matchedBanks = candInd.bankAccounts.filter((b) => confirmedBanks.has(b));
    const matchedUrls = candInd.urls.filter((u) => confirmedUrls.has(u));

    if (matchedPhones.length > 0 || matchedBanks.length > 0 || matchedUrls.length > 0) {
      isMatch = true;
      matchType = 'DUPLICATE';
      matchReason = 'Matching Threat Indicator(s)';
    }

    // 2. Check exact / near-identical text (DUPLICATE)
    if (!isMatch && cleanCandText.length >= 15) {
      for (const t of targetReports) {
        const tText = (t.text || t.description || '').trim();
        const cleanTText = tText.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanCandText === cleanTText || (cleanCandText.length >= 35 && cleanTText.length >= 35 && (cleanCandText.includes(cleanTText) || cleanTText.includes(cleanCandText)))) {
          isMatch = true;
          matchType = 'DUPLICATE';
          matchReason = 'Identical Report Content';
          break;
        }
      }
    }

    // 3. Check scenario fingerprint match (DUPLICATE)
    if (!isMatch) {
      const candFingerprint = extractIncidentFingerprint(candidate);
      if (candFingerprint.entity && candFingerprint.modality) {
        for (const t of targetReports) {
          const tFingerprint = extractIncidentFingerprint(t);
          if (
            tFingerprint.entity === candFingerprint.entity &&
            tFingerprint.modality === candFingerprint.modality
          ) {
            const matchesAmount = candFingerprint.amount && tFingerprint.amount && candFingerprint.amount === tFingerprint.amount;
            const matchesUnsolicited = candFingerprint.isUnsolicited && tFingerprint.isUnsolicited;
            const sim = calculateTextSimilarity(candText, t.text || t.description || '');

            if (matchesAmount || matchesUnsolicited || sim >= 0.40) {
              isMatch = true;
              matchType = 'DUPLICATE';
              matchReason = `Identical Scenario (${candFingerprint.entity.toUpperCase()} ${candFingerprint.modality.replace(/_/g, ' ')})`;
              break;
            }
          }
        }
      }
    }

    // 4. Check text similarity
    if (!isMatch && candText.length >= 15) {
      let maxSim = 0;
      for (const t of targetReports) {
        const sim = calculateTextSimilarity(candText, t.text || t.description || '');
        if (sim > maxSim) maxSim = sim;
      }
      if (maxSim >= 0.65) {
        isMatch = true;
        matchType = 'DUPLICATE';
        matchReason = `High Content Similarity (${Math.round(maxSim * 100)}%)`;
      } else if (maxSim >= 0.50) {
        isMatch = true;
        matchType = 'SIMILAR';
        matchReason = `Similar Content (${Math.round(maxSim * 100)}%)`;
      }
    }

    // 4. Check scam concept pattern
    if (!isMatch && candInd.concept && confirmedConcepts.has(candInd.concept)) {
      let maxSim = 0;
      for (const t of targetReports) {
        const sim = calculateTextSimilarity(candText, t.text || t.description || '');
        if (sim > maxSim) maxSim = sim;
      }
      const isSameCategory = candInd.category && confirmedCategories.has(candInd.category);

      if ((isSameCategory && maxSim >= 0.20) || maxSim >= 0.30 || (isSameCategory && candText.length >= 20)) {
        isMatch = true;
        matchType = 'SIMILAR';
        matchReason = `Scam Pattern: ${candInd.concept.replace(/_/g, ' ')}`;
      }
    }

    if (isMatch) {
      matchedCandidates.push({
        report: candidate,
        matchType,
        matchReason
      });
    }
  }

  return matchedCandidates;
}

/**
 * Admin Correction: Unmerge a report from its current Case into a new Pending Case.
 */
export function unmergeReport(reportId, reportsList = []) {
  const targetReport = reportsList.find((r) => r.id === reportId || String(r.id) === String(reportId) || r.firebaseId === reportId);
  if (!targetReport) return { updatedReportsList: reportsList, detachedReport: null };

  const oldCaseId = String(targetReport.caseId || targetReport.id);
  const newCaseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newReportCode = targetReport.reportCode || `#${String(Date.now() % 1000000).padStart(6, '0')}`;

  const updatedReportsList = reportsList.map((r) => {
    if (r.id === reportId || String(r.id) === String(reportId) || r.firebaseId === reportId) {
      return {
        ...r,
        caseId: newCaseId,
        caseCode: `CASE-${newReportCode.replace('#', '')}`,
        reportType: 'ORIGINAL',
        aiClassification: 'ORIGINAL',
        isCaseRoot: true,
        status: 'unverified', // Requires fresh admin review
        rationale: '',
        rationaleEn: '',
        rationaleMs: '',
        unmergedFromCaseId: oldCaseId,
        unmergedAt: new Date().toISOString()
      };
    }
    return r;
  });

  return {
    updatedReportsList,
    oldCaseId,
    newCaseId,
    detachedReport: targetReport
  };
}

/**
 * Admin Correction: Reassign a report to another Case.
 */
export function reassignReport(reportId, targetCaseId, reportsList = []) {
  const targetReport = reportsList.find((r) => r.id === reportId || String(r.id) === String(reportId) || r.firebaseId === reportId);
  const groupedCases = getGroupedCases(reportsList);
  const destinationCase = groupedCases.find((c) => c.caseId === String(targetCaseId));

  if (!targetReport || !destinationCase) {
    return { updatedReportsList: reportsList, reassignedReport: null };
  }

  const oldCaseId = String(targetReport.caseId || targetReport.id);

  const updatedReportsList = reportsList.map((r) => {
    if (r.id === reportId || String(r.id) === String(reportId) || r.firebaseId === reportId) {
      return {
        ...r,
        caseId: destinationCase.caseId,
        caseCode: destinationCase.caseCode,
        reportType: r.reportType === 'ORIGINAL' ? 'DUPLICATE' : r.reportType,
        status: destinationCase.status,
        rationale: destinationCase.rationale,
        rationaleEn: destinationCase.rationaleEn,
        rationaleMs: destinationCase.rationaleMs,
        reassignedFromCaseId: oldCaseId,
        reassignedAt: new Date().toISOString()
      };
    }
    return r;
  });

  return {
    updatedReportsList,
    oldCaseId,
    targetCaseId: destinationCase.caseId,
    reassignedReport: targetReport
  };
}

/**
 * Admin Correction: Merge Case A into Case B.
 */
export function mergeCases(sourceCaseId, targetCaseId, reportsList = []) {
  const groupedCases = getGroupedCases(reportsList);
  const sourceCase = groupedCases.find((c) => c.caseId === String(sourceCaseId));
  const destinationCase = groupedCases.find((c) => c.caseId === String(targetCaseId));

  if (!sourceCase || !destinationCase || sourceCaseId === targetCaseId) {
    return { updatedReportsList: reportsList, mergedCount: 0 };
  }

  let mergedCount = 0;
  const updatedReportsList = reportsList.map((r) => {
    const reportCaseId = String(r.caseId || r.id);
    if (reportCaseId === String(sourceCaseId)) {
      mergedCount += 1;
      return {
        ...r,
        caseId: destinationCase.caseId,
        caseCode: destinationCase.caseCode,
        reportType: r.reportType === 'ORIGINAL' ? 'DUPLICATE' : r.reportType,
        status: destinationCase.status,
        rationale: destinationCase.rationale,
        rationaleEn: destinationCase.rationaleEn,
        rationaleMs: destinationCase.rationaleMs,
        mergedFromCaseId: sourceCaseId,
        mergedAt: new Date().toISOString()
      };
    }
    return r;
  });

  return {
    updatedReportsList,
    sourceCaseId,
    targetCaseId,
    mergedCount
  };
}
