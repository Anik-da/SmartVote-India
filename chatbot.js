import { sendMessageToGemini, validateInput } from './ai-service.js';
import { getCurrentLanguage } from './translate.js';

const SYSTEM_PROMPT = `You are "Election Assistant", an AI-powered chatbot for SmartVote India — an electoral education platform. Your role is to help Indian citizens understand elections, voting procedures, and democratic rights.

Rules:
- Keep answers concise, informative, and friendly.
- Focus on Indian elections (Lok Sabha, Rajya Sabha, State Assemblies, Local Bodies).
- Explain concepts like EVM, VVPAT, NOTA, voter registration, and election procedures.
- Use simple language. Add relevant emojis occasionally.
- If asked about something unrelated to elections or democracy, politely redirect the user.
- Never provide personal opinions on political parties or candidates.
- Format responses with bullet points or numbered lists when appropriate.
- Keep responses under 200 words unless the topic requires more detail.`;

const MAX_INPUT_LENGTH = 300;

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatStatus = document.getElementById('chat-status');
    const suggestedQuestions = document.getElementById('suggested-questions');

    let conversationHistory = [];

    // ─── Character Counter ──────────────────────────────────────────
    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    charCounter.id = 'char-counter';
    charCounter.textContent = `0 / ${MAX_INPUT_LENGTH}`;
    chatInput.parentNode.insertBefore(charCounter, chatInput.nextSibling);

    chatInput.addEventListener('input', () => {
        const len = chatInput.value.length;
        charCounter.textContent = `${len} / ${MAX_INPUT_LENGTH}`;
        if (len > MAX_INPUT_LENGTH) {
            charCounter.classList.add('over-limit');
            sendBtn.disabled = true;
        } else {
            charCounter.classList.remove('over-limit');
            sendBtn.disabled = false;
        }
    });

    // Set maxlength attribute as a hard stop
    chatInput.setAttribute('maxlength', MAX_INPUT_LENGTH + 10); // slight buffer for paste

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const spans = hamburger.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Send message
    function sendMessage() {
        const text = chatInput.value.trim();
        
        // Input validation
        const validation = validateInput(text, MAX_INPUT_LENGTH);
        if (!validation.valid) {
            showInlineAlert(validation.error, 'warning');
            return;
        }

        // Hide suggestions after first message
        if (suggestedQuestions) {
            suggestedQuestions.style.display = 'none';
        }

        appendMessage(text, 'user');
        chatInput.value = '';
        charCounter.textContent = `0 / ${MAX_INPUT_LENGTH}`;
        chatInput.focus();

        // Show typing indicator
        const typingEl = showTypingIndicator();
        chatStatus.textContent = 'Typing...';

        // Call Gemini API via service
        sendMessageToGemini(text, SYSTEM_PROMPT, conversationHistory, getCurrentLanguage()).then(response => {
            removeTypingIndicator(typingEl);
            appendMessage(response, 'bot');
            chatStatus.textContent = 'Online — Ask me anything about elections';
        }).catch(error => {
            removeTypingIndicator(typingEl);
            // Show styled error alert instead of generic message
            showInlineAlert(error.message || 'An unexpected error occurred.', 'error');
            appendMessage('Sorry, I encountered an error. Please try again. 🙏', 'bot');
            chatStatus.textContent = 'Online — Ask me anything about elections';
            console.error('Gemini API Error:', error);
        });
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.dataset.q;
            sendMessage();
        });
    });

    // ─── Inline Alert ───────────────────────────────────────────────
    function showInlineAlert(message, type = 'error') {
        // Remove existing alerts
        const existing = document.querySelector('.inline-alert');
        if (existing) existing.remove();

        const alert = document.createElement('div');
        alert.className = `inline-alert inline-alert-${type}`;
        alert.innerHTML = `
            <span class="inline-alert-icon">${type === 'error' ? '⚠️' : '💡'}</span>
            <span class="inline-alert-text">${escapeHTML(message)}</span>
            <button class="inline-alert-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Insert before the chat input area
        const inputArea = chatInput.closest('.chat-input-area') || chatInput.parentNode;
        inputArea.parentNode.insertBefore(alert, inputArea);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 5000);
    }

    // Append message to chat
    function appendMessage(text, sender) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;

        if (sender === 'bot') {
            msgDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">${formatBotMessage(text)}</div>
                <span class="message-time">${timeStr}</span>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="message-bubble">${escapeHTML(text)}</div>
                <span class="message-time">${timeStr}</span>
            `;
        }

        chatMessages.appendChild(msgDiv);
        msgDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // Track conversation
        conversationHistory.push({
            role: sender === 'user' ? 'user' : 'model',
            parts: [{ text: text }]
        });
    }

    // Format bot message (basic markdown-like parsing)
    function formatBotMessage(text) {
        // Escape HTML first
        let formatted = escapeHTML(text);

        // Bold: **text**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Bullet points: lines starting with - or *
        formatted = formatted.replace(/^[\-\*]\s+(.+)/gm, '<li>$1</li>');
        // Wrap consecutive <li> in <ul>
        formatted = formatted.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

        // Numbered lists: lines starting with 1. 2. etc
        formatted = formatted.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        // Clean up double <br> after lists
        formatted = formatted.replace(/<\/ul><br>/g, '</ul>');
        formatted = formatted.replace(/<\/li><br>/g, '</li>');

        return formatted;
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator-msg';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-bubble typing-bubble">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        typingDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return typingDiv;
    }

    function removeTypingIndicator(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }
});
