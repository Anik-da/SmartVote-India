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
    'Practice': 'अभ्यास',
    'Vote': 'मतदान',
    'Explore our library of interactive content and AI-powered guides.': 'इंटरैक्टिव सामग्री और AI-संचालित गाइडों की हमारी लाइब्रेरी खोजें।',
    'Use our simulator to experience the voting process in a risk-free environment.': 'जोखिम मुक्त वातावरण में मतदान प्रक्रिया का अनुभव करने के लिए हमारे सिम्युलेटर का उपयोग करें।',
    'Head to the polls with confidence and contribute to our nation\'s future.': 'विश्वास के साथ मतदान केंद्रों पर जाएं और हमारे देश के भविष्य में योगदान दें।',
    'Platform': 'प्लेटफ़ॉर्म',
    'Company': 'कंपनी',
    'About': 'हमारे बारे में',
    'Contact': 'संपर्क',
    'Privacy Policy': 'गोपनीयता नीति',
    'Empowering the next generation of voters with technology and transparency.': 'प्रौद्योगिकी और पारदर्शिता के साथ मतदाताओं की अगली पीढ़ी को सशक्त बनाना।',
    '© 2026 VoteSmart India. All rights reserved. Built with pride for democracy.': '© 2026 VoteSmart India. सभी अधिकार सुरक्षित। लोकतंत्र के लिए गर्व के साथ निर्मित।',

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
    'Outstanding! You\'re fully ready to vote smart!': 'शानदार! आप स्मार्ट वोट देने के लिए पूरी तरह तैयार हैं!',
    'Almost there! You\'re becoming an informed voter.': 'बस थोड़ा और! आप एक जागरूक मतदाता बन रहे हैं।',
    'Good progress! Keep learning to boost your score.': 'अच्छी प्रगति! अपना स्कोर बढ़ाने के लिए सीखते रहें।',
    'Start your journey! Take the quiz and complete modules.': 'अपनी यात्रा शुरू करें! क्विज़ लें और मॉड्यूल पूरा करें।',
    'Account Details': 'खाता विवरण',
    'Name': 'नाम',
    'Email': 'ईमेल',
    'Joined': 'शामिल हुए',
    'Recent Activity': 'हाल की गतिविधि',
    'Sign in to access your dashboard and track your learning progress.': 'अपने डैशबोर्ड तक पहुँचने और अपनी सीखने की प्रगति को ट्रैक करने के लिए साइन इन करें।',

    // Learning
    'Electoral': 'चुनावी',
    'Learning Modules': 'लर्निंग मॉड्यूल',
    'Master the democratic process through our curated interactive modules.': 'हमारे क्यूरेटेड इंटरैक्टिव मॉड्यूल के माध्यम से लोकतांत्रिक प्रक्रिया में महारत हासिल करें।',
    'Previous': 'पिछला',
    'Next': 'अगला',

    // Chatbot
    'Election Assistant': 'चुनाव सहायक',
    'Online — Ask me anything about elections': 'ऑनलाइन — चुनाव के बारे में मुझसे कुछ भी पूछें',
    'How to register to vote?': 'वोट देने के लिए पंजीकरण कैसे करें?',
    'What is NOTA?': 'NOTA क्या है?',
    'Documents needed to vote?': 'वोट देने के लिए किन दस्तावेजों की जरूरत है?',
    'How does EVM work?': 'EVM कैसे काम करता है?',
    'Type your question about elections...': 'चुनाव के बारे में अपना प्रश्न टाइप करें...',
    'Powered by Gemini AI • Responses are for educational purposes only': 'Gemini AI द्वारा संचालित • प्रतिक्रियाएं केवल शैक्षिक उद्देश्यों के लिए हैं',
    'How to register and vote': 'पंजीकरण और मतदान कैसे करें',
    'The election process in India': 'भारत में चुनाव प्रक्रिया',
    'EVMs, VVPAT, and NOTA': 'EVM, VVPAT और NOTA',
    'Your rights as a voter': 'एक मतदाता के रूप में आपके अधिकार',
    'Ask me anything!': 'मुझसे कुछ भी पूछें!',

    // Fake News
    'News Verifier': 'समाचार सत्यापनकर्ता',
    'Verify news claims and identify misinformation using AI.': 'AI का उपयोग करके समाचार दावों को सत्यापित करें और गलत सूचना की पहचान करें।',
    'Enter news claim to verify...': 'सत्यापित करने के लिए समाचार दावा दर्ज करें...',
    'Analyze Claim': 'दावे का विश्लेषण करें',
    'Analyzing...': 'विश्लेषण किया जा रहा है...',
    'Analysis Result': 'विश्लेषण परिणाम',
    'Sentiment': 'भावना',
    'Intensity': 'तीव्रता',
    'Verdict': 'निर्णय',
    'Likely Factual': 'संभवतः तथ्यात्मक',
    'Potentially Sensationalized': 'संभावित रूप से सनसनीखेज',
    'High Risk': 'उच्च जोखिम',
    'Check Manually': 'मैन्युअल रूप से जांचें',
    'Positive': 'सकारात्मक',
    'Neutral': 'तटस्थ',
    'Negative': 'नकारात्मक',

    // Quiz
    'Next Question': 'अगला प्रश्न',
    'Checking...': 'जाँच की जा रही है...',
    'Retake Quiz': 'क्विज़ पुनः प्रयास करें',
    'Question': 'प्रश्न',
    'of': 'का',
    'Results': 'परिणाम',
    'Your Score': 'आपका स्कोर',
    'Correct': 'सही',
    'Incorrect': 'गलत',
    'Quiz Complete!': 'क्विज़ पूरा हुआ!',

    // Auth / General
    'Welcome Back': 'वापस स्वागत है',
    'Sign in to your account': 'अपने खाते में साइन इन करें',
    'Email Address': 'ईमेल पता',
    'Password': 'पासवर्ड',
    'Don\'t have an account? Sign up': 'खाता नहीं है? साइन अप करें',
    'Already have an account? Login': 'पहले से ही खाता है? लॉगिन करें',
    'Create Account': 'खाता बनाएं'

};

let currentLang = localStorage.getItem('smartvote-lang') || 'en';
const originalTexts = new Map();
const originalPlaceholders = new Map();

/**
 * Returns the current language code.
 */
export function getCurrentLanguage() {
    return currentLang;
}

/**
 * Attempts Google Translate API, falls back to dictionary.
 */
export async function translateText(text, targetLang) {
    if (!text) return text;
    // If going back to English, use stored original
    if (targetLang === 'en') return text;

    // Try dictionary first (fast, no API call)
    if (HINDI_DICT[text]) return HINDI_DICT[text];

    // Try Google Translate API
    try {
        const apiKey = CONFIG.TRANSLATE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_TRANSLATE_API_KEY' || !apiKey.startsWith('AIza')) {
            return text; // No valid API key
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
export async function translatePage(targetLang) {
    const elements = document.querySelectorAll('[data-translate]');

    for (const el of elements) {
        // 1. Handle Text Content
        const originalText = el.textContent.trim();
        if (originalText && !originalTexts.has(el)) {
            originalTexts.set(el, originalText);
        }

        if (targetLang === 'en') {
            if (originalTexts.has(el)) el.textContent = originalTexts.get(el);
        } else {
            const stored = originalTexts.get(el);
            if (stored) {
                const translated = await translateText(stored, 'hi');
                el.textContent = translated;
            }
        }

        // 2. Handle Placeholder (if input/textarea)
        if (el.placeholder) {
            if (!originalPlaceholders.has(el)) {
                originalPlaceholders.set(el, el.placeholder);
            }

            if (targetLang === 'en') {
                el.placeholder = originalPlaceholders.get(el);
            } else {
                const stored = originalPlaceholders.get(el);
                const translated = await translateText(stored, 'hi');
                el.placeholder = translated;
            }
        }
    }

    // Special case for elements that might be inputs but don't have textContent
    const placeholders = document.querySelectorAll('input[data-translate], textarea[data-translate]');
    for (const el of placeholders) {
        if (!originalPlaceholders.has(el)) {
            originalPlaceholders.set(el, el.placeholder);
        }
        if (targetLang === 'en') {
            el.placeholder = originalPlaceholders.get(el);
        } else {
            const stored = originalPlaceholders.get(el);
            const translated = await translateText(stored, 'hi');
            el.placeholder = translated;
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
            
            // Dispatch event for other scripts (e.g. chatbot)
            window.dispatchEvent(new CustomEvent('langChanged', { detail: currentLang }));
        });
    }
});

