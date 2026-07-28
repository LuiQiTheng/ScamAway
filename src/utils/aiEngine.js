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
  Analyze the following message for social engineering, phishing, tax scams, courier scams, or financial fraud indicators.
  Return your analysis strictly as a raw JSON object (no markdown formatting, no \`\`\`json wrappers).
  
  Expected JSON format:
  {
    "score": <number between 50 and 95, where 90+ is a critical scam>,
    "riskBand": "<'Caution' | 'High risk' | 'Critical'>",
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

