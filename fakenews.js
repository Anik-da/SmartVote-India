import { analyzeNews } from './ai-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');
    const newsInput = document.getElementById('news-input');
    const resultCard = document.getElementById('result-card');
    const loadingIndicator = document.getElementById('loading-indicator');

    const sentimentValue = document.getElementById('sentiment-value');
    const sentimentDesc = document.getElementById('sentiment-desc');
    const magnitudeValue = document.getElementById('magnitude-value');
    const magnitudeDesc = document.getElementById('magnitude-desc');
    const fakeIndicator = document.getElementById('fake-indicator');
    const fakeDesc = document.getElementById('fake-desc');
    const fakeRealBox = document.getElementById('fake-real-box');

    analyzeBtn.addEventListener('click', async () => {
        const text = newsInput.value.trim();
        if (!text) {
            alert("Please enter some text to analyze.");
            return;
        }

        // Show loading state
        analyzeBtn.style.display = 'none';
        loadingIndicator.style.display = 'flex';
        resultCard.style.display = 'none';

        try {
            // Call Gemini AI for analysis
            const data = await analyzeNews(text);

            displayResults(data);

        } catch (error) {
            console.error("Error analyzing text:", error);
            alert("An error occurred during analysis. Please try again.");
        } finally {
            // Restore UI state
            loadingIndicator.style.display = 'none';
            analyzeBtn.style.display = 'block';
        }
    });

    resetBtn.addEventListener('click', () => {
        newsInput.value = '';
        resultCard.style.display = 'none';
        newsInput.focus();
    });

    function displayResults(data) {
        const { sentiment, magnitude, isSensational, verdict, description } = data;

        // Sentiment Parsing
        let sentimentStr = "Neutral";
        let sentimentColor = "#666";
        if (sentiment > 0.25) {
            sentimentStr = "Positive";
            sentimentColor = "#27ae60";
        } else if (sentiment < -0.25) {
            sentimentStr = "Negative";
            sentimentColor = "#e74c3c";
        }

        sentimentValue.textContent = `${sentiment.toFixed(2)} (${sentimentStr})`;
        sentimentValue.style.color = sentimentColor;
        sentimentDesc.textContent = "Tone of the text detected by AI.";

        // Magnitude Parsing
        magnitudeValue.textContent = magnitude.toFixed(1);
        magnitudeDesc.textContent = "Emotional intensity (0-5 scale).";

        // Verdict Parsing
        let verdictColor = "#27ae60";
        if (verdict.toLowerCase().includes("risk") || verdict.toLowerCase().includes("fake")) {
            verdictColor = "#e74c3c";
        } else if (isSensational || verdict.toLowerCase().includes("sensational")) {
            verdictColor = "#f39c12";
        }

        fakeIndicator.textContent = verdict;
        fakeIndicator.style.color = verdictColor;
        fakeDesc.textContent = description;
        fakeRealBox.style.borderLeft = `6px solid ${verdictColor}`;

        // Show result with animation
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
