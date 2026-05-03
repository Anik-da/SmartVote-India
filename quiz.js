import { saveQuizScore, fetchQuizQuestions, seedCollectionIfEmpty } from './firebase-service.js';

const DEFAULT_QUESTIONS = [
    {
        question: "What is the minimum age to vote in Indian elections?",
        options: ["16 years", "18 years", "21 years", "25 years"],
        correctIndex: 1
    },
    {
        question: "What does EVM stand for?",
        options: ["Electoral Voting Machine", "Electronic Voting Machine", "Election Validation Method", "Electronic Voter Matrix"],
        correctIndex: 1
    },
    {
        question: "Which button on the EVM indicates 'None of the Above'?",
        options: ["NOTA", "VVPAT", "REJECT", "CANCEL"],
        correctIndex: 0
    },
    {
        question: "Who is responsible for conducting free and fair elections in India?",
        options: ["The Supreme Court", "The Parliament", "Election Commission of India", "The President"],
        correctIndex: 2
    },
    {
        question: "What is a VVPAT?",
        options: ["A voter ID card", "A paper slip verifying your vote", "A type of EVM", "An election official"],
        correctIndex: 1
    }
];

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedOptionIndex = null;

    // DOM Elements
    const views = {
        loading: document.getElementById('quiz-loading'),
        error: document.getElementById('quiz-error'),
        active: document.getElementById('quiz-active'),
        results: document.getElementById('quiz-results')
    };

    const ui = {
        questionText: document.getElementById('quiz-question'),
        optionsContainer: document.getElementById('quiz-options'),
        nextBtn: document.getElementById('quiz-next-btn'),
        progressFill: document.getElementById('quiz-progress-fill'),
        counter: document.getElementById('quiz-counter'),
        finalScore: document.getElementById('final-score'),
        totalQuestions: document.getElementById('total-questions'),
        retakeBtn: document.getElementById('retake-btn'),
        authPrompt: document.getElementById('auth-prompt'),
        resultsLoginBtn: document.getElementById('results-login-btn')
    };

    // Hamburger Menu Logic (Global)
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

    // Auth State Listener
    window.addEventListener('authReady', (e) => {
        currentUser = e.detail;
        if (currentUser) {
            ui.authPrompt.style.display = 'none';
        }
    });

    if (ui.resultsLoginBtn) {
        ui.resultsLoginBtn.addEventListener('click', () => {
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) loginBtn.click();
        });
    }

    // Initialize Quiz
    async function initQuiz() {
        showView('loading');
        try {
            // Seed default questions if the collection is empty
            await seedCollectionIfEmpty('quiz_questions', DEFAULT_QUESTIONS);
            questions = await fetchQuizQuestions();
            
            if (questions.length === 0) throw new Error("No questions available");

            startQuiz();
        } catch (error) {
            console.warn("Failed to initialize quiz from Firestore, falling back to default questions:", error);
            questions = [...DEFAULT_QUESTIONS];
            startQuiz();
        }
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        // Randomize questions for fun
        questions.sort(() => Math.random() - 0.5);
        
        showView('active');
        renderQuestion();
    }

    function renderQuestion() {
        selectedOptionIndex = null;
        ui.nextBtn.disabled = true;
        ui.nextBtn.textContent = "Next Question";
        
        const q = questions[currentQuestionIndex];
        
        // Update Progress
        const percent = (currentQuestionIndex / questions.length) * 100;
        ui.progressFill.style.width = `${percent}%`;
        ui.counter.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

        // Render Question & Options
        ui.questionText.textContent = q.question;
        ui.optionsContainer.innerHTML = '';

        q.options.forEach((optText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = optText;
            btn.addEventListener('click', () => handleOptionClick(btn, index));
            ui.optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(btn, index) {
        // If already selected and checking, do nothing
        if (ui.nextBtn.textContent === "Checking...") return;
        
        // Remove 'selected' from all
        document.querySelectorAll('.option-btn').forEach(el => el.classList.remove('selected'));
        
        // Select this one
        btn.classList.add('selected');
        selectedOptionIndex = index;
        ui.nextBtn.disabled = false;
    }

    async function handleNextClick() {
        if (selectedOptionIndex === null) return;
        
        const q = questions[currentQuestionIndex];
        const options = document.querySelectorAll('.option-btn');
        const selectedBtn = options[selectedOptionIndex];
        
        // Temporarily disable buttons to show correct/incorrect
        ui.nextBtn.disabled = true;
        ui.nextBtn.textContent = "Checking...";
        options.forEach(btn => btn.style.pointerEvents = 'none');

        // Reveal logic
        if (selectedOptionIndex === q.correctIndex) {
            selectedBtn.classList.add('correct');
            score++;
        } else {
            selectedBtn.classList.add('incorrect');
            options[q.correctIndex].classList.add('correct');
        }

        // Wait a moment then proceed
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                renderQuestion();
            } else {
                finishQuiz();
            }
        }, 1500);
    }

    async function finishQuiz() {
        ui.progressFill.style.width = `100%`;
        
        ui.finalScore.textContent = score;
        ui.totalQuestions.textContent = questions.length;
        
        if (!currentUser) {
            ui.authPrompt.style.display = 'block';
        } else {
            ui.authPrompt.style.display = 'none';
            await saveScoreToFirebase();
        }

        showView('results');
    }

    async function saveScoreToFirebase() {
        if (!currentUser) return;
        try {
            await saveQuizScore(currentUser.uid, score, questions.length);
        } catch (error) {
            console.error("Failed to save score:", error);
        }
    }

    function showView(viewName) {
        Object.values(views).forEach(v => {
            if (v) v.style.display = 'none';
        });
        if (views[viewName]) {
            views[viewName].style.display = 'block';
        }
    }

    // Event Listeners
    ui.nextBtn.addEventListener('click', handleNextClick);
    ui.retakeBtn.addEventListener('click', () => {
        startQuiz();
    });

    // Start
    initQuiz();
});
