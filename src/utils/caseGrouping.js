import { normalizePhone, normalizeBankAccount, normalizeHostname, extractIndicators } from './rulesEngine';

/**
 * Normalizes scam pattern / concept classification for semantic matching.
 */
export function getScamConceptPattern(report = {}) {
  const text = `${report.text || ''} ${report.description || ''} ${report.title || ''} ${report.category || ''}`.toLowerCase();

  // 1. Parcel / Delivery COD Payment Scam
  if (
    /(?:parcel|package|delivery|bungkusan|pos\s*laju|poslaju|ninja\s*van|j&t|courier|cod|cash-on-delivery)/i.test(text) &&
    /(?:fee|pay|payment|transfer|bayar|clearance|release|held|hold|customs|kastam|tertahan|gagal)/i.test(text)
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

  return null;
}

/**
 * Calculates word-level Jaccard token similarity between two text strings.
 */
export function calculateTextSimilarity(textA = '', textB = '') {
  const tokenize = (t) => {
    return new Set(
      String(t)
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
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

    // Compute highest text similarity against reports in this case
    let maxTextSim = 0;
    for (const r of caseItem.reports) {
      const sim = calculateTextSimilarity(newReport.text || '', r.text || '');
      if (sim > maxTextSim) maxTextSim = sim;
    }

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

  return { matched: false };
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
