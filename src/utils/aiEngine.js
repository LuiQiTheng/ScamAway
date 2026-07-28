import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeTextWithGemini(text, contextLang = 'en') {
  if (!apiKey || apiKey.includes("YOUR_") || apiKey.length < 10) {
    console.warn("⚠️ [Gemini AI] API key is missing or invalid in .env (VITE_GEMINI_API_KEY). Skipping AI analysis.");
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
  You are an expert cybersecurity and anti-fraud analyst for ScamShield AI.
  Analyze the following message for social engineering, phishing, job scams, tax scams, courier scams, or financial fraud indicators.
  Judge the meaning and context of the full message, not isolated keywords.

  Context rules:
  - "Urgent Hiring" used as a job-post title is not urgency pressure by itself.
  - Only classify urgency when the recipient is instructed to act within a deadline
    or threatened with a negative consequence for delaying.
  - A wa.me or WhatsApp link is a contact method, not proof of phishing. Explain
    that the recruiter still needs independent verification when no official
    company source is supplied.
  - A normal job advertisement should remain low risk or "Needs verification"
    unless there are concrete warning signs such as an advance fee, deposit,
    guaranteed high income for simple tasks, requests for OTP/banking credentials,
    impersonation, a malicious domain, or pressure to transfer money.
  - Do not claim that a phone number is unregistered unless a trusted reputation
    source explicitly confirms that fact.
  - If authenticity cannot be confirmed, say "unverified"; never say "safe" or
    "scam" without supporting evidence.

  Return your analysis strictly as a raw JSON object (no markdown formatting, no \`\`\`json wrappers).
  
  Expected JSON format:
  {
    "score": <number between 0 and 95, where 0-19 is low evidence, 20-39 needs verification, 40-59 caution, 60-79 high risk, and 80+ critical>,
    "riskBand": "<'Low evidence' | 'Needs verification' | 'Caution' | 'High risk' | 'Critical'>",
    "explanations": [
      {
        "category": "<'phishing' | 'impersonation' | 'urgency' | 'payment' | 'other'>",
        "label": "<short title in ${contextLang === 'ms' ? 'Malay' : 'English'}>",
        "text": "<explanation of the tactic used in ${contextLang === 'ms' ? 'Malay' : 'English'}>",
        "weight": 25
      }
    ]
  }

  Message to analyze:
  """
  ${text}
  """
  `;

  // Attempt models in sequence
  const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 [Gemini AI] Calling model ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let textResponse = response.text();
      
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResponse);
      console.log("✅ [Gemini AI] Response successfully parsed:", parsedData);
      return parsedData;
    } catch (error) {
      console.warn(`⚠️ [Gemini AI] Model ${modelName} call failed:`, error?.message || error);
    }
  }

  return null;
}

