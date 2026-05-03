import { auth } from './firebase-config.js';
import { 
    RecaptchaVerifier 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { loginUser, verifyOTP } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone-number');
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const otpInput = document.getElementById('otp-code');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const backBtn = document.getElementById('back-to-phone');
    const errorMsg = document.getElementById('error-msg');
    
    const stepPhone = document.getElementById('step-phone');
    const stepOtp = document.getElementById('step-otp');

    let confirmationResult = null;

    // Initialize Recaptcha
    const initRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    sendOtpBtn.disabled = false;
                },
                'expired-callback': () => {
                    sendOtpBtn.disabled = true;
                    errorMsg.textContent = "reCAPTCHA expired. Please solve it again.";
                }
            });
            window.recaptchaVerifier.render().catch(err => {
                console.error("Recaptcha error:", err);
            });
        }
    };

    initRecaptcha();

    // Send OTP
    sendOtpBtn.addEventListener('click', async () => {
        errorMsg.textContent = '';
        const number = phoneInput.value.trim();
        
        if (number.length !== 10 || isNaN(number)) {
            errorMsg.textContent = "Please enter a valid 10-digit phone number.";
            return;
        }

        const phoneNumber = `+91${number}`;
        sendOtpBtn.textContent = 'Sending...';
        sendOtpBtn.disabled = true;

        try {
            const appVerifier = window.recaptchaVerifier;
            confirmationResult = await loginUser(phoneNumber, appVerifier);
            
            stepPhone.classList.add('hidden');
            stepOtp.classList.remove('hidden');
            errorMsg.style.color = '#27ae60';
            errorMsg.textContent = "OTP sent successfully!";
            setTimeout(() => errorMsg.textContent = '', 3000);
        } catch (error) {
            console.error("SMS Error:", error);
            errorMsg.style.color = '#ef4444';
            errorMsg.textContent = "Failed to send SMS. " + error.message;
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then(widgetId => {
                    grecaptcha.reset(widgetId);
                });
            }
        } finally {
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.disabled = false;
        }
    });

    // Verify OTP
    verifyOtpBtn.addEventListener('click', async () => {
        errorMsg.textContent = '';
        const code = otpInput.value.trim();

        if (code.length !== 6 || isNaN(code)) {
            errorMsg.style.color = '#ef4444';
            errorMsg.textContent = "Please enter a valid 6-digit OTP.";
            return;
        }

        verifyOtpBtn.textContent = 'Verifying...';
        verifyOtpBtn.disabled = true;

        try {
            await verifyOTP(confirmationResult, code);
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Verification Error:", error);
            errorMsg.style.color = '#ef4444';
            errorMsg.textContent = "Invalid OTP. Please try again.";
        } finally {
            verifyOtpBtn.textContent = 'Verify OTP';
            verifyOtpBtn.disabled = false;
        }
    });

    // Back button
    backBtn.addEventListener('click', () => {
        stepOtp.classList.add('hidden');
        stepPhone.classList.remove('hidden');
        otpInput.value = '';
        errorMsg.textContent = '';
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        }
    });
});
