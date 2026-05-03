
import { GoogleGenAI } from 'https://esm.sh/@google/genai';
import { CONFIG } from './config.js';

// Initialize the Google Gen AI Client
let client = null;

function getClient() {
    if (!client) {
        if (CONFIG.GEMINI_API_KEY === 'REPLACE_WITH_YOUR_NEW_API_KEY') {
            throw new Error("Missing API Key: Please add your new Gemini API key in config.js");
        }
        client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    }
    return client;
}

/**
 * Validates and sanitizes user input before sending to API.
 * @param {string} text - The raw user input.
 * @param {number} maxLength - Maximum allowed characters.
 * @returns {{ valid: boolean, sanitized: string, error: string|null }}
 */
export function validateInput(text, maxLength = 300) {
    if (!text || text.trim().length === 0) {
        return { valid: false, sanitized: '', error: 'Input cannot be empty.' };
    }
    const sanitized = text.trim();
    if (sanitized.length > maxLength) {
        return { valid: false, sanitized: '', error: `Input exceeds ${maxLength} character limit. Currently: ${sanitized.length} characters.` };
    }
    return { valid: true, sanitized, error: null };
}

/**
 * Classifies API errors into user-friendly categories.
 * @param {Error} error - The original error.
 * @returns {string} - User-friendly error message.
 */
function classifyError(error) {
    const msg = error.message || '';
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        return 'API Key Error: Your key may be blocked or invalid. Please check config.js.';
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        return 'Rate limit reached. Please wait a moment and try again.';
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        return 'AI model not found. The model may have been deprecated. Please update config.js.';
    }
    if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) {
        return 'Invalid request. Please try rephrasing your message.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    return 'Sorry, an unexpected error occurred. Please try again. 🙏';
}

/**
 * Sends a message to Gemini and returns the AI response.
 * @param {string} userMessage - The message from the user.
 * @param {string} systemPrompt - The system instruction for the AI.
 * @param {Array} history - Previous conversation history.
 * @param {string} language - The target language ('en' or 'hi').
 * @returns {Promise<string>} - The AI response text.
 */
export async function sendMessageToGemini(userMessage, systemPrompt, history = [], language = 'en') {
    // Validate input before sending
    const validation = validateInput(userMessage);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    try {
        const ai = getClient();
        
        const langInstruction = language === 'hi' 
            ? "\nCRITICAL: You MUST respond in Hindi (हिन्दी) only. Do not use English for the body of the response." 
            : "\nCRITICAL: You MUST respond in English only.";

        // Format history for the new SDK
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt + langInstruction }]
            },
            {
                role: 'model',
                parts: [{ text: language === 'hi' ? 'समझ गया। मैं स्मार्टवोट इंडिया के लिए चुनाव सहायक के रूप में कार्य करूँगा।' : 'Understood. I will act as the Election Assistant for SmartVote India.' }]
            },
            ...history.slice(-10),
            {
                role: 'user',
                parts: [{ text: validation.sanitized }]
            }
        ];

        const response = await ai.models.generateContent({
            model: CONFIG.GEMINI_MODEL,
            contents: contents,
            config: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 800
            }
        });

        if (response && response.text) {
            return response.text;
        }

        throw new Error('Unexpected API response structure');
    } catch (error) {
        console.error("AI Service Error:", error);
        
        // Re-throw with user-friendly message
        const friendlyMessage = classifyError(error);
        const enhancedError = new Error(friendlyMessage);
        enhancedError.originalError = error;
        throw enhancedError;
    }
}

/**
 * Analyzes a news article or claim using Gemini.
 * @param {string} text - The news text to analyze.
 * @param {string} language - The target language ('en' or 'hi').
 * @returns {Promise<Object>} - Analysis results.
 */
export async function analyzeNews(text, language = 'en') {
    // Validate input
    const validation = validateInput(text, 500); // Slightly higher limit for news
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const langInstruction = language === 'hi' 
        ? " IMPORTANT: You MUST provide the 'description' in Hindi (हिन्दी). The 'verdict' MUST remain in English (one of: Likely Factual, Potentially Sensationalized, High Risk)." 
        : "";

    const prompt = `Analyze the following news article or claim for sentiment, emotional intensity (magnitude), and potential sensationalism/bias.
    
    Text: "${validation.sanitized}"
    
    ${langInstruction}
    
    You MUST return ONLY a valid JSON object with these exact fields, no other text:
    {
      "sentiment": <number between -1 and 1>,
      "magnitude": <number between 0 and 5>,
      "isSensational": <true or false>,
      "verdict": "<one of: Likely Factual, Potentially Sensationalized, High Risk>",
      "description": "<2-3 sentence explanation>"
    }`;

    try {
        const ai = getClient();
        
        const response = await ai.models.generateContent({
            model: CONFIG.GEMINI_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.1,
                topP: 0.95,
                maxOutputTokens: 1000,
                responseMimeType: "application/json"
            }
        });

        if (response && response.text) {
            return JSON.parse(response.text);
        }
        
        throw new Error('Unexpected API response');
    } catch (error) {
        console.error("AI Service: analyzeNews Error", error);
        return {
            sentiment: 0,
            magnitude: 0,
            isSensational: false,
            verdict: "Check Manually",
            description: classifyError(error)
        };
    }
}
