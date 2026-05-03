const candidates = [
    { id: 1, name: "Aarav Sharma", party: "Progressive Alliance", symbol: "🌟" },
    { id: 2, name: "Priya Patel", party: "National Development Party", symbol: "☀️" },
    { id: 3, name: "Vikram Singh", party: "United Citizens Front", symbol: "🕊️" },
    { id: 4, name: "Meera Reddy", party: "Green Future Coalition", symbol: "🌳" },
    { id: 5, name: "Rohan Gupta", party: "Independent", symbol: "⚖️" },
    { id: 6, name: "NOTA", party: "None of the Above", symbol: "❌" }
];

document.addEventListener('DOMContentLoaded', () => {
    const candidateList = document.getElementById('candidate-list');
    const evmStatus = document.getElementById('evm-status');
    const evmMachine = document.getElementById('evm-machine');
    const confirmationScreen = document.getElementById('vote-confirmation');
    const castVoteBtn = document.getElementById('cast-vote-btn'); // keep reference if it exists in HTML to hide it

    if (castVoteBtn) {
        castVoteBtn.style.display = 'block'; 
    }
    
    let hasVoted = false;
    let selectedCandidateId = null;

    // Render candidates
    candidates.forEach((candidate, index) => {
        const row = document.createElement('div');
        row.className = 'candidate-row';
        row.dataset.id = candidate.id;

        row.innerHTML = `
            <div class="candidate-sno">${index + 1}</div>
            <div class="candidate-info">
                <div class="candidate-name">${candidate.name}</div>
                <div class="candidate-party">${candidate.party}</div>
            </div>
            <div class="candidate-symbol">${candidate.symbol}</div>
            <div class="candidate-btn-wrapper">
                <button class="candidate-btn" data-id="${candidate.id}"></button>
                <div class="candidate-light" id="light-${candidate.id}"></div>
            </div>
        `;
        
        candidateList.appendChild(row);
    });

    // Handle vote casting directly on row/button click
    const candidateRows = document.querySelectorAll('.candidate-row');
    
    candidateRows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (hasVoted) return;
            
            // Remove selected class from all
            candidateRows.forEach(r => r.classList.remove('selected'));
            // Remove 'on' class from all lights
            document.querySelectorAll('.candidate-light').forEach(l => l.classList.remove('on'));
            
            selectedCandidateId = e.currentTarget.dataset.id;
            e.currentTarget.classList.add('selected');
            
            if (castVoteBtn) {
                castVoteBtn.disabled = false;
            }
        });
    });

    if (castVoteBtn) {
        castVoteBtn.addEventListener('click', () => {
            if (hasVoted) return;
            if (!selectedCandidateId) {
                alert('Please select a candidate first.');
                return;
            }
            
            hasVoted = true;
            
            // Turn on current light
            const light = document.getElementById(`light-${selectedCandidateId}`);
            if (light) light.classList.add('on');
            
            evmStatus.textContent = 'VOTED';
            evmStatus.style.color = '#ef4444';
            
            // Simulate Beep Sound
            evmMachine.classList.add('voting-beep');
            
            // Wait for beep to finish, then show confirmation
            setTimeout(() => {
                evmMachine.style.display = 'none';
                confirmationScreen.style.display = 'block';
                confirmationScreen.classList.add('reveal', 'active');
            }, 2000); // 2 seconds for beep and light
        });
    }
});
