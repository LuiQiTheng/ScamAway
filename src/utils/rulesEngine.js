/**
 * ScamShield - Hybrid Risk Assessment & Pattern Rules Engine
 */

// Demo mock screenshots database for OCR simulation

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

  const blacklist = metadata.blacklist || { phoneNumbers: [], urls: [], bankAccounts: [] };

  // 1. SENDER REPUTATION & BLACKLIST MATCHES
  if (analysis.phones.length > 0) {
    const isBlacklistedPhone = analysis.phones.some(phone => 
      blacklist.phoneNumbers.includes(phone)
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
  const matchedBlacklistAccount = blacklist.bankAccounts.find(acc => text.includes(acc));
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
    const suspiciousDomains = blacklist.urls;
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
    const isSuspiciousQr = blacklist.urls.some(bad => qrDestination.includes(bad));
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
  
  const urgencyKeywords = ['urgent', 'urgently', '30 minutes', 'within 24 hours', 'immediately', 'expire', 'fast', 'segera', 'cepat', 'now', 'sekarang', 'terkini', 'hari ini', 'masa terhad', 'limited time', 'hours', 'hrs', 'mins'];
  const secrecyKeywords = ['secret', 'secrecy', 'dont tell', 'don\'t tell', 'dont let', 'don\'t let', 'rahsia', 'jangan beritahu', 'keep it secret', 'keep this secret', 'between us', 'don\'t call', 'jangan call', 'jangan hubungi'];
  const credentialKeywords = ['otp', 'login', 'verify password', 'username', 'click here to update', 'update account', 'suspended', 'tac code', 'kod tac', 'kata laluan', 'sahkan id', 'log masuk'];
  const falseGuaranteeKeywords = ['100% true', '100% safe', 'no risk', 'without risk', 'guarantee', 'guaranteed', 'dijamin', '100% untung', 'tanpa risiko', 'pasti untung', 'syariah patuh', 'patuh syariah'];
  const baitKeywords = ['congratulations', 'won rm', 'free gift', 'earn daily', 'part-time job', 'bonus', 'rewards', 'reward', 'komisen', 'gaji', 'untung', 'tahniah', 'kerja sambilan', 'hadiah', 'percuma', 'tebus'];
  const fearThreatKeywords = ['fined', 'fine', 'denda', 'jail', 'penjara', 'arrest', 'arrested', 'warrant', 'warant', 'waran tangkap', 'saman', 'blacklisted', 'tax debt', 'cukai', 'lhdn penalty', 'lock account', 'account frozen', 'akaun dibeku', 'court action', 'legal action', 'tindakan undang-undang'];
  
  // Family impersonation keywords (lost phone scams)
  const familyEmergencyKeywords = ['mum', 'dad', 'mak', 'ayah', 'ibu', 'bapa', 'abang', 'adik', 'fell into water', 'rosak', 'damaged phone', 'new number', 'friend\'s account', 'friend\'s phone', 'tukar nombor', 'telefon rosak', 'masuk hospital', 'kemalangan'];
  // Authority impersonation
  const authorityKeywords = ['police', 'polis', 'court', 'mahkamah', 'lhdn', 'jpj', 'saman', 'arrest warrant', 'pos laju', 'poslaju', 'courier tax', 'customs', 'kastam', 'sprm', 'mcmc', 'skmm', 'bank negara', 'bnm', 'kwsp', 'epf'];

  const lowerText = text.toLowerCase();

  const hasUrgency = urgencyKeywords.some(kw => lowerText.includes(kw)) || /within\s*\d+\s*(hours?|hrs?|mins?|minutes?|days?)/i.test(text);
  const hasSecrecy = secrecyKeywords.some(kw => lowerText.includes(kw));
  const hasCreds = credentialKeywords.some(kw => lowerText.includes(kw));
  const hasFalseGuarantee = falseGuaranteeKeywords.some(kw => lowerText.includes(kw));
  const hasBait = baitKeywords.some(kw => lowerText.includes(kw));
  const hasFearThreat = fearThreatKeywords.some(kw => lowerText.includes(kw));
  const hasFamilyEmergency = familyEmergencyKeywords.some(kw => lowerText.includes(kw));
  const hasAuthority = authorityKeywords.some(kw => lowerText.includes(kw));

  // Advanced heuristic: Impossible ROI / Investment Multiplier Detection
  // e.g. "Transfer me RM1000, I give u rewards RM1000000" or "give RM100 receive RM10000"
  let hasImpossibleRoi = false;
  const numbersInText = (text.match(/rm\s*[\d,]+|\b\d+,\d+|\b\d{3,}\b/gi) || [])
    .map(n => parseFloat(n.replace(/rm\s*|,/gi, '')))
    .filter(n => !isNaN(n));

  if (numbersInText.length >= 2) {
    const minVal = Math.min(...numbersInText);
    const maxVal = Math.max(...numbersInText);
    if (minVal > 0 && maxVal / minVal >= 5) {
      hasImpossibleRoi = true;
    }
  } else if ((lowerText.includes('transfer') || lowerText.includes('lend') || lowerText.includes('give') || lowerText.includes('pay') || lowerText.includes('deposit') || lowerText.includes('bank in') || lowerText.includes('pindah')) &&
             (lowerText.includes('reward') || lowerText.includes('return') || lowerText.includes('profit') || lowerText.includes('receive') || lowerText.includes('pulangan') || lowerText.includes('untung')) &&
             (lowerText.includes('100%') || lowerText.includes('guarantee') || lowerText.includes('jamin') || lowerText.includes('rm'))) {
    hasImpossibleRoi = true;
  }

  if (hasImpossibleRoi) {
    ruleContribution += 50;
    explanations.push({
      category: "bait",
      label: "Impossible Investment Payout / Money Multiplier Scam",
      text: "Prompts unrealistic return ratios or guaranteed financial multipliers (e.g. pay small deposit, get astronomical rewards/returns). This is a textbook Advance-Fee / Investment Scam tactic.",
      weight: 50
    });
  }

  if (hasFalseGuarantee) {
    ruleContribution += 25;
    explanations.push({
      category: "bait",
      label: "False 'Zero-Risk / 100% Guaranteed' Claim",
      text: "Uses false assurances ('100% true', 'no risk', 'guaranteed payout') to trick victims into dropping their guard.",
      weight: 25
    });
  }

  if (hasFearThreat) {
    ruleContribution += 45;
    explanations.push({
      category: "threat",
      label: "Fear & Extortion Pressure (Fines / Jail / Arrest)",
      text: "Uses legal threats, jail sentences, heavy fines, or account freezing to terrify victims into immediate compliance.",
      weight: 45
    });
  }

  if (hasSecrecy) {
    ruleContribution += 25;
    explanations.push({
      category: "urgency",
      label: "Secrecy & Social Isolation Tactics",
      text: "Instructs you to keep the request secret ('don't tell anyone', 'don't call'), deliberately isolating you from advice of family or authorities.",
      weight: 25
    });
  }

  if (hasUrgency) {
    ruleContribution += 20;
    explanations.push({
      category: "urgency",
      label: "Urgency Pressure Detected",
      text: "The sender pressures you to act immediately (e.g. 'now', 'within 2 hours') to bypass rational safety checks.",
      weight: 20
    });
  }
  if (hasCreds) {
    ruleContribution += 20;
    explanations.push({
      category: "credentials",
      label: "Credential / OTP Harvesting Pattern",
      text: "Asks for sensitive credentials, PINs, OTP/TAC verification codes, or login overrides.",
      weight: 20
    });
  }
  if (hasBait && !hasImpossibleRoi && !hasFalseGuarantee) {
    ruleContribution += 15;
    explanations.push({
      category: "bait",
      label: "Financial Payout & Task Bait",
      text: "Offers unverified cash prizes, daily commission tasks, or free rewards designed to lure upfront deposits.",
      weight: 15
    });
  }
  if (hasFamilyEmergency) {
    ruleContribution += 25;
    explanations.push({
      category: "impersonation",
      label: "Family Impersonation Bait",
      text: "Matches a common 'damaged phone / new number / hospital emergency' scam targeting family members.",
      weight: 25
    });
  }
  if (hasAuthority) {
    ruleContribution += 20;
    explanations.push({
      category: "impersonation",
      label: "Authority / Government Impersonation",
      text: "Impersonates official agencies (LHDN, JPJ, Royal Malaysia Police) or courier platforms to establish fake authority.",
      weight: 20
    });
  }

  // 3. PAYMENT TRIGGER WORDS (if not already handled by blacklist account)
  let paymentContribution = 0;
  if (analysis.hasPaymentKeywords || analysis.extractedPayment || lowerText.includes('transfer') || lowerText.includes('pay') || lowerText.includes('lend') || lowerText.includes('bank in') || lowerText.includes('pindah') || lowerText.includes('bayar')) {
    paymentContribution += 15;
    explanations.push({
      category: "payment",
      label: "Direct Money Transfer Request",
      text: `Requests financial transfer (${analysis.extractedPayment || 'unspecified amount'}) through peer messaging rather than official corporate portals.`,
      weight: 15
    });
  }

  // 4. COMBINATION PENALTY (Multipliers for high-risk co-occurrences)
  let combinationContribution = 0;
  if ((analysis.hasPaymentKeywords || analysis.extractedPayment || lowerText.includes('transfer')) && (hasUrgency || hasSecrecy || hasFearThreat || hasImpossibleRoi || hasFalseGuarantee)) {
    combinationContribution += 20;
    explanations.push({
      category: "rule_fusion",
      label: "Critical Risk Co-occurrence",
      text: "Combining direct money transfer demands with urgency, secrecy, false guarantees, or impossible rewards indicates extreme scam probability.",
      weight: 20
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
