// ==================== Authentication ==================== 
function handleCredentialResponse(response) {
    // Decode JWT token from Google
    const token = response.credential;
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    
    const googleData = {
        googleId: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        profilePictureUrl: decodedToken.picture
    };

    apiClient.loginWithGoogle(googleData)
        .then(response => {
            if (response.token) {
                apiClient.setToken(response.token);
                localStorage.setItem('userId', decodedToken.sub);
                window.location.href = '/pages/dashboard.html';
            } else {
                showError('Login failed');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            showError('Login failed');
        });
}

function guestLogin() {
    apiClient.guestLogin()
        .then(response => {
            if (response.token) {
                apiClient.setToken(response.token);
                window.location.href = '/pages/dashboard.html';
            } else {
                showError('Guest login failed');
            }
        })
        .catch(error => {
            console.error('Guest login error:', error);
            showError('Guest login failed');
        });
}

function logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    window.location.href = '/index.html';
}

function signInWithGoogle() {
    // Redirect to home page where Google Sign-In is available
    window.location.href = '/index.html#login';
}

// Make functions globally available for inline onclick handlers
window.signInWithGoogle = signInWithGoogle;
window.logout = logout;

function checkAuthentication() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// ==================== Modal Functions ==================== 
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'block';
    }
}

function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}

window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    if (event.target === loginModal) {
        closeLoginModal();
    }
};

// ==================== Utility Functions ==================== 
function showError(message) {
    Toast.error(message);
}

function showSuccess(message) {
    Toast.success(message);
}

function redirectToResume() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        window.location.href = '/pages/resume-analyzer.html';
    } else {
        showLoginModal();
    }
}

function redirectToInterview() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        window.location.href = '/pages/interview.html';
    } else {
        showLoginModal();
    }
}

function handleContactForm(event) {
    event.preventDefault();
    Toast.success('Thank you for reaching out! We will get back to you soon.');
    event.target.reset();
}
