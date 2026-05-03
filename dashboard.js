import { fetchModules, fetchUserData } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const dashMain = document.getElementById('dashboard-main');
    const dashLoading = document.getElementById('dashboard-loading');
    const dashAuthGate = document.getElementById('dashboard-auth-gate');
    const gateLoginBtn = document.getElementById('gate-login-btn');

    // Auth gate login button opens the auth modal
    if (gateLoginBtn) {
        gateLoginBtn.addEventListener('click', () => {
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) loginBtn.click();
        });
    }

    // Hamburger menu (reuse logic from main.js)
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

    // Listen for auth state
    window.addEventListener('authReady', async (e) => {
        const user = e.detail;

        if (!user) {
            // Not logged in — show auth gate
            dashLoading.style.display = 'none';
            dashMain.style.display = 'none';
            dashAuthGate.style.display = 'flex';
            return;
        }

        // User is logged in — fetch data and render
        dashAuthGate.style.display = 'none';
        dashLoading.style.display = 'flex';

        try {
            // Fetch user progress from Firestore via centralized service
            const userData = await fetchUserData(user.uid);
            const userProgress = userData?.progress || {};

            // Fetch all modules for label display via centralized service
            const modulesData = await fetchModules();

            renderDashboard(user, userProgress, modulesData, userData || {});
        } catch (error) {
            console.error("Dashboard error:", error);
            dashLoading.style.display = 'none';
            dashMain.style.display = 'block';
            document.getElementById('dash-name').textContent = user.displayName || 'Voter';
            document.getElementById('dash-email').textContent = user.phoneNumber || '';
        }
    });

    function renderDashboard(user, progress, modules, userData) {
        dashLoading.style.display = 'none';
        dashMain.style.display = 'block';

        // Profile
        const nameEl = document.getElementById('dash-name');
        const emailEl = document.getElementById('dash-email');
        const email2El = document.getElementById('dash-email-2');
        const avatarEl = document.getElementById('dash-avatar');
        const badgeEl = document.getElementById('dash-badge');
        const joinedEl = document.getElementById('dash-joined');

        const displayName = user.displayName || 'Voter';
        nameEl.textContent = displayName;
        emailEl.textContent = user.phoneNumber || '';
        email2El.textContent = user.phoneNumber || '';
        avatarEl.textContent = displayName.charAt(0).toUpperCase();

        // Joined date
        if (userData.createdAt) {
            const d = new Date(userData.createdAt);
            joinedEl.textContent = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        } else if (user.metadata && user.metadata.creationTime) {
            const d = new Date(user.metadata.creationTime);
            joinedEl.textContent = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Calculate stats
        const totalModules = modules.length;
        let completedCount = 0;
        let totalProgress = 0;

        modules.forEach(mod => {
            const p = parseInt(progress[mod.id] || 0);
            totalProgress += p;
            if (p === 100) completedCount++;
        });

        const overallPercent = totalModules > 0 ? Math.round(totalProgress / totalModules) : 0;

        // Badge logic
        let badge = '🌱 Beginner';
        if (overallPercent >= 80) badge = '🏅 Expert Voter';
        else if (overallPercent >= 50) badge = '⭐ Active Learner';
        else if (overallPercent >= 20) badge = '📖 Curious Citizen';
        badgeEl.textContent = badge;

        // Stat cards
        document.getElementById('stat-overall').textContent = `${overallPercent}%`;
        document.getElementById('stat-completed').textContent = `${completedCount} / ${totalModules}`;
        
        // Streak (we'll compute a simple mock streak based on joined date)
        const daysSinceJoin = userData.createdAt 
            ? Math.max(1, Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
            : 1;
        document.getElementById('stat-streak').textContent = Math.min(daysSinceJoin, completedCount > 0 ? daysSinceJoin : 1);

        // Rank
        let rank = 'Newcomer';
        if (overallPercent >= 80) rank = 'Gold';
        else if (overallPercent >= 50) rank = 'Silver';
        else if (overallPercent >= 20) rank = 'Bronze';
        document.getElementById('stat-rank').textContent = rank;

        // Progress ring
        animateRing(overallPercent);

        // Module progress list
        const listEl = document.getElementById('module-progress-list');
        listEl.innerHTML = '';
        modules.forEach(mod => {
            const p = parseInt(progress[mod.id] || 0);
            const item = document.createElement('div');
            item.className = 'module-progress-item';
            item.innerHTML = `
                <div class="mp-header">
                    <span class="mp-title">${mod.title}</span>
                    <span class="mp-percent">${p}%</span>
                </div>
                <div class="mp-bar">
                    <div class="mp-bar-fill" style="width: 0%;" data-target="${p}"></div>
                </div>
            `;
            listEl.appendChild(item);
        });

        // Animate module bars after a short delay
        setTimeout(() => {
            document.querySelectorAll('.mp-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 200);
    }

    function animateRing(percent) {
        const ring = document.getElementById('ring-fill');
        const label = document.getElementById('ring-label');
        const circumference = 2 * Math.PI * 78; // r = 78
        ring.style.strokeDasharray = `${circumference}`;
        ring.style.strokeDashoffset = `${circumference}`;

        // Animate after a tick
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const offset = circumference - (percent / 100) * circumference;
                ring.style.strokeDashoffset = offset;
                label.textContent = `${percent}%`;
            });
        });
    }
});
