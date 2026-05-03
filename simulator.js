import { translateText, getCurrentLanguage } from './translate.js';

const candidates = [
    { id: 1, name: "Aarav Sharma", party: "Progressive Alliance", symbol: "🌟" },
    { id: 2, name: "Priya Patel", party: "National Development Party", symbol: "☀️" },
    { id: 3, name: "Vikram Singh", party: "United Citizens Front", symbol: "🕊️" },
    { id: 4, name: "Meera Reddy", party: "Green Future Coalition", symbol: "🌳" },
    { id: 5, name: "Rohan Gupta", party: "Independent", symbol: "⚖️" },
    { id: 6, name: "NOTA", party: "None of the Above", symbol: "❌" }
];

document.addEventListener('DOMContentLoaded', async () => {
    const candidateList = document.getElementById('candidate-list');
    const evmStatus = document.getElementById('evm-status');
    const evmMachine = document.getElementById('evm-machine');
    const confirmationScreen = document.getElementById('vote-confirmation');
    const castVoteBtn = document.getElementById('cast-vote-btn'); 

    const lang = getCurrentLanguage();
    
    if (castVoteBtn) {
        castVoteBtn.style.display = 'block'; 
        castVoteBtn.textContent = await translateText("Cast Vote", lang);
    }
    
    let hasVoted = false;
    let selectedCandidateId = null;

    // Render candidates
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const row = document.createElement('div');
        row.className = 'candidate-row';
        row.dataset.id = candidate.id;

        const translatedParty = await translateText(candidate.party, lang);

        row.innerHTML = `
            <div class="candidate-sno">${i + 1}</div>
            <div class="candidate-info">
                <div class="candidate-name">${candidate.name}</div>
                <div class="candidate-party">${translatedParty}</div>
            </div>
            <div class="candidate-symbol">${candidate.symbol}</div>
            <div class="candidate-btn-wrapper">
                <button class="candidate-btn" data-id="${candidate.id}"></button>
                <div class="candidate-light" id="light-${candidate.id}"></div>
            </div>
        `;
        
        candidateList.appendChild(row);
    }

    // Handle vote casting directly on row/button click
    const candidateRows = document.querySelectorAll('.candidate-row');
    
    candidateRows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (hasVoted) return;
            
            candidateRows.forEach(r => r.classList.remove('selected'));
            document.querySelectorAll('.candidate-light').forEach(l => l.classList.remove('on'));
            
            selectedCandidateId = e.currentTarget.dataset.id;
            e.currentTarget.classList.add('selected');
            
            if (castVoteBtn) {
                castVoteBtn.disabled = false;
            }
        });
    });

    if (castVoteBtn) {
        castVoteBtn.addEventListener('click', async () => {
            if (hasVoted) return;
            if (!selectedCandidateId) {
                const msg = await translateText('Please select a candidate first.', lang);
                alert(msg);
                return;
            }
            
            hasVoted = true;
            
            const light = document.getElementById(`light-${selectedCandidateId}`);
            if (light) light.classList.add('on');
            
            evmStatus.textContent = lang === 'hi' ? 'मतदान हुआ' : 'VOTED';
            evmStatus.style.color = '#ef4444';
            
            evmMachine.classList.add('voting-beep');
            
            setTimeout(() => {
                evmMachine.style.display = 'none';
                confirmationScreen.style.display = 'block';
                confirmationScreen.classList.add('reveal', 'active');
            }, 2000); 
        });
    }
});
