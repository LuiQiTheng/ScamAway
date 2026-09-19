import { describe, it, expect } from 'vitest';
import {
  getScamConceptPattern,
  calculateTextSimilarity,
  extractReportIndicators,
  getGroupedCases,
  evaluateReportGrouping,
  findMatchingCaseForScanner,
  findSimilarReportsForConfirmation,
  unmergeReport,
  reassignReport,
  mergeCases
} from '../utils/caseGrouping';

describe('Duplicate & Similar Case Grouping System (Section 29)', () => {
  // Test 1: Exact duplicate
  it('Test 1: Exact duplicate groups with high confidence', () => {
    const existingReports = [
      {
        id: 'rep-001',
        caseId: 'case-001',
        caseCode: 'CASE-001',
        text: 'Scam call from +60123456789 claiming to be Maybank security.',
        phone: '012-3456789',
        category: 'finance',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-002',
      text: 'Scam call from +60123456789 asking for OTP.',
      phone: '+60123456789',
      category: 'finance',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.targetCaseId).toBe('case-001');
    expect(evaluation.reportType).toBe('DUPLICATE');
    expect(evaluation.aiConfidence).toBeGreaterThanOrEqual(95);
    expect(evaluation.matchingFactors.some(f => f.includes('Phone'))).toBe(true);
  });

  // Test 2: Duplicate with different monetary amount
  it('Test 2: Duplicate with different monetary amount groups correctly', () => {
    const existingReports = [
      {
        id: 'rep-010',
        caseId: 'case-010',
        caseCode: 'CASE-010',
        text: 'Paid RM 500 to scam account 1122334455 Maybank for fake investment.',
        bankAccount: '1122334455',
        category: 'finance',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-011',
      text: 'I was scammed RM 3,500 by same scammer account 1122334455.',
      bankAccount: '1122334455',
      category: 'finance',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.targetCaseId).toBe('case-010');
    expect(evaluation.reportType).toBe('DUPLICATE');
    expect(evaluation.aiConfidence).toBeGreaterThanOrEqual(95);
  });

  // Test 3: Same scam method but different phone number
  it('Test 3: Same scam method but different phone number classifies as SIMILAR', () => {
    const existingReports = [
      {
        id: 'rep-020',
        caseId: 'case-020',
        caseCode: 'CASE-020',
        text: 'Pos Laju parcel delivery held at customs. Please pay RM 50 clearance fee.',
        phone: '0121111111',
        category: 'parcel',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-021',
      text: 'Ninja Van package delivery failed fee required to release parcel.',
      phone: '0199999999', // Different phone
      category: 'parcel',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.reportType).toBe('SIMILAR');
    expect(evaluation.matchingFactors.some(f => f.includes('Scam Method'))).toBe(true);
  });

  // Test 4: High-confidence Similar
  it('Test 4: High-confidence Similar groups when matching archetype and category', () => {
    const existingReports = [
      {
        id: 'rep-030',
        caseId: 'case-030',
        caseCode: 'CASE-030',
        text: 'Online job offer telegram task: pay deposit commission to unlock part-time work.',
        category: 'job',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-031',
      text: 'WFH job hiring recruiter asking for starter fee commission to like tiktok videos.',
      category: 'job',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.reportType).toBe('SIMILAR');
    expect(evaluation.aiConfidence).toBeGreaterThanOrEqual(75);
    expect(evaluation.inheritedStatus).toBe('confirmed');
  });

  // Test 5: Low-confidence Similar
  it('Test 5: Low-confidence or unrelated report creates new ORIGINAL case', () => {
    const existingReports = [
      {
        id: 'rep-040',
        caseId: 'case-040',
        caseCode: 'CASE-040',
        text: 'Pos Laju parcel clearance fee scam.',
        phone: '0121111111',
        category: 'parcel',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-041',
      text: 'Random spam text offering casino bonus credits.',
      phone: '0177777777',
      category: 'other',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(false);
    expect(evaluation.reportType).toBe('ORIGINAL');
    expect(evaluation.targetCaseId).toBeNull();
  });

  // Test 6: High-confidence Duplicate against a CONFIRMED Case
  it('Test 6: High-confidence Duplicate against a CONFIRMED Case auto-groups and inherits status', () => {
    const existingReports = [
      {
        id: 'rep-050',
        caseId: 'case-050',
        caseCode: 'CASE-050',
        text: 'Verified scam URL: http://maybank2u-secure-login.xyz phishing page.',
        url: 'maybank2u-secure-login.xyz',
        category: 'phishing',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-051',
      text: 'Received SMS linking to https://maybank2u-secure-login.xyz',
      url: 'https://maybank2u-secure-login.xyz',
      category: 'phishing',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.targetCaseId).toBe('case-050');
    expect(evaluation.reportType).toBe('DUPLICATE');
    expect(evaluation.inheritedStatus).toBe('confirmed');
  });

  // Test 7: High-confidence Duplicate against a REJECTED Case
  it('Test 7: High-confidence Duplicate against a REJECTED Case groups into the rejected case', () => {
    const existingReports = [
      {
        id: 'rep-060',
        caseId: 'case-060',
        caseCode: 'CASE-060',
        text: 'Reported phone 012-3334444 as scam.',
        phone: '012-3334444',
        category: 'emergency',
        status: 'rejected',
        rationale: 'Legitimate business inquiry, verified safe.',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    const newReport = {
      id: 'rep-061',
      text: 'Call from 012-3334444 asking for information.',
      phone: '012-3334444',
      category: 'emergency',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.targetCaseId).toBe('case-060');
    expect(evaluation.aiConfidence).toBeGreaterThanOrEqual(95);
    expect(evaluation.inheritedStatus).toBe('rejected');
  });

  // Test 8: Medium/low-confidence Similar against a REJECTED Case (False Separation Safety Rule)
  it('Test 8: Medium or low-confidence Similar against a REJECTED Case NEVER groups into rejected case', () => {
    const existingReports = [
      {
        id: 'rep-070',
        caseId: 'case-070',
        caseCode: 'CASE-070',
        text: 'Reported parcel delivery payment message from DHL.',
        phone: '012-8881111',
        category: 'parcel',
        status: 'rejected',
        rationale: 'Customer service message confirmed by DHL.',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    // Different sender phone number with delivery payment keywords
    const newReport = {
      id: 'rep-071',
      text: 'Pos Laju bungkusan tertahan bayar yuran RM30.',
      phone: '019-5552222',
      category: 'parcel',
      timestamp: '2026-09-02T10:00:00Z'
    };

    const evaluation = evaluateReportGrouping(newReport, existingReports);

    // CRITICAL SAFETY RULE (Section 10 & 26):
    // Must NOT group into the REJECTED case. Must form a new unverified ORIGINAL case.
    expect(evaluation.shouldGroup).toBe(false);
    expect(evaluation.reportType).toBe('ORIGINAL');
    expect(evaluation.targetCaseId).toBeNull();
    expect(evaluation.inheritedStatus).toBe('unverified');
    expect(evaluation.matchingFactors.some(f => f.includes('Safety Isolation'))).toBe(true);
  });

  // Test 9: Scanner result for REJECTED vs CONFIRMED (Section 14 & 15)
  it('Test 9: Scanner returns report counter for CONFIRMED case but hides counter for REJECTED case', () => {
    const reports = [
      {
        id: 'rep-080',
        caseId: 'case-080',
        caseCode: 'CASE-080',
        text: 'Confirmed loan scam phone 011-22223333',
        phone: '011-22223333',
        category: 'finance',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      },
      {
        id: 'rep-081',
        caseId: 'case-080',
        caseCode: 'CASE-080',
        text: 'Also got scam call from 011-22223333',
        phone: '011-22223333',
        category: 'finance',
        status: 'confirmed',
        reportType: 'DUPLICATE',
        timestamp: '2026-09-01T11:00:00Z'
      },
      {
        id: 'rep-090',
        caseId: 'case-090',
        caseCode: 'CASE-090',
        text: 'Rejected inquiry phone 014-99998888',
        phone: '014-99998888',
        category: 'job',
        status: 'rejected',
        rationale: 'Official verified company recruiter.',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      }
    ];

    // Scanner checks confirmed phone
    const confirmedMatch = findMatchingCaseForScanner('', { phone: '011-22223333' }, reports);
    expect(confirmedMatch.matched).toBe(true);
    expect(confirmedMatch.status).toBe('confirmed');
    expect(confirmedMatch.reportCount).toBe(2);

    // Scanner checks rejected phone
    const rejectedMatch = findMatchingCaseForScanner('', { phone: '014-99998888' }, reports);
    expect(rejectedMatch.matched).toBe(true);
    expect(rejectedMatch.status).toBe('rejected');
    expect(rejectedMatch.rejectionReason).toBe('Official verified company recruiter.');
    // Section 14 rule: Report count must NOT be presented for rejected cases
    expect(rejectedMatch.reportCount).toBeUndefined();
  });

  // Test 10: Admin Unmerge
  it('Test 10: Admin can Unmerge a report into an independent PENDING case', () => {
    const reports = [
      {
        id: 'rep-101',
        caseId: 'case-100',
        caseCode: 'CASE-100',
        text: 'First report',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      },
      {
        id: 'rep-102',
        caseId: 'case-100',
        caseCode: 'CASE-100',
        text: 'Second report grouped by mistake',
        status: 'confirmed',
        reportType: 'DUPLICATE',
        timestamp: '2026-09-01T11:00:00Z'
      }
    ];

    const initialCases = getGroupedCases(reports);
    expect(initialCases[0].reportCount).toBe(2);

    const { updatedReportsList, newCaseId } = unmergeReport('rep-102', reports);

    const resultingCases = getGroupedCases(updatedReportsList);
    expect(resultingCases.length).toBe(2);

    const oldCase = resultingCases.find(c => c.caseId === 'case-100');
    const newCase = resultingCases.find(c => c.caseId === newCaseId);

    expect(oldCase.reportCount).toBe(1);
    expect(newCase.reportCount).toBe(1);
    expect(newCase.status).toBe('unverified'); // Unmerged report requires independent review
  });

  // Test 11: Admin Reassign
  it('Test 11: Admin can Reassign a report to another case with counter updates', () => {
    const reports = [
      {
        id: 'rep-111',
        caseId: 'case-A',
        caseCode: 'CASE-A',
        text: 'Report A1',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      },
      {
        id: 'rep-112',
        caseId: 'case-A',
        caseCode: 'CASE-A',
        text: 'Report A2 belonging to Case B',
        status: 'confirmed',
        reportType: 'DUPLICATE',
        timestamp: '2026-09-01T11:00:00Z'
      },
      {
        id: 'rep-113',
        caseId: 'case-B',
        caseCode: 'CASE-B',
        text: 'Report B1',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T12:00:00Z'
      }
    ];

    const { updatedReportsList } = reassignReport('rep-112', 'case-B', reports);
    const resultingCases = getGroupedCases(updatedReportsList);

    const caseA = resultingCases.find(c => c.caseId === 'case-A');
    const caseB = resultingCases.find(c => c.caseId === 'case-B');

    expect(caseA.reportCount).toBe(1);
    expect(caseB.reportCount).toBe(2);
    const reassigned = updatedReportsList.find(r => r.id === 'rep-112');
    expect(reassigned.caseId).toBe('case-B');
    expect(reassigned.status).toBe('unverified');
  });

  // Test 12: Admin Merge
  it('Test 12: Admin can Merge two cases together into one consolidated case', () => {
    const reports = [
      {
        id: 'rep-121',
        caseId: 'case-source',
        caseCode: 'CASE-SRC',
        text: 'Source report 1',
        status: 'unverified',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T10:00:00Z'
      },
      {
        id: 'rep-122',
        caseId: 'case-source',
        caseCode: 'CASE-SRC',
        text: 'Source report 2',
        status: 'unverified',
        reportType: 'DUPLICATE',
        timestamp: '2026-09-01T11:00:00Z'
      },
      {
        id: 'rep-123',
        caseId: 'case-dest',
        caseCode: 'CASE-DEST',
        text: 'Dest report 1',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-01T09:00:00Z'
      }
    ];

    const { updatedReportsList, mergedCount } = mergeCases('case-source', 'case-dest', reports);
    expect(mergedCount).toBe(2);

    const resultingCases = getGroupedCases(updatedReportsList);
    expect(resultingCases.length).toBe(1);

    const destCase = resultingCases.find(c => c.caseId === 'case-dest');
    expect(destCase.reportCount).toBe(3);
    expect(destCase.status).toBe('confirmed');
    expect(destCase.reports.every(r => r.caseId === 'case-dest')).toBe(true);
  });

  // Test 13: Verify report counter accuracy across all aggregations
  it('Test 13: Report counter accurately counts community reports in getGroupedCases', () => {
    const rawReports = [
      { id: 1, caseId: 'c1', timestamp: '2026-09-01T10:00:00Z' },
      { id: 2, caseId: 'c1', timestamp: '2026-09-01T11:00:00Z' },
      { id: 3, caseId: 'c1', timestamp: '2026-09-01T12:00:00Z' },
      { id: 4, caseId: 'c1', timestamp: '2026-09-01T13:00:00Z' },
      { id: 5, caseId: 'c2', timestamp: '2026-09-01T10:00:00Z' }
    ];

    const cases = getGroupedCases(rawReports);
    const case1 = cases.find(c => c.caseId === 'c1');
    const case2 = cases.find(c => c.caseId === 'c2');

    expect(case1.reportCount).toBe(4);
    expect(case2.reportCount).toBe(1);
  });

  // Test 14: Non-blocking user submission
  it('Test 14: Users are never blocked from submitting reports even if identical case exists', () => {
    const existingReports = [
      {
        id: 'rep-existing',
        caseId: 'case-140',
        text: 'Exact scam message already reported',
        phone: '0129990000',
        status: 'confirmed'
      }
    ];

    const duplicateSubmission = {
      text: 'Exact scam message already reported',
      phone: '0129990000'
    };

    // evaluateReportGrouping must return a decision, never throwing or blocking
    const evaluation = evaluateReportGrouping(duplicateSubmission, existingReports);
    expect(evaluation).toBeDefined();
    expect(evaluation.shouldGroup).toBe(true);
    expect(evaluation.targetCaseId).toBe('case-140');
  });

  // Test 15: Scanner matches confirmed case via pattern/concept matching without phone/bank/URL
  it('Test 15: Scanner matches confirmed case via pattern/concept matching without indicators', () => {
    const reports = [
      {
        id: 1789426462237,
        caseId: 'case_1789426462237',
        caseCode: 'CASE-000022',
        reportCode: '#000022',
        category: 'parcel',
        text: 'NinjaVan rider arrives at my house with a parcel demanding RM150 Cash-On-Delivery. I have no record of ordering anything.',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-14T22:54:22.046Z'
      }
    ];

    // User types exact text into Scanner (Describe incident tab) with NO phone, bank, or URL
    const query = 'NinjaVan rider arrives at my house with a parcel demanding RM150 Cash-On-Delivery. I have no record of ordering anything.';
    const result = findMatchingCaseForScanner(query, {}, reports);

    expect(result.matched).toBe(true);
    expect(result.status).toBe('confirmed');
    expect(result.caseCode).toBe('CASE-000022');
    expect(result.reportCount).toBe(1);

    // User types slight variation of the same COD scam pattern
    const variantQuery = 'NinjaVan courier guy came asking RM150 COD payment for parcel delivery I never ordered';
    const variantResult = findMatchingCaseForScanner(variantQuery, {}, reports);

    expect(variantResult.matched).toBe(true);
    expect(variantResult.status).toBe('confirmed');
    expect(variantResult.caseCode).toBe('CASE-000022');
  });

  // Test 16: findSimilarReportsForConfirmation finds pending reports to auto-confirm
  it('Test 16: findSimilarReportsForConfirmation finds pending reports matching confirmed case', () => {
    const confirmedReports = [
      {
        id: 'rep-conf-1',
        caseId: 'case-conf-1',
        caseCode: 'CASE-000100',
        text: 'NinjaVan rider arrives demanding RM150 Cash-On-Delivery for unknown parcel.',
        category: 'parcel',
        status: 'confirmed',
        reportType: 'ORIGINAL'
      }
    ];

    const allReports = [
      ...confirmedReports,
      // Pending report 1: shares exact same scam pattern
      {
        id: 'rep-pend-1',
        caseId: 'case-pend-1',
        text: 'NinjaVan rider arrives demanding RM150 Cash-On-Delivery for unknown parcel.',
        category: 'parcel',
        status: 'unverified',
        reportType: 'ORIGINAL'
      },
      // Pending report 2: completely unrelated job scam
      {
        id: 'rep-pend-2',
        caseId: 'case-pend-2',
        text: 'Telegram like youtube video task earn RM 300 per day',
        category: 'job',
        status: 'unverified',
        reportType: 'ORIGINAL'
      },
      // Pending report 3: already rejected case (must NOT auto-confirm)
      {
        id: 'rep-rej-1',
        caseId: 'case-rej-1',
        text: 'NinjaVan delivery fee query',
        category: 'parcel',
        status: 'rejected',
        reportType: 'ORIGINAL'
      }
    ];

    const similarCandidates = findSimilarReportsForConfirmation(confirmedReports, allReports);
    expect(similarCandidates.length).toBe(1);
    expect(similarCandidates[0].report.id).toBe('rep-pend-1');
    expect(similarCandidates[0].matchType).toBe('DUPLICATE');
  });

  // Test 17: Semantic Duplicate Classification for Paraphrased / Reordered Reports
  it('Test 17: Evaluates paraphrased and reordered incident descriptions as DUPLICATE', () => {
    const existingReports = [
      {
        id: 'rep-022',
        caseId: 'case-022',
        caseCode: 'CASE-000022',
        reportCode: '#000022',
        text: 'NinjaVan rider arrives at my house with a parcel demanding RM150 Cash-On-Delivery. I have no record of ordering anything.',
        category: 'parcel',
        status: 'confirmed',
        reportType: 'ORIGINAL',
        timestamp: '2026-09-15T10:00:00Z'
      }
    ];

    // Variant 2: Inverted sentence clauses
    const variant2 = {
      id: 'rep-023-a',
      text: 'I have no record of ordering anything, but just now NinjaVan rider arrived at my house with a parcel demanding RM150 Cash-On-Delivery',
      category: 'parcel',
      timestamp: '2026-09-17T10:00:00Z'
    };

    // Variant 3: Synonyms and phrasing variations (didn't order, ask for)
    const variant3 = {
      id: 'rep-023-b',
      text: "I didn't order anything but just now a NinjaVan rider arrived at my house with a parcel and ask for RM150 Cash-On-Delivery",
      category: 'parcel',
      timestamp: '2026-09-17T11:00:00Z'
    };

    const eval2 = evaluateReportGrouping(variant2, existingReports);
    expect(eval2.shouldGroup).toBe(true);
    expect(eval2.targetCaseId).toBe('case-022');
    expect(eval2.reportType).toBe('DUPLICATE');
    expect(eval2.aiConfidence).toBeGreaterThanOrEqual(95);

    const eval3 = evaluateReportGrouping(variant3, existingReports);
    expect(eval3.shouldGroup).toBe(true);
    expect(eval3.targetCaseId).toBe('case-022');
    expect(eval3.reportType).toBe('DUPLICATE');
    expect(eval3.aiConfidence).toBeGreaterThanOrEqual(95);

    // Scanner match verification for Variant 3
    const scannerResult = findMatchingCaseForScanner(variant3.text, {}, existingReports);
    expect(scannerResult.matched).toBe(true);
    expect(scannerResult.status).toBe('confirmed');
    expect(scannerResult.caseCode).toBe('CASE-000022');
  });
});
