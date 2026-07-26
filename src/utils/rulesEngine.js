/**
 * ScamShield MY - Hybrid Risk Assessment & Pattern Rules Engine
 */

// Demo Database of known indicators and reputation records
export const LOCAL_BLACK_LIST = {
  phoneNumbers: ['+6011-8762512', '+6017-9921102', '+6012-3345591', '+6019-2238475'],
  urls: [
    'pos-laju.info',
    'maybank-secure-login.xyz',
    'shopee-rewards-claim.net',
    'tnb-bill-payment.club',
    'lhdn-refund.org'
  ],
  bankAccounts: ['164228910239', '564210923049']
};

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
  const phoneRegex = /(\+?6?01[0-9]-?[0-9]{7,8}|\+?6?0[3-9]-?[0-9]{7})/g;
  const paymentRegex = /(RM\s*\d+(\.\d{2})?|\b\d+,\d{3}\s*(RM|ringgit)?|bank\s*transfer|pay\b)/gi;

  const foundUrls = text.match(urlRegex) || [];
  const foundPhones = text.match(phoneRegex) || [];
  
  // Basic cleaning of domains
  const cleanedUrls = foundUrls.map(url => {
    let domain = url.replace(/https?:\/\//i, '').split('/')[0];
    return domain.toLowerCase();
  });

  return {
    urls: [...new Set(cleanedUrls)],
    phones: [...new Set(foundPhones.map(p => p.trim()))],
    hasPaymentKeywords: paymentRegex.test(text),
    extractedPayment: text.match(/(RM\s*\d+(\.\d{2})?)/gi)?.[0] || null
  };
}

/**
 * Runs the hybrid scoring algorithm on extracted inputs
 * @param {string} text - Message content
 * @param {object} metadata - Extra context (e.g. source, verified reports, QR code)
 */
export function analyzeScamRisk(text, metadata = {}) {
  let score = 0;
  const explanations = [];
  const indicatorsMatched = [];

  const analysis = extractIndicators(text);
  const qrDestination = metadata.qrCode || null;

  // 1. RULE LAYER & SOCIAL ENGINEERING (Weight: 30%)
  let ruleScore = 0;
  const urgencyKeywords = ['urgent', '30 minutes', 'within 24 hours', 'immediately', 'expire', 'fast', 'secrecy', 'secret', 'dont tell', 'don\'t call'];
  const credentialKeywords = ['otp', 'login', 'verify password', 'username', 'click here to update', 'update account', 'suspended'];
  const baitKeywords = ['congratulations', 'won RM', 'free gift', 'earn daily', 'part-time job', 'bonus', 'rewards claim'];

  const hasUrgency = urgencyKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasCreds = credentialKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasBait = baitKeywords.some(kw => text.toLowerCase().includes(kw));

  if (hasUrgency) {
    ruleScore += 12;
    explanations.push({
      category: "urgency",
      label: "Urgency Pressure",
      text: "The message creates false urgency (e.g., tight deadline) to force action without thinking.",
      weight: 12
    });
  }
  if (hasCreds) {
    ruleScore += 10;
    explanations.push({
      category: "credentials",
      label: "Credential Harvesting Request",
      text: "Requests credentials, OTPs, or redirects to suspicious account-verification links.",
      weight: 10
    });
  }
  if (hasBait) {
    ruleScore += 8;
    explanations.push({
      category: "bait",
      label: "Financial Reward Bait",
      text: "Offers high salaries, prizes, or cash rewards for small upfront actions.",
      weight: 8
    });
  }
  score += ruleScore;

  // 2. TECHNICAL INDICATORS (Weight: 25%)
  let techScore = 0;
  
  // URL check
  if (analysis.urls.length > 0) {
    const suspiciousDomains = LOCAL_BLACK_LIST.urls;
    const hasSuspiciousUrl = analysis.urls.some(url => 
      suspiciousDomains.some(bad => url.includes(bad) || bad.includes(url))
    );

    if (hasSuspiciousUrl) {
      techScore += 15;
      explanations.push({
        category: "technical",
        label: "Suspicious Domain Detected",
        text: "The link points to a domain matching known malicious redirects or lookalikes.",
        weight: 15
      });
      indicatorsMatched.push(...analysis.urls);
    } else {
      // General warning on links in unsolicited messages
      techScore += 5;
      explanations.push({
        category: "technical",
        label: "External URL Contained",
        text: "Contains clickable web link; verify domain details before logging in.",
        weight: 5
      });
    }
  }

  // QR destination check
  if (qrDestination) {
    const isSuspiciousQr = LOCAL_BLACK_LIST.urls.some(bad => qrDestination.includes(bad));
    if (isSuspiciousQr) {
      techScore += 10;
      explanations.push({
        category: "technical",
        label: "QR Destination Mismatch",
        text: "The scanned QR code redirects to an unofficial payment or credential collection portal.",
        weight: 10
      });
      indicatorsMatched.push(qrDestination);
    } else {
      techScore += 4;
      explanations.push({
        category: "technical",
        label: "QR Redirect Scanner",
        text: "QR code targets an external link. Confirm destination before proceeding.",
        weight: 4
      });
    }
  }
  score += Math.min(25, techScore);

  // 3. PAYMENT & ACCOUNT REQUESTS (Weight: 15%)
  let paymentScore = 0;
  if (analysis.hasPaymentKeywords || analysis.extractedPayment) {
    paymentScore += 10;
    explanations.push({
      category: "payment",
      label: "Unsolicited Payment Request",
      text: `Requests financial transfer (${analysis.extractedPayment || 'unspecified amount'}) via message rather than secure official portal.`,
      weight: 10
    });

    // Check account blacklist
    const containsBlacklistAccount = LOCAL_BLACK_LIST.bankAccounts.some(acc => text.includes(acc));
    if (containsBlacklistAccount) {
      paymentScore += 5;
      explanations.push({
        category: "payment",
        label: "Blacklisted Bank Account",
        text: "The bank account listed in the message matches a flagged mule account database.",
        weight: 5
      });
    }
  }
  score += paymentScore;

  // 4. SENDER REPUTATION & LOCAL PATTERNS (Weight: 15%)
  let repScore = 0;
  if (analysis.phones.length > 0) {
    const isBlacklistedPhone = analysis.phones.some(phone => 
      LOCAL_BLACK_LIST.phoneNumbers.includes(phone)
    );

    if (isBlacklistedPhone) {
      repScore += 15;
      explanations.push({
        category: "reputation",
        label: "Known Scam Contact Number",
        text: "The phone number matches reported local and campus-wide phishing dispatchers.",
        weight: 15
      });
      indicatorsMatched.push(...analysis.phones);
    } else {
      repScore += 5;
      explanations.push({
        category: "reputation",
        label: "Unknown Unregistered Sender",
        text: "Sender phone number is not listed in local white-directories.",
        weight: 5
      });
    }
  }
  score += Math.min(15, repScore);

  // 5. COMMUNITY EVIDENCE (Weight: 15%)
  let communityScore = 0;
  const verifiedReports = metadata.verifiedReportsCount || 0;
  if (verifiedReports > 0) {
    if (verifiedReports >= 3) {
      communityScore += 15;
      explanations.push({
        category: "community",
        label: "Verified Campus Reports",
        text: `This pattern matches ${verifiedReports} confirmed community scam reports verified by moderators.`,
        weight: 15
      });
    } else {
      communityScore += 8;
      explanations.push({
        category: "community",
        label: "Active Community Review",
        text: `${verifiedReports} similar report is currently under review by campus security/moderators.`,
        weight: 8
      });
    }
  }
  score += communityScore;

  // Keep score capped between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine risk band
  let riskBand = "Low evidence";
  let bandColor = "low";
  let recommendedActions = [
    "Verify the sender identity independently.",
    "Do not download any attachments or click on nested links."
  ];

  if (score >= 80) {
    riskBand = "Critical";
    bandColor = "critical";
    recommendedActions = [
      "DO NOT transfer money or submit login codes.",
      "Block the sender immediately and delete the message.",
      "Take a screenshot, redact personal details, and submit a report to alert others.",
      "Escalate/Consult your campus security or trusted guardian."
    ];
  } else if (score >= 60) {
    riskBand = "High risk";
    bandColor = "high";
    recommendedActions = [
      "Do not pay or share credentials under any circumstance.",
      "Contact the official company using a verified phone number from their main website.",
      "Share this scam checker result with your family caregiver or guardian."
    ];
  } else if (score >= 30) {
    riskBand = "Caution";
    bandColor = "caution";
    recommendedActions = [
      "Pause before clicking. The message utilizes social-engineering pressure.",
      "Check if the message uses unofficial communication channels (e.g. Gmail instead of corporate domain)."
    ];
  }

  // Calculate confidence score based on the amount of evidence provided
  let confidence = "Low";
  let evidenceCount = (analysis.urls.length > 0 ? 1 : 0) + 
                      (analysis.phones.length > 0 ? 1 : 0) + 
                      (qrDestination ? 1 : 0) +
                      (verifiedReports > 0 ? 1 : 0);
  
  if (evidenceCount >= 3) confidence = "High";
  else if (evidenceCount >= 1) confidence = "Medium";

  return {
    score,
    riskBand,
    bandColor,
    confidence,
    explanations,
    indicators: analysis,
    indicatorsMatched,
    recommendedActions
  };
}
