// ==================== Voice Interview Functions ====================
let currentSession = null;
let currentQuestion = null;
let interviewTimer = null;
let elapsedSeconds = 0;
let currentQuestionIndex = 0;

// Speech Recognition & Synthesis
let recognition = null;
let synthesis = window.speechSynthesis;
let isRecording = false;
let isSpeaking = false;
let currentTranscript = '';
let selectedVoice = null;

// Webcam & Face Detection
let webcamStream = null;
let faceTrackingInterval = null;
let faceStats = { detected: 0, total: 0, centerScores: [] };
let faceApiLoaded = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeSpeech();
    initializeInterview();

    if (typeof initScrollToTop === 'function') {
        initScrollToTop();
    }
});

// ==================== Webcam ====================
async function initWebcam() {
    try {
        // Avoid locking the microphone; speech recognition needs its own audio access.
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoEl = document.getElementById('userVideo');
        videoEl.srcObject = webcamStream;
        document.getElementById('cameraDot').classList.add('green');
        document.getElementById('cameraStatus').textContent = 'Live';
        console.log('Webcam initialized');
        return webcamStream;
    } catch (e) {
        console.warn('Webcam access denied:', e.message);
        document.getElementById('cameraStatus').textContent = 'No camera';
        return null;
    }
}

function stopWebcam() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
}

// ==================== Face Detection ====================
async function initFaceDetection() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        faceApiLoaded = true;
        console.log('Face detection model loaded');
        startFaceTracking();
    } catch (e) {
        console.warn('Face detection failed to load:', e.message);
    }
}

function startFaceTracking() {
    if (!faceApiLoaded) return;

    const videoEl = document.getElementById('userVideo');
    const badge = document.getElementById('faceDetectBadge');

    faceTrackingInterval = setInterval(async () => {
        if (!videoEl || videoEl.readyState < 2) return;

        faceStats.total++;
        try {
            const detection = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions());
            if (detection) {
                faceStats.detected++;
                badge.style.display = 'flex';

                // Calculate centering score (0-100)
                const box = detection.box;
                const centerX = box.x + box.width / 2;
                const videoCenterX = videoEl.videoWidth / 2;
                const offset = Math.abs(centerX - videoCenterX) / videoCenterX;
                faceStats.centerScores.push(Math.round((1 - offset) * 100));
            } else {
                badge.style.display = 'none';
            }
        } catch (e) {
            // Silently ignore detection errors
        }
    }, 3000);
}

function stopFaceTracking() {
    if (faceTrackingInterval) {
        clearInterval(faceTrackingInterval);
        faceTrackingInterval = null;
    }
}

function getBodyLanguageMetrics() {
    const eyeContactPercentage = faceStats.total > 0
        ? Math.round((faceStats.detected / faceStats.total) * 100)
        : 0;
    const faceCenteringScore = faceStats.centerScores.length > 0
        ? Math.round(faceStats.centerScores.reduce((a, b) => a + b, 0) / faceStats.centerScores.length)
        : 0;
    return { eyeContactPercentage, faceCenteringScore };
}

// ==================== Speech Initialization ====================
function initializeSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording = true;
            updateMicUI(true);
            document.getElementById('micStatus').textContent = 'Recording... Speak now';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript.trim()) {
                currentTranscript += finalTranscript;
            }

            const displayText = currentTranscript + interimTranscript;
            document.getElementById('liveTranscript').textContent = displayText || 'Listening...';
            document.getElementById('userAnswer').value = currentTranscript.trim();
            document.getElementById('submitBtn').disabled = currentTranscript.trim().length === 0;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'not-allowed') {
                document.getElementById('micStatus').textContent = 'Microphone access denied';
                showTextFallback();
                isRecording = false;
                updateMicUI(false);
            } else if (event.error === 'network') {
                document.getElementById('micStatus').textContent = 'Network error - type your answer';
                showTextFallback();
                recognition = null;
                isRecording = false;
                updateMicUI(false);
            } else if (event.error === 'no-speech') {
                document.getElementById('micStatus').textContent = 'No speech detected - keep talking';
            } else if (event.error === 'audio-capture') {
                document.getElementById('micStatus').textContent = 'Microphone not found';
                showTextFallback();
                isRecording = false;
                updateMicUI(false);
            } else if (event.error !== 'aborted') {
                document.getElementById('micStatus').textContent = 'Error: ' + event.error;
            }
        };

        recognition.onend = () => {
            if (isRecording && recognition) {
                try {
                    setTimeout(() => {
                        if (isRecording && recognition) {
                            recognition.start();
                        }
                    }, 100);
                } catch (e) {
                    console.log('Could not restart recognition');
                }
            } else {
                updateMicUI(false);
                if (currentTranscript.trim()) {
                    document.getElementById('micStatus').textContent = 'Recording stopped. Click Submit or mic to continue.';
                } else {
                    document.getElementById('micStatus').textContent = 'Click mic to speak';
                }
            }
        };

        recognition.onspeechend = () => {
            document.getElementById('micStatus').textContent = 'Listening... (speak or click mic to stop)';
        };
    } else {
        console.warn('Speech Recognition not supported');
        document.getElementById('micStatus').textContent = 'Voice not supported - use text';
        showTextFallback();
    }

    if (synthesis) {
        loadVoices();
        synthesis.onvoiceschanged = loadVoices;
    }

    showTextFallback();
}

function loadVoices() {
    const voices = synthesis.getVoices();
    selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0];
}

function showTextFallback() {
    const fallback = document.getElementById('textFallback');
    if (fallback) fallback.style.display = 'block';

    const textarea = document.getElementById('userAnswer');
    if (textarea) {
        textarea.value = currentTranscript;

        if (!textarea.hasAttribute('data-listener-added')) {
            textarea.setAttribute('data-listener-added', 'true');
            textarea.addEventListener('input', () => {
                currentTranscript = textarea.value;
                document.getElementById('submitBtn').disabled = textarea.value.trim().length === 0;
                document.getElementById('liveTranscript').textContent = textarea.value || 'Type your answer...';
            });
        }
    }
}

// ==================== Recording Controls ====================
function toggleRecording() {
    if (isSpeaking) return;
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!recognition) {
        showTextFallback();
        return;
    }
    try {
        document.getElementById('liveTranscript').textContent = currentTranscript || 'Listening...';
        recognition.start();
    } catch (e) {
        console.error('Error starting recognition:', e);
        showTextFallback();
    }
}

function stopRecording() {
    isRecording = false;
    updateMicUI(false);
    if (recognition) {
        try { recognition.stop(); } catch (e) { /* ignore */ }
    }
    if (currentTranscript.trim()) {
        document.getElementById('micStatus').textContent = 'Captured. Click Submit or mic to add more.';
    } else {
        document.getElementById('micStatus').textContent = 'Click mic to speak';
    }
}

function clearTranscript() {
    currentTranscript = '';
    document.getElementById('liveTranscript').textContent = 'Start speaking...';
    document.getElementById('userAnswer').value = '';
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('micStatus').textContent = 'Click mic to speak';
}

function updateMicUI(recording) {
    const micButton = document.getElementById('micButton');
    if (recording) {
        micButton.classList.add('recording');
    } else {
        micButton.classList.remove('recording');
    }
}

// ==================== Text-to-Speech ====================
function speakText(text) {
    return new Promise((resolve) => {
        if (!synthesis) { resolve(); return; }

        synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
            isSpeaking = true;
            updateSpeakingUI(true);
        };

        utterance.onend = () => {
            isSpeaking = false;
            updateSpeakingUI(false);
            resolve();
        };

        utterance.onerror = () => {
            isSpeaking = false;
            updateSpeakingUI(false);
            resolve();
        };

        synthesis.speak(utterance);
    });
}

function updateSpeakingUI(speaking) {
    const avatar = document.getElementById('aiAvatar');
    const status = document.getElementById('avatarStatus');
    const micButton = document.getElementById('micButton');

    if (speaking) {
        avatar.classList.add('speaking');
        status.textContent = 'AI is speaking...';
        micButton.disabled = true;
    } else {
        avatar.classList.remove('speaking');
        status.textContent = 'AI Interviewer';
        micButton.disabled = false;
    }
}

function replayQuestion() {
    if (currentQuestion && currentQuestion.currentQuestion) {
        speakText(currentQuestion.currentQuestion);
    }
}

// ==================== Interview Session ====================
async function initializeInterview() {
    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('resumeId');

    if (!resumeId) {
        loadResumeList();
    } else {
        await startInterviewSession(resumeId);
    }
}

async function loadResumeList() {
    try {
        const resumes = await apiClient.getUserResumes();
        const resumeList = document.getElementById('resumeList');

        if (resumes.length === 0) {
            resumeList.innerHTML = '<p style="text-align:center;">No resumes found. Please analyze a resume first.</p>';
            return;
        }

        resumeList.innerHTML = resumes.map(resume => `
            <div class="resume-item" onclick="startInterviewSession(${resume.id})">
                <h4>${resume.jobRole}</h4>
                <p>File: ${resume.fileName}</p>
                <p>Uploaded: ${new Date(resume.createdAt).toLocaleDateString()}</p>
                <button class="btn btn-primary" onclick="event.stopPropagation(); startInterviewSession(${resume.id})">
                    Start Interview
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading resumes:', error);
    }
}

async function startInterviewSession(resumeId) {
    try {
        document.getElementById('resumeSelectionSection').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('loadingText').textContent = 'Initializing webcam and interview...';

        // Start webcam
        await initWebcam();

        const response = await apiClient.startInterview(resumeId);
        currentSession = response.sessionId;

        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('interviewSection').style.display = 'block';

        // Init face detection (non-blocking)
        initFaceDetection();

        // Welcome message
        await speakText("Welcome to your AI interview session. I will ask you questions based on your resume. Let's begin.");

        getNextQuestion();
        startTimer();
    } catch (error) {
        console.error('Error starting interview:', error);
        if (typeof Toast !== 'undefined') {
            Toast.error('Error starting interview');
        }
    }
}

async function getNextQuestion() {
    try {
        const response = await apiClient.getNextQuestion(currentSession);
        currentQuestion = response;

        if (currentQuestionIndex === 0) {
            document.getElementById('roleInfo').textContent = `Role: ${response.jobRole || 'Technical Interview'}`;
        }

        // Update difficulty badge
        const badge = document.getElementById('difficultyBadge');
        badge.textContent = response.difficultyLevel || 'BASIC';
        badge.className = `difficulty-badge ${(response.difficultyLevel || 'BASIC').toLowerCase()}`;

        // Show/hide follow-up badge
        const followUpBadge = document.getElementById('followUpBadge');
        if (response.isFollowUp) {
            followUpBadge.style.display = 'block';
        } else {
            followUpBadge.style.display = 'none';
        }

        // Display question
        document.getElementById('currentQuestion').textContent = response.currentQuestion;

        // Clear previous answer
        document.getElementById('userAnswer').value = '';
        document.getElementById('liveTranscript').textContent = 'Start speaking...';
        currentTranscript = '';
        document.getElementById('submitBtn').disabled = true;

        // Update progress
        currentQuestionIndex = response.questionNumber - 1;
        document.getElementById('questionCount').textContent = `${response.questionNumber}/${response.totalQuestions}`;
        const progress = (response.questionNumber / response.totalQuestions) * 100;
        document.getElementById('progressFill').style.width = progress + '%';

        // Check if completed
        if (response.isCompleted) {
            await completeInterview();
            return;
        }

        // Speak the question
        const prefix = response.isFollowUp ? "Follow-up: " : "";
        await speakText(prefix + response.currentQuestion);

        addToTranscript('AI', response.currentQuestion);

        if (!recognition) {
            showTextFallback();
            document.getElementById('micStatus').textContent = 'Voice unavailable - type your answer';
        } else {
            document.getElementById('micStatus').textContent = 'Click mic to answer';
        }

    } catch (error) {
        console.error('Error getting question:', error);
        if (typeof Toast !== 'undefined') {
            Toast.error('Error loading question');
        }
    }
}

async function submitAnswer() {
    const answer = currentTranscript.trim() || document.getElementById('userAnswer').value.trim();

    if (!answer) {
        if (typeof Toast !== 'undefined') Toast.error('Please provide an answer');
        return;
    }

    stopRecording();

    try {
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('micStatus').textContent = 'Processing...';

        const response = await apiClient.submitAnswer(currentSession, currentQuestion.questionId, answer);

        addToTranscript('You', answer);

        document.getElementById('userAnswer').value = '';
        document.getElementById('liveTranscript').textContent = '';
        currentTranscript = '';

        if (response.feedback) {
            await speakText(response.feedback);
        }

        setTimeout(() => {
            getNextQuestion();
        }, 1000);

    } catch (error) {
        console.error('Error submitting answer:', error);
        if (typeof Toast !== 'undefined') Toast.error('Error submitting answer');
        document.getElementById('submitBtn').disabled = false;
    }
}

function addToTranscript(speaker, message) {
    const transcriptBox = document.getElementById('transcriptBox');

    const placeholder = transcriptBox.querySelector('.transcript-placeholder');
    if (placeholder) placeholder.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `transcript-message ${speaker.toLowerCase() === 'ai' ? 'ai' : 'user'}`;

    const icon = speaker.toLowerCase() === 'ai' ? '&#129302;' : '&#128100;';
    messageDiv.innerHTML = `
        <div class="message-header">
            <span>${icon}</span>
            <strong>${speaker}</strong>
        </div>
        <p style="margin:0; line-height:1.5;">${message}</p>
    `;

    transcriptBox.appendChild(messageDiv);
    transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

// ==================== Timer Functions (Count UP) ====================
function startTimer() {
    elapsedSeconds = 0;
    updateTimer();

    interviewTimer = setInterval(() => {
        elapsedSeconds++;
        updateTimer();
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    document.getElementById('timer').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ==================== Interview Completion ====================
function confirmEndInterview() {
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

async function endInterview() {
    clearInterval(interviewTimer);
    closeConfirmModal();
    stopRecording();
    stopFaceTracking();
    synthesis.cancel();

    try {
        const bodyMetrics = getBodyLanguageMetrics();
        await apiClient.endInterview(currentSession, bodyMetrics);
        await speakText("Thank you for completing the interview. Let me prepare your performance report.");
        await loadReport();
    } catch (error) {
        console.error('Error ending interview:', error);
        if (typeof Toast !== 'undefined') Toast.error('Error ending interview');
    }
}

async function completeInterview() {
    clearInterval(interviewTimer);
    stopRecording();
    stopFaceTracking();

    try {
        const bodyMetrics = getBodyLanguageMetrics();
        await apiClient.endInterview(currentSession, bodyMetrics);
        await speakText("Congratulations! You have completed all the interview questions. Let me prepare your detailed performance report.");
        await loadReport();
    } catch (error) {
        console.error('Error completing interview:', error);
    }
}

async function loadReport() {
    try {
        const report = await apiClient.getInterviewReport(currentSession);

        stopWebcam();

        document.getElementById('interviewSection').style.display = 'none';
        document.getElementById('completionSection').style.display = 'block';

        document.getElementById('finalScore').textContent = report.totalScore + '%';
        document.getElementById('questionsAnswered').textContent = report.totalQuestionsAsked;
        document.getElementById('sessionDuration').textContent = report.durationMinutes || Math.round(elapsedSeconds / 60);

        document.getElementById('reportBtn').style.display = 'inline-block';
    } catch (error) {
        console.error('Error loading report:', error);
        if (typeof Toast !== 'undefined') Toast.error('Error loading report');
    }
}

function viewDetailedReport() {
    window.open(`/pages/report.html?sessionId=${currentSession}`, '_blank');
}

function goToDashboard() {
    window.location.href = '/pages/dashboard.html';
}

function showError(message) {
    if (typeof Toast !== 'undefined') {
        Toast.error(message);
    } else {
        const micStatus = document.getElementById('micStatus');
        if (micStatus) {
            micStatus.textContent = message;
            setTimeout(() => { micStatus.textContent = 'Click mic to speak'; }, 3000);
        }
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (recognition) recognition.stop();
    if (synthesis) synthesis.cancel();
    stopWebcam();
    stopFaceTracking();
});
