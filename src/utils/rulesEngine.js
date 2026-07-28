import { analyzeTextWithGemini } from './aiEngine';

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

const WHATSAPP_DOMAINS = new Set(['wa.me', 'api.whatsapp.com', 'whatsapp.com']);

function isWhatsAppDomain(domain = '') {
  return WHATSAPP_DOMAINS.has(domain.toLowerCase());
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Runs the hybrid scoring algorithm on extracted inputs (Blacklist + Gemini AI)
 * @param {string} text - Message content
 * @param {object} metadata - Extra context (e.g. source, verified reports, QR code)
 */
export async function analyzeScamRisk(text, metadata = {}) {
  let score = 0;
  let explanations = [];
  const indicatorsMatched = [];
  const analysis = extractIndicators(text);
  const qrDestination = metadata.qrCode || null;
  const lang = metadata.lang || 'en';

  // Track if we hit a critical blacklist match that forces base high-risk
  let matchedBlacklistIndicator = false;

  const blacklist = metadata.blacklist || { phoneNumbers: [], urls: [], bankAccounts: [] };

  // 1. SENDER REPUTATION & BLACKLIST MATCHES (Instant Rule Engine)
  if (analysis.phones.length > 0) {
    const isBlacklistedPhone = analysis.phones.some(phone => 
      blacklist.phoneNumbers.includes(phone)
    );

    if (isBlacklistedPhone) {
      matchedBlacklistIndicator = true;
      explanations.push({
        category: "reputation",
        label: lang === 'ms' ? "Nombor Telefon Disenarai Hitam" : "Blacklisted Phone Number",
        text: lang === 'ms' ? "Nombor telefon ini sepadan dengan penghantar pancingan data tempatan/nasional yang dilaporkan." : "The phone number matches reported local/national phishing dispatchers.",
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
      label: lang === 'ms' ? "Akaun Bank Disenarai Hitam" : "Blacklisted Bank Account",
      text: lang === 'ms' ? `Akaun bank yang disenaraikan (${matchedBlacklistAccount}) ditandakan dalam pangkalan data akaun keldai rasmi.` : `The bank account listed (${matchedBlacklistAccount}) is flagged in the official mule bank account database.`,
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
        label: lang === 'ms' ? "Domain Disenarai Hitam" : "Malicious Blacklisted Domain",
        text: lang === 'ms' ? `Pautan (${matchedBadDomain}) menghala ke laman web penipuan/phishing yang disahkan dalam direktori kami.` : `The link (${matchedBadDomain}) points to a verified scam/phishing site in our directory.`,
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
        label: lang === 'ms' ? "Pautan Destinasi QR Penipuan" : "Scam QR Destination Link",
        text: lang === 'ms' ? `Kod QR yang diimbas menghala ke domain yang disenarai hitam: ${qrDestination}.` : `Scanned QR code points to a blacklisted domain: ${qrDestination}.`,
        weight: 35
      });
      indicatorsMatched.push(qrDestination);
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
    /\b(?:kerja|jawatan|pengambilan|latihan industri)\b/i
  ]);

  const hasDirectPressure = hasAny(text, [
    /\b(?:act|apply|pay|reply|respond|transfer|click|verify|submit|contact)\s+(?:now|immediately|urgently)\b/i,
    /\b(?:pay|transfer|click|verify|submit).{1,60}\b(?:now|immediately|urgently)\b/i,
    /\bwithin\s*\d+\s*(?:hours?|hrs?|minutes?|mins?|days?)\b/i,
    /\b(?:today only|last chance|limited time|before it expires)\b/i,
    /\b(?:or|otherwise)\s+(?:your\s+)?(?:account|parcel|application).{0,30}(?:blocked|suspended|cancelled|returned|rejected)\b/i,
    /\b(?:bayar|klik|pindah|balas|mohon|hubungi|sahkan)\s+(?:sekarang|segera)\b/i,
    /\bdalam\s+\d+\s*(?:minit|jam|hari)\b/i
  ]);

  const hasSecrecy = hasAny(text, [
    /\b(?:keep (?:it|this) secret|between us|don'?t tell|don'?t call)\b/i,
    /\b(?:rahsia|jangan beritahu|jangan hubungi)\b/i
  ]);
  const hasCreds = hasAny(text, [
    /\b(?:otp|tac code|kod tac|password|kata laluan|banking details)\b/i,
    /\b(?:verify|update|submit|share)\s+(?:your\s+)?(?:login|password|banking|account)\b/i
  ]);
  const hasPrizeOrRefundBait = hasAny(text, [
    /\b(?:congratulations|tahniah).{0,35}(?:won|winner|reward|gift|hadiah)\b/i,
    /\b(?:tax refund|cash refund|refund portal|tebus hadiah|hadiah percuma)\b/i
  ]);
  const hasImpossibleReturn = hasAny(text, [
    /\b(?:guaranteed|dijamin|pasti)\s+(?:profit|return|income|untung)\b/i,
    /\b(?:100%\s+untung|no risk|without risk|tanpa risiko)\b/i
  ]);
  const hasFearThreat = hasAny(text, [
    /\b(?:fined|jail|arrested?|warrant|blacklisted|tax debt|account frozen|court action|legal action)\b/i,
    /\b(?:denda|penjara|waran tangkap|akaun dibeku|tindakan undang-undang)\b/i
  ]);
  const hasFamilyEmergency = hasAny(text, [
    /\b(?:mum|dad|mak|ayah|ibu|bapa|abang|adik).{0,80}(?:new number|phone.{0,10}(?:lost|broken|damaged)|hospital|accident)\b/i,
    /\b(?:telefon rosak|tukar nombor|masuk hospital|kemalangan|akaun kawan)\b/i
  ]);
  const hasAuthority = hasAny(text, [
    /\b(?:police|polis|court|mahkamah|lhdn|jpj|pos laju|poslaju|customs|kastam|sprm|mcmc|skmm|bank negara|bnm|kwsp|epf)\b/i
  ]);

  const hasJobAdvanceFee = isJobPost && hasAny(text, [
    /\b(?:registration|processing|training|starter|security)\s+(?:fee|deposit)\b/i,
    /\b(?:pay|deposit|transfer)\s+rm\s*\d+/i,
    /\b(?:pay|transfer).{0,45}(?:to start|before you start|unlock|first task)\b/i,
    /\b(?:bayar|deposit|pindah).{0,30}(?:untuk mula|yuran pendaftaran|tugasan pertama)\b/i
  ]);
  const hasHighDailyIncomeClaim = hasAny(text, [
    /\b(?:earn|income|salary|gaji).{0,25}rm\s*\d+(?:\s*[-–]\s*\d+)?\s*(?:daily|per day|sehari)\b/i
  ]);
  const hasEasyTaskClaim = hasAny(text, [
    /\b(?:easy|simple)\s+(?:online\s+)?(?:job|task|work)\b/i,
    /\b(?:like products|post reviews|process orders|click orders|no experience needed)\b/i
  ]);
  const hasUnrealisticJobIncome = isJobPost &&
    (hasImpossibleReturn || (hasHighDailyIncomeClaim && hasEasyTaskClaim));

  const whatsappDomains = analysis.urls.filter(isWhatsAppDomain);
  const hasWhatsAppLink = whatsappDomains.length > 0;
  const hasOnlyWhatsAppLinks = analysis.urls.length > 0 &&
    analysis.urls.every(isWhatsAppDomain);
  const hasCorporateEmail = /[\w.+-]+@(?!gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|protonmail\.com)[\w.-]+\.[a-z]{2,}/i.test(text);
  const hasNamedBusinessEntity = /\b(?:sdn\.?\s*bhd\.?|berhad|enterprise|plc|ltd\.?|inc\.?)\b/i.test(text);
  const hasNonWhatsAppWebSource = analysis.urls.some((domain) => !isWhatsAppDomain(domain));
  const hasEmployerIdentitySource = hasCorporateEmail || hasNamedBusinessEntity || hasNonWhatsAppWebSource;
  const hasStrongJobRisk = hasJobAdvanceFee || hasCreds || hasUnrealisticJobIncome ||
    (hasDirectPressure && (analysis.hasPaymentKeywords || hasFearThreat));

  if (hasAuthority && (hasFearThreat || hasCreds || hasDirectPressure || analysis.hasPaymentKeywords)) {
    ruleContribution += 25;
    explanations.push({
      category: "impersonation",
      label: lang === 'ms' ? "Kemungkinan Penyamaran Pihak Berkuasa" : "Possible Authority Impersonation",
      text: lang === 'ms'
        ? "Nama agensi rasmi digunakan bersama tekanan, ancaman, permintaan bayaran atau permintaan maklumat sensitif."
        : "An official agency name is combined with pressure, threats, payment requests, or requests for sensitive information.",
      weight: 25
    });
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

  if (hasDirectPressure) {
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

  if (hasFamilyEmergency) {
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

  if (hasSecrecy && (hasFamilyEmergency || analysis.hasPaymentKeywords)) {
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

    score += ruleContribution;
  }

  // 3. TRUE AI SEMANTIC ANALYSIS (Gemini API)
  try {
    const geminiResult = await analyzeTextWithGemini(text, lang);
    if (geminiResult && Number.isFinite(Number(geminiResult.score))) {
      let semanticScore = Number(geminiResult.score);

      // A normal job advertisement with only a WhatsApp contact must not be
      // escalated to high risk unless there is another concrete scam signal.
      if (isJobPost && !hasStrongJobRisk) {
        semanticScore = Math.min(semanticScore, 29);
      }

      score = Math.max(score, semanticScore);

      if (geminiResult.explanations && Array.isArray(geminiResult.explanations)) {
        geminiResult.explanations
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
              weight: exp.weight || 0
            });
          });
      }
    }
  } catch (err) {
    console.error("Failed to run Gemini analysis, falling back to rule engine", err);
  }


  // 3. COMMUNITY FUSION (Weight: 15% - adds bonus to final score)
  const verifiedReports = metadata.verifiedReportsCount || 0;
  if (verifiedReports > 0) {
    const commBonus = verifiedReports >= 3 ? 15 : 8;
    score += commBonus;
    explanations.push({
      category: "community",
      label: lang === 'ms' ? "Makluman Komuniti Aktif" : "Active Community Alerts",
      text: lang === 'ms' ? `Sepadan dengan ${verifiedReports} laporan yang disahkan oleh moderator warga tempatan.` : `Matches ${verifiedReports} reports confirmed by local citizen moderators.`,
      weight: commBonus
    });
  }

  // Keep score capped between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine risk band
  let riskBand = lang === 'ms' ? "Bukti Rendah" : "Low evidence";
  let bandColor = "low";
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
  } else if (score >= 30) {
    riskBand = lang === 'ms' ? "Awas" : "Caution";
    bandColor = "caution";
    recommendedActions = lang === 'ms' ? [
      "Berhenti seketika sebelum klik. Mesej ini menggunakan taktik tekanan.",
      "Periksa sama ada mesej menggunakan saluran komunikasi tidak rasmi (cth. Gmail dan bukannya domain korporat)."
    ] : [
      "Pause before clicking. The message utilizes pressure tactics.",
      "Check if the message uses unofficial communication channels (e.g. Gmail instead of corporate domain)."
    ];
  }

  // Calculate confidence score based on the amount of evidence provided
  let confidence = lang === 'ms' ? "Rendah" : "Low";
  let evidenceCount = (analysis.urls.length > 0 ? 1 : 0) + 
                      (analysis.phones.length > 0 ? 1 : 0) + 
                      (qrDestination ? 1 : 0) +
                      (verifiedReports > 0 ? 1 : 0) +
                      (matchedBlacklistIndicator ? 1 : 0) +
                      (explanations.length > 0 ? 2 : 0); // Boost confidence if AI or rules found something
  
  if (evidenceCount >= 3) confidence = lang === 'ms' ? "Tinggi" : "High";
  else if (evidenceCount >= 1) confidence = lang === 'ms' ? "Sederhana" : "Medium";

  if (isJobPost && !hasStrongJobRisk && !matchedBlacklistIndicator) {
    confidence = lang === 'ms' ? "Sederhana" : "Medium";
  }

  return {
    score,
    riskBand,
    bandColor,
    confidence,
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
