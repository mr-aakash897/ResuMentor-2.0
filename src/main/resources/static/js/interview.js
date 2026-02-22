// ==================== Voice Interview Functions ==================== 
let currentSession = null;
let currentQuestion = null;
let interviewTimer = null;
let remainingSeconds = 1800; // 30 minutes
let currentQuestionIndex = 0;

// Speech Recognition & Synthesis
let recognition = null;
let synthesis = window.speechSynthesis;
let isRecording = false;
let isSpeaking = false;
let currentTranscript = '';
let selectedVoice = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeSpeech();
    initializeInterview();
    
    // Initialize scroll-to-top button
    if (typeof initScrollToTop === 'function') {
        initScrollToTop();
    }
});

// ==================== Speech Initialization ====================
function initializeSpeech() {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording = true;
            updateMicUI(true);
            document.getElementById('micStatus').textContent = '🔴 Recording... Speak now';
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

            // Append final transcript
            if (finalTranscript.trim()) {
                currentTranscript += finalTranscript;
            }
            
            // Show real-time feedback
            const displayText = currentTranscript + interimTranscript;
            document.getElementById('liveTranscript').textContent = displayText || 'Listening...';
            document.getElementById('userAnswer').value = currentTranscript.trim();
            
            // Enable submit button when there's content
            document.getElementById('submitBtn').disabled = currentTranscript.trim().length === 0;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            if (event.error === 'not-allowed') {
                document.getElementById('micStatus').textContent = '❌ Microphone access denied';
                showTextFallback();
                isRecording = false;
                updateMicUI(false);
            } else if (event.error === 'network') {
                document.getElementById('micStatus').textContent = '⚠️ Network error - type your answer instead';
                showTextFallback();
                recognition = null;
                isRecording = false;
                updateMicUI(false);
            } else if (event.error === 'no-speech') {
                // Don't stop, just notify
                document.getElementById('micStatus').textContent = '🎤 No speech detected - keep talking';
            } else if (event.error === 'audio-capture') {
                document.getElementById('micStatus').textContent = '❌ Microphone not found';
                showTextFallback();
                isRecording = false;
                updateMicUI(false);
            } else if (event.error !== 'aborted') {
                document.getElementById('micStatus').textContent = 'Error: ' + event.error;
            }
        };

        recognition.onend = () => {
            // Auto-restart if we should still be recording
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
                    document.getElementById('micStatus').textContent = '✓ Recording stopped. Click Submit or mic to continue.';
                } else {
                    document.getElementById('micStatus').textContent = 'Click mic to speak';
                }
            }
        };

        recognition.onspeechend = () => {
            // Speech ended but don't stop recording yet
            document.getElementById('micStatus').textContent = '🎤 Listening... (speak or click mic to stop)';
        };
    } else {
        console.warn('Speech Recognition not supported');
        document.getElementById('micStatus').textContent = 'Voice not supported - use text';
        showTextFallback();
    }

    // Initialize Text-to-Speech voices
    if (synthesis) {
        // Load voices
        loadVoices();
        synthesis.onvoiceschanged = loadVoices;
    }
    
    // Always show text fallback as a backup option
    showTextFallback();
}

function loadVoices() {
    const voices = synthesis.getVoices();
    // Try to find a good English voice
    selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0];
}

function showTextFallback() {
    const fallback = document.getElementById('textFallback');
    if (fallback.classList.contains('visible')) return; // Already visible
    
    fallback.classList.add('visible');
    
    // Sync textarea with transcript
    const textarea = document.getElementById('userAnswer');
    textarea.value = currentTranscript;
    
    // Enable submit button when text is typed
    textarea.addEventListener('input', () => {
        currentTranscript = textarea.value;
        document.getElementById('submitBtn').disabled = textarea.value.trim().length === 0;
        document.getElementById('liveTranscript').textContent = textarea.value || 'Type your answer...';
    });
}

// ==================== Recording Controls ====================
function toggleRecording() {
    if (isSpeaking) {
        // Don't allow recording while AI is speaking
        return;
    }

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
        // Don't clear transcript - allow appending for multi-click recording
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
        try {
            recognition.stop();
        } catch (e) {
            // Ignore
        }
    }
    
    // Update status based on whether we have content
    if (currentTranscript.trim()) {
        document.getElementById('micStatus').textContent = '✓ Captured. Click Submit or mic to add more.';
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
    const micPulse = document.getElementById('micPulse');
    const visualizer = document.getElementById('voiceVisualizer');

    if (recording) {
        micButton.classList.add('recording');
        micPulse.classList.add('active');
        visualizer.classList.add('active');
    } else {
        micButton.classList.remove('recording');
        micPulse.classList.remove('active');
        visualizer.classList.remove('active');
    }
}

// ==================== Text-to-Speech ====================
function speakText(text) {
    return new Promise((resolve) => {
        if (!synthesis) {
            resolve();
            return;
        }

        // Stop any ongoing speech
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
    const indicator = document.getElementById('speakingIndicator');
    const status = document.getElementById('avatarStatus');
    const micButton = document.getElementById('micButton');

    if (speaking) {
        indicator.classList.add('active');
        status.textContent = 'AI is speaking...';
        micButton.disabled = true;
    } else {
        indicator.classList.remove('active');
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
            resumeList.innerHTML = '<p>No resumes found. Please analyze a resume first.</p>';
            return;
        }

        resumeList.innerHTML = resumes.map(resume => `
            <div class="resume-item" onclick="startInterviewSession(${resume.id})">
                <h4>${resume.jobRole}</h4>
                <p>File: ${resume.fileName}</p>
                <p>Uploaded: ${new Date(resume.createdAt).toLocaleDateString()}</p>
                <button class="btn btn-primary" onclick="event.stopPropagation(); startInterviewSession(${resume.id})">
                    🎙️ Start Voice Interview
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
        document.getElementById('loadingText').textContent = 'Preparing voice interview...';

        // Request microphone permission early
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            console.warn('Microphone access denied, falling back to text');
            showTextFallback();
        }

        const response = await apiClient.startInterview(resumeId);
        currentSession = response.sessionId;

        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('interviewSection').style.display = 'flex';

        // Welcome message
        await speakText("Welcome to your AI interview session. I will ask you questions based on your resume and the role you're applying for. Let's begin.");

        getNextQuestion();
        startTimer();
    } catch (error) {
        console.error('Error starting interview:', error);
        showError('Error starting interview');
    }
}

async function getNextQuestion() {
    try {
        const response = await apiClient.getNextQuestion(currentSession);
        currentQuestion = response;

        // Update header info
        if (currentQuestionIndex === 0) {
            document.getElementById('roleInfo').textContent = `Role: ${response.jobRole || 'Technical Interview'}`;
        }

        // Update difficulty badge
        const badge = document.getElementById('difficultyBadge');
        badge.textContent = response.difficultyLevel || 'BASIC';
        badge.className = `difficulty-badge ${(response.difficultyLevel || 'BASIC').toLowerCase()}`;

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
            completeInterview();
            return;
        }

        // Speak the question
        await speakText(response.currentQuestion);

        // Add to transcript
        addToTranscript('AI', response.currentQuestion);

        // Show text fallback if no voice, otherwise prompt to click mic
        if (!recognition) {
            showTextFallback();
            document.getElementById('micStatus').textContent = 'Voice unavailable - type your answer';
        } else {
            document.getElementById('micStatus').textContent = 'Click mic to answer';
        }

    } catch (error) {
        console.error('Error getting question:', error);
        showError('Error loading question');
    }
}

async function submitAnswer() {
    // Get answer from transcript or text input
    const answer = currentTranscript.trim() || document.getElementById('userAnswer').value.trim();

    if (!answer) {
        showError('Please provide an answer');
        return;
    }

    // Stop recording if active
    stopRecording();

    try {
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('micStatus').textContent = 'Processing...';

        const response = await apiClient.submitAnswer(currentSession, currentQuestion.questionId, answer);
        
        // Add user's answer to transcript
        addToTranscript('You', answer);

        // Reset for next question
        document.getElementById('userAnswer').value = '';
        document.getElementById('liveTranscript').textContent = '';
        currentTranscript = '';

        // Provide feedback and move to next question
        if (response.feedback) {
            await speakText(response.feedback);
        }

        // Small delay before next question
        setTimeout(() => {
            getNextQuestion();
        }, 1000);

    } catch (error) {
        console.error('Error submitting answer:', error);
        showError('Error submitting answer');
        document.getElementById('submitBtn').disabled = false;
    }
}

function addToTranscript(speaker, message) {
    const transcriptBox = document.getElementById('transcriptBox');
    
    // Clear placeholder if exists
    const placeholder = transcriptBox.querySelector('.transcript-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `transcript-message ${speaker.toLowerCase() === 'ai' ? 'ai' : 'user'}`;
    
    const icon = speaker.toLowerCase() === 'ai' ? '🤖' : '👤';
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-icon">${icon}</span>
            <strong>${speaker}</strong>
        </div>
        <p class="message-text">${message}</p>
    `;
    
    transcriptBox.appendChild(messageDiv);
    transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

// ==================== Timer Functions ====================
function startTimer() {
    remainingSeconds = 1800;
    updateTimer();

    interviewTimer = setInterval(() => {
        remainingSeconds--;
        updateTimer();

        if (remainingSeconds <= 0) {
            clearInterval(interviewTimer);
            speakText("Time is up. The interview session has ended.").then(() => {
                completeInterview();
            });
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = timerDisplay;

    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('warning', 'danger');
    if (remainingSeconds <= 300) {
        timerElement.classList.add('danger');
    } else if (remainingSeconds <= 600) {
        timerElement.classList.add('warning');
    }
}

// ==================== Interview Completion ====================
function confirmEndInterview() {
    document.getElementById('confirmModal').style.display = 'block';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function endInterview() {
    clearInterval(interviewTimer);
    closeConfirmModal();
    stopRecording();
    synthesis.cancel();

    try {
        await apiClient.endInterview(currentSession);
        await speakText("Thank you for completing the interview. Let me prepare your performance report.");
        await loadReport();
    } catch (error) {
        console.error('Error ending interview:', error);
        showError('Error ending interview');
    }
}

async function completeInterview() {
    clearInterval(interviewTimer);
    stopRecording();
    
    try {
        await apiClient.endInterview(currentSession);
        await speakText("Congratulations! You have completed all the interview questions. Let me prepare your detailed performance report.");
        await loadReport();
    } catch (error) {
        console.error('Error completing interview:', error);
    }
}

async function loadReport() {
    try {
        const report = await apiClient.getInterviewReport(currentSession);

        document.getElementById('interviewSection').style.display = 'none';
        document.getElementById('completionSection').style.display = 'block';

        document.getElementById('finalScore').textContent = report.totalScore + '%';
        document.getElementById('questionsAnswered').textContent = report.totalQuestionsAsked;
        document.getElementById('sessionDuration').textContent = report.durationMinutes || Math.round((1800 - remainingSeconds) / 60);

        document.getElementById('reportBtn').style.display = 'inline-block';
    } catch (error) {
        console.error('Error loading report:', error);
        showError('Error loading report');
    }
}

function viewDetailedReport() {
    window.open(`/pages/report.html?sessionId=${currentSession}`, '_blank');
}

function goToDashboard() {
    window.location.href = '/pages/dashboard.html';
}

function showError(message) {
    const micStatus = document.getElementById('micStatus');
    if (micStatus) {
        micStatus.textContent = message;
        micStatus.classList.add('error');
        setTimeout(() => {
            micStatus.classList.remove('error');
            micStatus.textContent = 'Click to speak';
        }, 3000);
    } else {
        Toast.error(message);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (recognition) {
        recognition.stop();
    }
    if (synthesis) {
        synthesis.cancel();
    }
});
