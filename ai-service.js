
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
 * Sends a message to Gemini and returns the AI response.
 * @param {string} userMessage - The message from the user.
 * @param {string} systemPrompt - The system instruction for the AI.
 * @param {Array} history - Previous conversation history.
 * @returns {Promise<string>} - The AI response text.
 */
export async function sendMessageToGemini(userMessage, systemPrompt, history = []) {
    try {
        const ai = getClient();
        
        // Format history for the new SDK
        // The SDK expects { role: 'user'|'model', parts: [{ text: '...' }] }
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I will act as the Election Assistant for SmartVote India.' }]
            },
            ...history.slice(-10),
            {
                role: 'user',
                parts: [{ text: userMessage }]
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
        
        if (error.message.includes('403') || error.message.includes('leaked')) {
            throw new Error("API Key Error: Your key may be blocked or leaked. Please update config.js with a new key.");
        }
        
        throw error;
    }
}

/**
 * Analyzes a news article or claim using Gemini.
 * @param {string} text - The news text to analyze.
 * @returns {Promise<Object>} - Analysis results.
 */
export async function analyzeNews(text) {
    const prompt = `Analyze the following news article or claim for sentiment, emotional intensity (magnitude), and potential sensationalism/bias.
    
    Text: "${text}"
    
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
            description: "The AI analysis encountered an error. Please evaluate the content carefully based on its sources."
        };
    }
}
