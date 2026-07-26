/**
 * ScamShield - Hybrid Risk Assessment & Pattern Rules Engine
 */

// Demo Database of known indicators and reputation records (Malaysia focus)
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

  // Track if we hit a critical blacklist match that forces base high-risk
  let matchedBlacklistIndicator = false;

  // 1. SENDER REPUTATION & BLACKLIST MATCHES
  if (analysis.phones.length > 0) {
    const isBlacklistedPhone = analysis.phones.some(phone => 
      LOCAL_BLACK_LIST.phoneNumbers.includes(phone)
    );

    if (isBlacklistedPhone) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "reputation",
        label: "Blacklisted Phone Number",
        text: "The phone number matches reported local/national phishing dispatchers.",
        weight: 35
      });
      indicatorsMatched.push(...analysis.phones);
    }
  }

  // Check account blacklist
  const matchedBlacklistAccount = LOCAL_BLACK_LIST.bankAccounts.find(acc => text.includes(acc));
  if (matchedBlacklistAccount) {
    matchedBlacklistIndicator = true;
    explanations.push({
      category: "payment",
      label: "Blacklisted Bank Account",
      text: `The bank account listed (${matchedBlacklistAccount}) is flagged in the official mule bank account database.`,
      weight: 45
    });
    indicatorsMatched.push(matchedBlacklistAccount);
  }

  // URL blacklist check
  if (analysis.urls.length > 0) {
    const suspiciousDomains = LOCAL_BLACK_LIST.urls;
    const matchedBadDomain = analysis.urls.find(url => 
      suspiciousDomains.some(bad => url.includes(bad) || bad.includes(url))
    );

    if (matchedBadDomain) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "technical",
        label: "Malicious Blacklisted Domain",
        text: `The link (${matchedBadDomain}) points to a verified scam/phishing site in our directory.`,
        weight: 40
      });
      indicatorsMatched.push(matchedBadDomain);
    }
  }

  // QR destination check
  if (qrDestination) {
    const isSuspiciousQr = LOCAL_BLACK_LIST.urls.some(bad => qrDestination.includes(bad));
    if (isSuspiciousQr) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "technical",
        label: "Scam QR Destination Link",
        text: `Scanned QR code points to a blacklisted domain: ${qrDestination}.`,
        weight: 35
      });
      indicatorsMatched.push(qrDestination);
    }
  }

  // Base score setting if matched a blacklisted element
  if (matchedBlacklistIndicator) {
    score = 85; // Immediately flag as critical base score
  }

  // 2. RULE LAYER & SOCIAL ENGINEERING KEYWORDS
  let ruleContribution = 0;
  
  const urgencyKeywords = ['urgent', 'urgently', '30 minutes', 'within 24 hours', 'immediately', 'expire', 'fast', 'secrecy', 'secret', 'dont tell', 'don\'t call', 'segera', 'cepat'];
  const credentialKeywords = ['otp', 'login', 'verify password', 'username', 'click here to update', 'update account', 'suspended', 'tac code'];
  const baitKeywords = ['congratulations', 'won RM', 'free gift', 'earn daily', 'part-time job', 'bonus', 'rewards claim', 'komisen', 'gaji'];
  
  // Family impersonation keywords (lost phone scams)
  const familyEmergencyKeywords = ['mum', 'dad', 'mak', 'ayah', 'fell into water', 'rosak', 'damaged phone', 'new number', 'friend\'s account', 'friend\'s phone', 'tukar nombor', 'telefon rosak'];
  // Authority impersonation
  const authorityKeywords = ['police', 'court', 'lhdn', 'jpj', 'saman', 'arrest warrant', 'pos laju', 'poslaju', 'courier tax', 'customs'];

  const hasUrgency = urgencyKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasCreds = credentialKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasBait = baitKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasFamilyEmergency = familyEmergencyKeywords.some(kw => text.toLowerCase().includes(kw));
  const hasAuthority = authorityKeywords.some(kw => text.toLowerCase().includes(kw));

  if (hasUrgency) {
    ruleContribution += 18;
    explanations.push({
      category: "urgency",
      label: "Urgency Pressure Detected",
      text: "The sender pressures you to act immediately (e.g. 'urgently', 'don't call', 'within 24 hours') to bypass safety validation.",
      weight: 18
    });
  }
  if (hasCreds) {
    ruleContribution += 18;
    explanations.push({
      category: "credentials",
      label: "Credential Harvesting Pattern",
      text: "Asks for sensitive credentials, PINs, OTP/TAC verification codes, or login overrides.",
      weight: 18
    });
  }
  if (hasBait) {
    ruleContribution += 15;
    explanations.push({
      category: "bait",
      label: "Financial Reward baiting",
      text: "Features rewards or online job payouts designed to entice users into registration fees.",
      weight: 15
    });
  }
  if (hasFamilyEmergency) {
    ruleContribution += 25;
    explanations.push({
      category: "impersonation",
      label: "Family Impersonation Bait",
      text: "Matches a common 'damaged phone / new number / hospital emergency' scam targeting parents.",
      weight: 25
    });
  }
  if (hasAuthority) {
    ruleContribution += 20;
    explanations.push({
      category: "impersonation",
      label: "Authority Impersonation Marker",
      text: "Uses official government agencies (LHDN, JPJ, police) or delivery groups to establish trust.",
      weight: 20
    });
  }

  // 3. PAYMENT TRIGGER WORDS (if not already handled by blacklist account)
  let paymentContribution = 0;
  if (analysis.hasPaymentKeywords || analysis.extractedPayment) {
    paymentContribution += 15;
    explanations.push({
      category: "payment",
      label: "Direct Money Transfer Request",
      text: `Requests financial payment (${analysis.extractedPayment || 'unspecified amount'}) through peer messages rather than secure company apps.`,
      weight: 15
    });
  }

  // 4. COMBINATION PENALTY (Multipliers for high-risk co-occurrences)
  let combinationContribution = 0;
  // If payment request + urgency + family impersonation all occur together, it's 99% a scam!
  if ((analysis.hasPaymentKeywords || analysis.extractedPayment) && hasUrgency) {
    combinationContribution += 15;
    explanations.push({
      category: "rule_fusion",
      label: "High-Risk Vector Combination",
      text: "Co-occurrence of financial requests and urgency spikes the probability of active social-engineering.",
      weight: 15
    });
  }

  // Add normal scores if we didn't override with blacklist base
  if (!matchedBlacklistIndicator) {
    score += ruleContribution + paymentContribution + combinationContribution;
    
    // Add minor general indicators if URLs or phone numbers are present
    if (analysis.urls.length > 0) {
      score += 10;
      explanations.push({
        category: "technical",
        label: "Clickable Link Contained",
        text: "Contains external link destinations which should only be verified through official site domains.",
        weight: 10
      });
    }
    if (analysis.phones.length > 0) {
      score += 8;
      explanations.push({
        category: "reputation",
        label: "Unregistered Sender Details",
        text: "Sender phone number requires independent validation.",
        weight: 8
      });
    }
  }

  // 5. COMMUNITY FUSION (Weight: 15% - adds bonus to final score)
  const verifiedReports = metadata.verifiedReportsCount || 0;
  if (verifiedReports > 0) {
    const commBonus = verifiedReports >= 3 ? 15 : 8;
    score += commBonus;
    explanations.push({
      category: "community",
      label: "Active Community Alerts",
      text: `Matches ${verifiedReports} reports confirmed by local citizen moderators.`,
      weight: commBonus
    });
  }

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
      "Contact your bank helpline (997 National Scam Response Centre if in Malaysia) if money was moved."
    ];
  } else if (score >= 60) {
    riskBand = "High risk";
    bandColor = "high";
    recommendedActions = [
      "Do not pay or share credentials under any circumstance.",
      "Contact the official company or family member using a verified channel.",
      "Share this result with a trusted guardian or support circle."
    ];
  } else if (score >= 30) {
    riskBand = "Caution";
    bandColor = "caution";
    recommendedActions = [
      "Pause before clicking. The message utilizes pressure tactics.",
      "Check if the message uses unofficial communication channels (e.g. Gmail instead of corporate domain)."
    ];
  }

  // Calculate confidence score based on the amount of evidence provided
  let confidence = "Low";
  let evidenceCount = (analysis.urls.length > 0 ? 1 : 0) + 
                      (analysis.phones.length > 0 ? 1 : 0) + 
                      (qrDestination ? 1 : 0) +
                      (verifiedReports > 0 ? 1 : 0) +
                      (matchedBlacklistIndicator ? 1 : 0);
  
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
