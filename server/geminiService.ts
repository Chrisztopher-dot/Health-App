import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export class GeminiBackendService {
  public static isConfigured(): boolean {
    return !!genAI && !!apiKey;
  }

  /**
   * Analyze food image or video frame with Google Gemini Vision AI
   */
  public static async analyzeFood(
    imageDataBase64: string,
    mimeType: string = 'image/jpeg',
    hint?: string,
    profileContext?: { age?: number; hasHypertension?: boolean }
  ) {
    if (!genAI) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }

    // Clean base64 header if present (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = imageDataBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/^data:video\/[a-zA-Z0-9+.-]+;base64,/, '');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const prompt = `You are a clinical geriatric dietitian and nutritionist AI assistant.
Analyze this meal photo/video frame.
User context: Senior citizen (${profileContext?.age || 75} years old), focusing on cardiovascular health, hypertension management, and stable blood sugar.

Return a strictly valid JSON object matching this exact schema:
{
  "name": "Standard Dish Name (e.g., Grilled Salmon with Roasted Asparagus & Quinoa)",
  "detectedCategory": "protein | grain | salad | soup | pasta | dessert | beverage | mixed",
  "baseServingDescription": "Portion description (e.g., 1 plate with 6oz salmon fillet, 1 cup quinoa, 6 asparagus spears)",
  "calories": 480,
  "carbsGrams": 38,
  "fiberGrams": 7,
  "proteinGrams": 42,
  "fatGrams": 18,
  "saturatedFatGrams": 3.5,
  "sodiumMg": 420,
  "potassiumMg": 780,
  "glycemicLoad": "low | medium | high",
  "confidenceScore": 94,
  "emoji": "🐟",
  "ingredients": [
    {
      "name": "Salmon Fillet",
      "category": "protein",
      "estimatedAmount": "180g",
      "isHealthyHighlight": true
    },
    {
      "name": "Quinoa",
      "category": "carb",
      "estimatedAmount": "120g",
      "isHealthyHighlight": true
    },
    {
      "name": "Asparagus",
      "category": "vegetable",
      "estimatedAmount": "90g",
      "isHealthyHighlight": true
    }
  ],
  "bloodPressureAssessment": {
    "status": "safe | caution | high_risk",
    "sodiumLevelDescription": "Moderate sodium (420mg)",
    "details": "Clinical advisory for blood pressure regarding sodium, potassium balance, and hydration"
  },
  "bloodSugarAssessment": {
    "status": "good | moderate | watch_out",
    "details": "Clinical advisory for glycemic impact and fiber buffer"
  },
  "diningOutSmartTips": [
    "Practical actionable senior tip for eating this dish at a restaurant or social gathering",
    "Another practical tip"
  ]
}

${hint ? `User context/filename hint: ${hint}` : ''}`;

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType.startsWith('video/') ? 'image/jpeg' : mimeType,
      },
    };

    const response = await model.generateContent([prompt, imagePart]);
    const textResponse = response.response.text();
    return JSON.parse(textResponse);
  }

  /**
   * Conversational Health Check-In assistant response
   */
  public static async generateCheckInResponse(
    messages: { sender: 'ai' | 'user'; text: string }[],
    userMessage: string,
    profileContext?: any
  ) {
    if (!genAI) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const conversationHistory = messages.map((m) => `${m.sender === 'user' ? 'Senior User' : 'Health Companion AI'}: ${m.text}`).join('\n');

    const prompt = `You are a warm, gentle, empathetic AI health companion for a senior citizen named ${profileContext?.name || 'Friend'}.
You are conducting a quick morning health check-in.
The conversation history so far:
${conversationHistory}

Latest message from senior: "${userMessage}"

Respond in 1 to 3 comforting, clear, spoken-friendly sentences.
Ask gently about any missing check-in details (mood, energy 1-10, sleep 1-10, blood pressure numbers if measured, medications taken, or symptoms).
If they shared their health status, acknowledge it with warmth and praise them for keeping track.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Answer retrospective health queries
   */
  public static async answerHealthHistoryQuery(
    question: string,
    recordsSummary: any[],
    profileContext?: any
  ) {
    if (!genAI) {
      throw new Error('GEMINI_API_KEY is not configured in server environment.');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 400,
      },
    });

    const prompt = `You are a senior-focused clinical analytics assistant.
User Profile: ${profileContext?.name || 'Senior'}, target blood pressure: max ${profileContext?.targetSystolicMax || 130}/${profileContext?.targetDiastolicMax || 85} mmHg.
Past Health History Records:
${JSON.stringify(recordsSummary.slice(-30), null, 2)}

Question: "${question}"

Provide a clear, comforting, and direct 2-3 sentence summary answer based on their actual logged check-in data. Highlight dates and blood pressure trends if applicable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
