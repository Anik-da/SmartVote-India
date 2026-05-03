import { auth } from './firebase-config.js';
import { 
    signOut, 
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Stronger Auth Gating Logic
    const enforceAuthGating = (user) => {
        const currentPage = window.location.pathname;
        // Add pages that should NOT be gated here
        const isPublicPage = currentPage.includes('login.html') || 
                             currentPage.endsWith('index.html') || 
                             currentPage.endsWith('/');

        if (!user && !isPublicPage) {
            console.log("Unauthorized access attempt. Redirecting to login.");
            window.location.replace('login.html'); // replace to prevent going back
            return false;
        }
        return true;
    };

    if (loginBtn) {
        loginBtn.onclick = (e) => {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        };
    }

    // Dropdown Logic - Improved for reliability
    if (userProfile) {
        const dropdown = userProfile.querySelector('.dropdown-content');
        
        userProfile.addEventListener('click', (e) => {
            if (dropdown) {
                const isVisible = dropdown.classList.contains('show');
                dropdown.classList.toggle('show', !isVisible);
                e.stopPropagation();
            }
        });

        // Hover support for desktop
        userProfile.addEventListener('mouseenter', () => {
            if (dropdown) dropdown.classList.add('show');
        });
        
        userProfile.addEventListener('mouseleave', () => {
            if (dropdown) dropdown.classList.remove('show');
        });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(d => d.classList.remove('show'));
    });

    // Logout Logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                if (confirm("Are you sure you want to logout?")) {
                    await signOut(auth);
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Logout Error:", error);
                alert("Failed to logout: " + error.message);
            }
        });
    }

    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('login.html');

        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'flex';
                userNameDisplay.textContent = user.phoneNumber || 'Voter';
            }

            if (isLoginPage) {
                window.location.href = 'index.html';
                return;
            }

            window.dispatchEvent(new CustomEvent('authReady', { detail: user }));
            document.body.classList.add('auth-ready');
        } else {
            // User is logged out
            if (loginBtn) loginBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';

            window.dispatchEvent(new CustomEvent('authReady', { detail: null }));
            
            // Redirect if on protected page
            if (enforceAuthGating(user)) {
                document.body.classList.add('auth-ready');
            }
        }
    });
});
