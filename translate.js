/**
 * translate.js — Bilingual English/Hindi translation engine for SmartVote India
 * Uses Google Translate API with fallback Hindi dictionary.
 * Translates all elements with the data-translate attribute.
 */

import { CONFIG } from './config.js';

// ─── Fallback Hindi Dictionary ──────────────────────────────────────────────
const HINDI_DICT = {
    // Nav items
    'Home': 'होम',
    'Learn': 'सीखें',
    'Quiz': 'क्विज़',
    'AI Assistant': 'AI सहायक',
    'Simulator': 'सिम्युलेटर',
    'Fake News': 'फर्ज़ी समाचार',
    'Dashboard': 'डैशबोर्ड',
    'Login': 'लॉगिन',
    'Logout': 'लॉगआउट',

    // Homepage
    'Understand Elections.': 'चुनाव समझें।',
    'Vote Smart.': 'स्मार्ट वोट करें।',
    'Learn the election process, verify information, and become a responsible voter in the world\'s largest democracy.': 'चुनाव प्रक्रिया सीखें, जानकारी सत्यापित करें, और दुनिया के सबसे बड़े लोकतंत्र में एक जिम्मेदार मतदाता बनें।',
    'Start Learning': 'सीखना शुरू करें',
    'Try Simulator': 'सिम्युलेटर आज़माएं',
    'Why VoteSmart?': 'VoteSmart क्यों?',
    'Empowering citizens with knowledge and tools for an informed democracy.': 'सूचित लोकतंत्र के लिए नागरिकों को ज्ञान और उपकरणों से सशक्त बनाना।',
    'Interactive Learning': 'इंटरैक्टिव लर्निंग',
    'Engaging modules to understand the complexities of the Indian electoral system easily.': 'भारतीय चुनावी प्रणाली की जटिलताओं को आसानी से समझने के लिए आकर्षक मॉड्यूल।',
    'AI Election Assistant': 'AI चुनाव सहायक',
    'Get instant answers to your questions about candidates, constituencies, and procedures.': 'उम्मीदवारों, निर्वाचन क्षेत्रों और प्रक्रियाओं के बारे में अपने सवालों के तुरंत जवाब पाएं।',
    'Fake News Detection': 'फर्ज़ी समाचार पहचान',
    'Fact-check claims and identify misinformation before it affects your voting decision.': 'दावों की तथ्य-जांच करें और गलत सूचना की पहचान करें इससे पहले कि यह आपके मतदान निर्णय को प्रभावित करे।',
    'How It Works': 'यह कैसे काम करता है',
    'Three simple steps to becoming a smart voter.': 'स्मार्ट मतदाता बनने के तीन आसान कदम।',

    // Dashboard
    'Overall Progress': 'कुल प्रगति',
    'Modules Completed': 'पूर्ण मॉड्यूल',
    'Day Streak': 'दिन की लकीर',
    'Your Rank': 'आपकी रैंक',
    'Election Readiness Score': 'चुनाव तैयारी स्कोर',
    'Your Readiness': 'आपकी तैयारी',
    'Quiz Score': 'क्विज़ स्कोर',
    'Modules Done': 'मॉड्यूल पूर्ण',
    'Readiness': 'तैयारी',
    'Take the Quiz →': 'क्विज़ दें →',

    // Learning
    'Electoral': 'चुनावी',
    'Learning Modules': 'लर्निंग मॉड्यूल',
    'Master the democratic process through our curated interactive modules.': 'हमारे क्यूरेटेड इंटरैक्टिव मॉड्यूल के माध्यम से लोकतांत्रिक प्रक्रिया में महारत हासिल करें।',
};

let currentLang = localStorage.getItem('smartvote-lang') || 'en';
const originalTexts = new Map();

/**
 * Attempts Google Translate API, falls back to dictionary.
 */
async function translateText(text, targetLang) {
    // If going back to English, use stored original
    if (targetLang === 'en') return text;

    // Try dictionary first (fast, no API call)
    if (HINDI_DICT[text]) return HINDI_DICT[text];

    // Try Google Translate API
    try {
        const apiKey = CONFIG.TRANSLATE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_TRANSLATE_API_KEY') {
            return text; // No API key, return original
        }

        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: 'hi',
                format: 'text'
            })
        });

        if (!response.ok) throw new Error('Translation API failed');

        const data = await response.json();
        if (data?.data?.translations?.[0]?.translatedText) {
            return data.data.translations[0].translatedText;
        }
    } catch (err) {
        console.warn('Translation API error, using fallback:', err.message);
    }

    return text; // Fallback: return original
}

/**
 * Translates all elements with data-translate attribute.
 */
async function translatePage(targetLang) {
    const elements = document.querySelectorAll('[data-translate]');

    for (const el of elements) {
        const originalText = el.textContent.trim();

        // Store original English text
        if (!originalTexts.has(el)) {
            originalTexts.set(el, originalText);
        }

        if (targetLang === 'en') {
            // Restore original English
            el.textContent = originalTexts.get(el);
        } else {
            // Translate to Hindi
            const stored = originalTexts.get(el);
            const translated = await translateText(stored, 'hi');
            el.textContent = translated;
        }
    }
}

/**
 * Updates button text and state.
 */
function updateToggleButton(lang) {
    const btn = document.getElementById('lang-toggle-btn');
    if (!btn) return;

    if (lang === 'hi') {
        btn.innerHTML = '🌐 EN';
        btn.title = 'Switch to English';
        btn.classList.add('active-lang');
    } else {
        btn.innerHTML = '🌐 हि';
        btn.title = 'हिंदी में बदलें';
        btn.classList.remove('active-lang');
    }
}

// ─── Initialize ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('lang-toggle-btn');

    // Apply saved language preference
    if (currentLang === 'hi') {
        translatePage('hi');
        updateToggleButton('hi');
    }

    if (btn) {
        btn.addEventListener('click', async () => {
            currentLang = currentLang === 'en' ? 'hi' : 'en';
            localStorage.setItem('smartvote-lang', currentLang);
            updateToggleButton(currentLang);
            await translatePage(currentLang);
        });
    }
});
