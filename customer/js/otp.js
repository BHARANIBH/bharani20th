// OTP Login Functions
let currentPhone = '';
let otpStep = false;
let pendingLoginName = '';

function openOTPModal() {
    console.log('Opening OTP modal...');
    
    // Show modal and reset to phone input step
    document.getElementById('otpModal').style.display = 'flex';
    document.getElementById('phoneInputStep').style.display = 'block';
    document.getElementById('otpInputStep').style.display = 'none';
    document.getElementById('loginName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('otpCode').value = '';
    otpStep = false;
    
    console.log('OTP modal opened and ready for phone input');
}

async function sendOTP() {
    const enteredName = document.getElementById('loginName').value.trim();
    const phoneInput = document.getElementById('phoneNumber').value.trim();
    
    console.log('📱 Send OTP clicked');
    console.log('Phone input:', phoneInput);
    console.log('Phone length:', phoneInput.length);
    
    // Extract only digits
    const phone = phoneInput.replace(/[^0-9]/g, '');
    console.log('Cleaned phone:', phone);
    console.log('Cleaned length:', phone.length);
    
    if (!enteredName || enteredName.length < 2) {
        showNotification('Please enter your name');
        return;
    }

    if (!phone || phone.length < 10) {
        const msg = '❌ Please enter a valid 10-digit phone number (you entered: ' + phone.length + ' digits)';
        console.log(msg);
        showNotification(msg);
        return;
    }

    pendingLoginName = enteredName;
    currentPhone = phone;
    console.log('✅ Phone validated:', currentPhone);

    try {
        console.log('🚀 Sending OTP request to /api/otp/send...');
        const response = await fetch('/api/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentPhone })
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();

        console.log('📥 OTP send response:', data);

        if (data.success) {
            console.log('✅ OTP sent successfully!');
            
            // Show OTP input step
            const phoneStep = document.getElementById('phoneInputStep');
            const otpStep = document.getElementById('otpInputStep');
            
            console.log('Hiding phone step...');
            phoneStep.style.display = 'none';
            
            console.log('Showing OTP step...');
            otpStep.style.display = 'block';
            
            console.log('Phone step display:', phoneStep.style.display);
            console.log('OTP step display:', otpStep.style.display);
            
            showNotification(`✅ OTP sent via ${data.channel || 'WhatsApp'}!`);

            // For development - auto-fill OTP if returned
            if (data.debug_otp) {
                document.getElementById('otpCode').value = data.debug_otp;
                console.log('🔧 Development mode: OTP auto-filled:', data.debug_otp);
            }
        } else {
            console.log('❌ API returned error:', data.message);
            showNotification(data.message || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('💥 Send OTP error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showNotification('Network error: ' + error.message);
    }
}

async function verifyOTP() {
    const otp = document.getElementById('otpCode').value.trim();
    
    console.log('Verify OTP clicked for phone:', currentPhone, 'OTP:', otp);
    
    if (!otp || otp.length < 6) {
        showNotification('Please enter a 6-digit OTP');
        return;
    }

    try {
        const response = await fetch('/api/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentPhone, otp: otp })
        });

        const data = await response.json();

        console.log('OTP verification response:', data);

        if (data.success) {
            // Store JWT token
            const resolvedUser = {
                ...(data.user || {}),
                name: pendingLoginName || data.user?.name || 'User',
                phone: currentPhone || data.user?.phone || ''
            };
            localStorage.setItem('pureDesiToken', data.token);
            localStorage.setItem('pureDesiUser', JSON.stringify(resolvedUser));

            // Close modal and update UI
            closeOTPModal();
            updateUserUI(resolvedUser);
            sessionStorage.setItem('pureDesiShowHealthPopup', '1');
            if (typeof maybeShowHealthPopupAfterLogin === 'function') {
                maybeShowHealthPopupAfterLogin();
            }

            showNotification('✅ Login successful! Welcome back.');
        } else {
            showNotification(data.message || 'OTP verification failed');
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        showNotification('Network error. Please try again.');
    }
}

async function resendOTP() {
    console.log('Resend OTP clicked for phone:', currentPhone);
    
    if (!currentPhone) {
        showNotification('Phone number not found');
        return;
    }

    try {
        const response = await fetch('/api/otp/resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: currentPhone })
        });

        const data = await response.json();

        console.log('Resend OTP response:', data);

        if (data.success) {
            showNotification(`OTP resent via ${data.channel || 'WhatsApp'}!`);
            
            // For development - auto-fill OTP if returned
            if (data.debug_otp) {
                document.getElementById('otpCode').value = data.debug_otp;
            }
        } else {
            showNotification(data.message || 'Failed to resend OTP');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showNotification('Network error. Please try again.');
    }
}

function closeOTPModal() {
    document.getElementById('otpModal').style.display = 'none';
}

function updateUserUI(user) {
    if (!user) return;

    const displayName = user.name || `User ${String(user.phone || '').slice(-4)}`;
    const displayPhone = user.phone || '';

    // Update header login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = `Hi, ${displayName}`;
        loginBtn.onclick = openProfile;
    }

    // Update profile section details
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileContactEl = document.getElementById('profileContact');
    if (profileNameEl) profileNameEl.textContent = displayName;
    if (profileEmailEl) profileEmailEl.textContent = `${displayName.toLowerCase().replace(/\s+/g, '')}@puredesi.app`;
    if (profileContactEl) profileContactEl.textContent = displayPhone ? `📞 +91 ${displayPhone}` : '📞 Not available';

    // Update login banner if it exists
    const loginBanner = document.getElementById('loginBanner');
    if (loginBanner) {
        loginBanner.innerHTML = `
            <div>
                <h4>Welcome, ${displayName}! 👋</h4>
                <p>Manage your orders, rewards & addresses.</p>
            </div>
            <button class="login-btn" onclick="logout()">Logout</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('pureDesiToken');
    localStorage.removeItem('pureDesiUser');
    showNotification('Logged out successfully');

    // Reset header login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = openOTPModal;
    }

    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileContactEl = document.getElementById('profileContact');
    if (profileNameEl) profileNameEl.textContent = 'Guest User';
    if (profileEmailEl) profileEmailEl.textContent = 'Login to personalize account';
    if (profileContactEl) profileContactEl.textContent = '📞 Not logged in';

    // Reset login banner
    const loginBanner = document.getElementById('loginBanner');
    if (loginBanner) {
        loginBanner.innerHTML = `
            <div>
                <h4>Login to unlock benefits! 🎁</h4>
                <p>Get exclusive offers, faster checkout & order tracking.</p>
            </div>
            <button class="login-btn" onclick="openOTPModal()">Login / Sign Up</button>
        `;
    }

    if (typeof closeProfile === 'function') closeProfile();
}

window.performLogout = logout;

// Check if user is already logged in on page load
function checkLoginStatus() {
    const user = localStorage.getItem('pureDesiUser');
    const token = localStorage.getItem('pureDesiToken');

    if (user && token) {
        try {
            const userData = JSON.parse(user);
            updateUserUI(userData);
        } catch(e) {
            console.log('Invalid user data in localStorage');
        }
    }
}

// Initialize OTP functionality
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});