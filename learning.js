import { 
    fetchModules as fetchModulesService, 
    saveModuleProgress, 
    seedModule,
    fetchUserData
} from './firebase-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    const modulesGrid = document.getElementById('modules-grid');
    const modal = document.getElementById('module-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Modal elements
    const currentTitle = document.getElementById('current-title');
    const currentStepLabel = document.getElementById('current-step-label');
    const currentImage = document.getElementById('current-image');
    const currentText = document.getElementById('current-text');
    const modalProgress = document.getElementById('modal-progress');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let currentModule = null;
    let currentStepIndex = 0;
    let modulesData = [];
    let userProgress = {};
    let currentUser = null;

    // Progress logic
    const getProgress = (id) => {
        if (currentUser && userProgress[id] !== undefined) {
            return userProgress[id];
        }
        return localStorage.getItem(`progress_${id}`) || 0;
    };

    const setProgress = async (id, val) => {
        if (currentUser) {
            userProgress[id] = val;
            try {
                await saveModuleProgress(currentUser.uid, userProgress);
            } catch (error) {
                console.error("Error saving progress to Firestore:", error);
            }
        } else {
            localStorage.setItem(`progress_${id}`, val);
        }
    };

    // Fetch Modules from Firestore
    async function fetchModules() {
        try {
            modulesData = await fetchModulesService();
            if (modulesData.length === 0) {
                console.log("No modules found, seeding data...");
                await seedModules();
                modulesData = await fetchModulesService();
            }

            renderModules();
        } catch (error) {
            console.error("Error fetching modules:", error);
            modulesGrid.innerHTML = `<p class="error">Failed to load modules. Please check your Firestore rules.</p>`;
        }
    }

    // Seed initial data if empty
    async function seedModules() {
        const initialModules = [
            {
                title: "How Elections Work",
                description: "Understand the foundational process of Indian democracy, from notification to results.",
                image: "assets/module-elections.png",
                steps: [
                    { text: "Elections in India are conducted by the Election Commission of India (ECI), an autonomous constitutional authority.", image: "assets/module-elections.png" },
                    { text: "The process begins with the President or Governor issuing a notification for the elections.", image: "assets/hero.png" },
                    { text: "Candidates file nominations and the ECI scrutinizes them to ensure eligibility.", image: "assets/module-elections.png" },
                    { text: "Campaigning occurs for a specified period, ending 48 hours before the conclusion of the poll.", image: "assets/hero.png" }
                ]
            },
            {
                title: "How to Vote",
                description: "A step-by-step guide on what to do when you arrive at the polling station.",
                image: "assets/module-vote.png",
                steps: [
                    { text: "Check your name in the voter list online or at the polling station.", image: "assets/module-vote.png" },
                    { text: "Identity verification is done by the first polling officer using your Voter ID or other approved IDs.", image: "assets/module-vote.png" },
                    { text: "The second polling officer marks your finger with indelible ink and takes your signature.", image: "assets/module-vote.png" },
                    { text: "Proceed to the voting compartment and press the button next to your candidate on the EVM.", image: "assets/module-vote.png" }
                ]
            },
            {
                title: "What is EVM & VVPAT",
                description: "Learn about the technology behind Electronic Voting Machines and VVPAT verification.",
                image: "assets/hero.png",
                steps: [
                    { text: "Electronic Voting Machines (EVMs) consist of two units: the Control Unit and the Balloting Unit.", image: "assets/hero.png" },
                    { text: "VVPAT (Voter Verifiable Paper Audit Trail) allows voters to verify that their vote was cast correctly via a paper slip.", image: "assets/hero.png" },
                    { text: "EVMs are stand-alone machines, not connected to any network, making them tamper-proof.", image: "assets/hero.png" }
                ]
            },
            {
                title: "Fake News & Media",
                description: "Identify misinformation and understand the Model Code of Conduct for media.",
                image: "assets/fake-news.png",
                steps: [
                    { text: "Misinformation can spread rapidly during elections. Always verify news from official sources like the ECI website.", image: "assets/fake-news.png" },
                    { text: "The Model Code of Conduct (MCC) sets guidelines for political parties and candidates during the election period.", image: "assets/fake-news.png" },
                    { text: "Social media platforms have a 'Voluntary Code of Ethics' to prevent misuse of their platforms during elections.", image: "assets/fake-news.png" }
                ]
            }
        ];

        for (const mod of initialModules) {
            const modId = mod.title.toLowerCase().replace(/ /g, '-');
            await seedModule(modId, mod);
        }
    }

    function renderModules() {
        modulesGrid.innerHTML = '';
        modulesData.forEach(mod => {
            const progress = parseInt(getProgress(mod.id));
            const card = document.createElement('div');
            card.className = 'module-card reveal active';
            card.innerHTML = `
                <div class="module-img">
                    <img src="${mod.image}" alt="${mod.title}" class="img-backing">
                </div>
                <div class="module-info">
                    <h3>${mod.title}</h3>
                    <p>${mod.description}</p>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="module-footer">
                        <span class="progress-text">${progress}% Completed</span>
                        <button class="btn btn-primary start-btn" data-id="${mod.id}">
                            ${progress > 0 ? (progress === 100 ? 'Review' : 'Continue') : 'Start'}
                        </button>
                    </div>
                </div>
            `;
            modulesGrid.appendChild(card);
        });

        document.querySelectorAll('.start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openModule(id);
            });
        });
    }

    function openModule(id) {
        currentModule = modulesData.find(m => m.id === id);
        currentStepIndex = 0;
        updateModal();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function updateModal() {
        const step = currentModule.steps[currentStepIndex];
        currentTitle.textContent = currentModule.title;
        currentStepLabel.textContent = `Step ${currentStepIndex + 1} of ${currentModule.steps.length}`;
        currentImage.src = step.image;
        currentImage.classList.add('img-backing');
        currentText.textContent = step.text;

        const progress = ((currentStepIndex + 1) / currentModule.steps.length) * 100;
        modalProgress.style.width = `${progress}%`;

        prevBtn.disabled = currentStepIndex === 0;
        nextBtn.textContent = currentStepIndex === currentModule.steps.length - 1 ? 'Finish' : 'Next';

        // Update progress if it's higher than current
        const savedProgress = parseInt(getProgress(currentModule.id));
        if (progress > savedProgress) {
            setProgress(currentModule.id, Math.round(progress));
        }
    }

    nextBtn.addEventListener('click', () => {
        if (currentStepIndex < currentModule.steps.length - 1) {
            currentStepIndex++;
            updateModal();
        } else {
            closeModalFunc();
            renderModules(); // Refresh grid to show new progress
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            updateModal();
        }
    });

    const closeModalFunc = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    closeModal.onclick = closeModalFunc;
    window.onclick = (e) => {
        if (e.target == modal) closeModalFunc();
    };

    // Listen for Auth Changes
    window.addEventListener('authReady', async (e) => {
        currentUser = e.detail;
        if (currentUser) {
            // Fetch progress from Firestore via centralized service
            try {
                const userData = await fetchUserData(currentUser.uid);
                userProgress = userData?.progress || {};
            } catch (error) {
                console.error("Error fetching user progress:", error);
            }
        } else {
            userProgress = {};
        }
        renderModules();
    });

    fetchModules();
});
