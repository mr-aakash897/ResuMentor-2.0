// ==================== Dashboard Functions ====================
let resumeChartInstance = null;
let interviewChartInstance = null;
let currentResumeAnalysis = null;
let currentInterviewReport = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    showSkeletonLoaders();
    loadDashboardData();


    // Auto-open analysis if redirected from resume analyzer
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');
    if (resumeId) {
        // Wait for dashboard to load, then open analysis
        setTimeout(() => viewResumeAnalysis(parseInt(resumeId)), 1000);
    }

    // Auto-open interview report if redirected from report page
    const interviewSessionId = urlParams.get('interviewSessionId');
    if (interviewSessionId) {
        setTimeout(() => viewInterviewReport(parseInt(interviewSessionId)), 1000);
    }
});

// Show skeleton loaders while data is loading
function showSkeletonLoaders() {
    // Stats skeleton
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(el => {
        el.classList.add('skeleton');
        el.style.minWidth = '40px';
        el.textContent = '\u00A0';
    });
    
    // Profile skeleton
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    if (userName) userName.classList.add('skeleton');
    if (userEmail) userEmail.classList.add('skeleton');
    if (userRole) userRole.classList.add('skeleton');
    
    // History skeleton - use helper if available
    const resumeHistory = document.getElementById('resumeHistory');
    const interviewHistory = document.getElementById('interviewHistory');
    
    if (typeof Skeleton !== 'undefined') {
        if (resumeHistory) resumeHistory.innerHTML = Skeleton.tableRows(3);
        if (interviewHistory) interviewHistory.innerHTML = Skeleton.tableRows(3);
    } else {
        const skeletonHTML = '<div class="skeleton" style="height: 20px; margin-bottom: 10px;"></div>'.repeat(3);
        if (resumeHistory) resumeHistory.innerHTML = skeletonHTML;
        if (interviewHistory) interviewHistory.innerHTML = skeletonHTML;
    }
}

// Remove skeleton loaders
function hideSkeletonLoaders() {
    const skeletons = document.querySelectorAll('.skeleton');
    skeletons.forEach(el => {
        el.classList.remove('skeleton');
        el.style.minWidth = '';
    });
}

async function loadDashboardData() {
    try {
        const dashboard = await apiClient.getDashboard();
        const user = dashboard.user;
        const stats = dashboard.stats;

        // Handle Guest vs Regular User display
        const guestBanner = document.getElementById('guestBanner');
        const profileContent = document.getElementById('profileContent');
        const avatarBadge = document.getElementById('avatarBadge');
        const verifiedBadge = document.getElementById('verifiedBadge');

        if (user.isGuest) {
            // Show guest banner
            guestBanner.style.display = 'flex';
            profileContent.classList.add('guest-mode');
            avatarBadge.style.display = 'none';
            verifiedBadge.style.display = 'none';
        } else {
            guestBanner.style.display = 'none';
            profileContent.classList.remove('guest-mode');
            
            // Show Google badge if Google user
            if (user.isGoogleUser) {
                avatarBadge.style.display = 'flex';
                verifiedBadge.style.display = 'inline-flex';
            } else {
                avatarBadge.style.display = 'none';
                verifiedBadge.style.display = 'none';
            }
        }

        // Update basic user info
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userEmail').textContent = user.email;

        // Update role and experience
        const roleEl = document.getElementById('userRole');
        const expEl = document.getElementById('userExperience');
        const locationEl = document.getElementById('userLocation');

        if (user.techRole) {
            roleEl.querySelector('.meta-value').textContent = formatTechRole(user.techRole);
            roleEl.style.display = 'inline-flex';
        } else {
            roleEl.querySelector('.meta-value').textContent = 'Not Set';
        }

        if (user.experienceLevel) {
            expEl.querySelector('.meta-value').textContent = formatExperienceLevel(user.experienceLevel);
            expEl.style.display = 'inline-flex';
        } else {
            expEl.querySelector('.meta-value').textContent = 'Not Set';
        }

        if (user.location) {
            locationEl.querySelector('.meta-value').textContent = user.location;
            locationEl.style.display = 'inline-flex';
        }

        // Update bio
        const bioEl = document.getElementById('userBio');
        if (user.bio) {
            bioEl.textContent = user.bio;
            bioEl.style.display = 'block';
        }

        // Update profile picture
        const profilePic = document.getElementById('profilePic');
        if (user.profilePictureUrl) {
            profilePic.src = user.profilePictureUrl;
        } else {
            // Generate avatar from initials
            profilePic.src = generateAvatarUrl(user.name || 'U');
        }

        // Update skills tags
        const tagsContainer = document.getElementById('profileTags');
        if (user.skills) {
            const skills = user.skills.split(',').map(s => s.trim()).filter(s => s);
            tagsContainer.innerHTML = skills.slice(0, 5).map(skill => 
                `<span class="skill-tag">${skill}</span>`
            ).join('');
            if (skills.length > 5) {
                tagsContainer.innerHTML += `<span class="skill-tag more">+${skills.length - 5} more</span>`;
            }
        } else {
            tagsContainer.innerHTML = '<span class="skill-tag placeholder">Add your skills</span>';
        }

        // Update profile stats
        document.getElementById('resumeCount').textContent = user.totalResumesAnalyzed || 0;
        document.getElementById('interviewCount').textContent = user.totalInterviewsSessions || 0;
        
        if (user.createdAt) {
            const memberDate = new Date(user.createdAt);
            document.getElementById('memberSince').textContent = memberDate.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
        }

        // Update social links
        updateSocialLinks(user);

        // Store user data for edit modal
        window.currentUserData = user;

        // Remove skeleton loaders after data is populated
        hideSkeletonLoaders();

        await loadResumeHistory();
        await loadInterviewHistory();
        await loadProgressCharts();
        await loadAchievements();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideSkeletonLoaders();
        showError('Error loading dashboard data');
    }
}

function formatTechRole(role) {
    const roleMap = {
        'backend': 'Backend Developer',
        'frontend': 'Frontend Developer',
        'fullstack': 'Full Stack Developer',
        'data-scientist': 'Data Scientist',
        'devops': 'DevOps Engineer',
        'mobile': 'Mobile Developer',
        'ml-engineer': 'ML Engineer',
        'cloud-architect': 'Cloud Architect',
        'security': 'Security Engineer',
        'qa': 'QA Engineer'
    };
    return roleMap[role] || role;
}

function formatExperienceLevel(level) {
    const levelMap = {
        'fresher': 'Fresher (0-1 yrs)',
        'junior': 'Junior (1-3 yrs)',
        'mid': 'Mid-Level (3-5 yrs)',
        'senior': 'Senior (5-8 yrs)',
        'lead': 'Lead (8+ yrs)',
        'principal': 'Principal/Staff'
    };
    return levelMap[level] || level;
}

function generateAvatarUrl(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['667eea', '764ba2', '00d4aa', 'ff6b6b', 'ffa726', '26c6da'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff&size=100&font-size=0.4&bold=true`;
}

function updateSocialLinks(user) {
    const linksContainer = document.getElementById('profileLinks');
    const linkedInLink = document.getElementById('linkedInLink');
    const gitHubLink = document.getElementById('gitHubLink');
    const portfolioLink = document.getElementById('portfolioLink');

    let hasLinks = false;

    if (user.linkedInUrl) {
        linkedInLink.href = user.linkedInUrl;
        linkedInLink.style.display = 'inline-flex';
        hasLinks = true;
    } else {
        linkedInLink.style.display = 'none';
    }

    if (user.githubUrl) {
        gitHubLink.href = user.githubUrl;
        gitHubLink.style.display = 'inline-flex';
        hasLinks = true;
    } else {
        gitHubLink.style.display = 'none';
    }

    if (user.portfolioUrl) {
        portfolioLink.href = user.portfolioUrl;
        portfolioLink.style.display = 'inline-flex';
        hasLinks = true;
    } else {
        portfolioLink.style.display = 'none';
    }

    linksContainer.style.display = hasLinks ? 'flex' : 'none';
}

async function loadProgressCharts() {
    try {
        const progressData = await apiClient.getProgressData();
        
        // Render Resume Chart
        renderResumeChart(progressData.resumeScores || []);
        
        // Render Interview Chart
        renderInterviewChart(progressData.interviewScores || []);
        
        // Update trends
        updateTrendBadges(progressData.trends || {});
        
        // Display feedback themes
        displayFeedbackThemes(progressData.feedbackThemes || []);
    } catch (error) {
        console.error('Error loading progress charts:', error);
    }
}

function renderResumeChart(data) {
    const ctx = document.getElementById('resumeChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (resumeChartInstance) {
        resumeChartInstance.destroy();
    }
    
    if (data.length === 0) {
        ctx.parentElement.innerHTML += '<p class="empty-message" style="text-align:center;margin-top:20px;">No resume data yet. Analyze your first resume!</p>';
        return;
    }
    
    resumeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'ATS Score',
                data: data.map(d => d.score),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return data[context.dataIndex].jobRole || '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderInterviewChart(data) {
    const ctx = document.getElementById('interviewChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (interviewChartInstance) {
        interviewChartInstance.destroy();
    }
    
    if (data.length === 0) {
        ctx.parentElement.innerHTML += '<p class="empty-message" style="text-align:center;margin-top:20px;">No interview data yet. Complete your first interview!</p>';
        return;
    }
    
    interviewChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Interview Score',
                data: data.map(d => d.score),
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#764ba2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function updateTrendBadges(trends) {
    const resumeTrendEl = document.getElementById('resumeTrend');
    const interviewTrendEl = document.getElementById('interviewTrend');
    
    if (resumeTrendEl) {
        const direction = trends.resumeTrendDirection || 'insufficient_data';
        const value = trends.resumeTrend || 0;
        resumeTrendEl.className = `trend-badge ${direction}`;
        if (direction === 'improving') {
            resumeTrendEl.textContent = `↑ +${value}%`;
        } else if (direction === 'declining') {
            resumeTrendEl.textContent = `↓ ${value}%`;
        } else if (direction === 'stable') {
            resumeTrendEl.textContent = '→ Stable';
        } else {
            resumeTrendEl.textContent = 'Need more data';
        }
    }
    
    if (interviewTrendEl) {
        const direction = trends.interviewTrendDirection || 'insufficient_data';
        const value = trends.interviewTrend || 0;
        interviewTrendEl.className = `trend-badge ${direction}`;
        if (direction === 'improving') {
            interviewTrendEl.textContent = `↑ +${value}%`;
        } else if (direction === 'declining') {
            interviewTrendEl.textContent = `↓ ${value}%`;
        } else if (direction === 'stable') {
            interviewTrendEl.textContent = '→ Stable';
        } else {
            interviewTrendEl.textContent = 'Need more data';
        }
    }
}

function displayFeedbackThemes(themes) {
    const container = document.getElementById('feedbackThemes');
    if (!container) return;
    
    if (themes.length === 0) {
        container.innerHTML = '<p class="empty-message">Complete more sessions to see feedback themes</p>';
        return;
    }
    
    container.innerHTML = themes.map(theme => 
        `<span class="theme-item">${theme}</span>`
    ).join('');
}

async function loadResumeHistory() {
    try {
        const resumes = await apiClient.getResumeHistory();
        const historyDiv = document.getElementById('resumeHistory');

        if (resumes.length === 0) {
            historyDiv.innerHTML = '<p class="empty-message">No resumes analyzed yet</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Job Role</th>
                        <th>ATS Score</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        resumes.forEach(resume => {
            const date = new Date(resume.createdAt).toLocaleDateString();
            const scoreClass = resume.atsScore >= 85 ? 'high' : resume.atsScore >= 70 ? 'medium' : 'low';
            
            html += `
                <tr>
                    <td><strong>${resume.jobRole}</strong></td>
                    <td><span class="score-badge ${scoreClass}">${resume.atsScore}%</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewResumeAnalysis(${resume.id})">View Analysis</button>
                        <button class="btn btn-secondary btn-sm" style="margin-left: 5px;" onclick="viewAndDownloadResumePDF(${resume.id})">Download PDF</button>
                        <button class="btn btn-secondary btn-sm" style="margin-left: 5px; background: #dc3545;" onclick="deleteResume(${resume.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historyDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading resume history:', error);
    }
}

async function loadInterviewHistory() {
    try {
        const interviews = await apiClient.getInterviewHistory();
        const historyDiv = document.getElementById('interviewHistory');

        if (interviews.length === 0) {
            historyDiv.innerHTML = '<p class="empty-message">No interviews conducted yet</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        interviews.forEach(interview => {
            const date = new Date(interview.startTime).toLocaleDateString();
            const duration = interview.durationMinutes || 0;
            const scoreClass = interview.score >= 85 ? 'high' : interview.score >= 70 ? 'medium' : 'low';

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${duration} min</td>
                    <td><span class="score-badge ${scoreClass}">${interview.score}%</span></td>
                    <td><span class="status-badge ${interview.status.toLowerCase()}">${interview.status}</span></td>
                    <td>
                        ${interview.status === 'COMPLETED' ?
                            `<button class="btn btn-secondary" onclick="viewInterviewReport(${interview.id})">View Report</button>
                             <button class="btn btn-secondary" style="margin-left: 5px;" onclick="viewAndDownloadInterviewPDF(${interview.id})">Download PDF</button>` :
                            '<em>Pending</em>'
                        }
                        <button class="btn btn-secondary" style="margin-left: 5px; background: #dc3545;" onclick="deleteInterview(${interview.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historyDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading interview history:', error);
    }
}

async function deleteResume(resumeId) {
    if (!confirm('Are you sure you want to delete this resume?')) {
        return;
    }

    try {
        await apiClient.deleteResume(resumeId);
        showSuccess('Resume deleted successfully');
        loadResumeHistory();
    } catch (error) {
        console.error('Error deleting resume:', error);
        showError('Error deleting resume');
    }
}

async function deleteInterview(sessionId) {
    if (!confirm('Are you sure you want to delete this interview session?')) {
        return;
    }

    try {
        await apiClient.deleteInterview(sessionId);
        showSuccess('Interview deleted successfully');
        loadInterviewHistory();
        loadDashboardData(); // Refresh stats
    } catch (error) {
        console.error('Error deleting interview:', error);
        showError('Error deleting interview');
    }
}

function editProfile() {
    const modal = document.getElementById('editProfileModal');
    const user = window.currentUserData || {};

    // Populate basic info
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editAge').value = user.age || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editLocation').value = user.location || '';

    // Populate professional info
    document.getElementById('editTechRole').value = user.techRole || '';
    document.getElementById('editExperience').value = user.experienceLevel || '';
    document.getElementById('editSkills').value = user.skills || '';

    // Populate social links
    document.getElementById('editLinkedIn').value = user.linkedInUrl || '';
    document.getElementById('editGitHub').value = user.githubUrl || '';
    document.getElementById('editPortfolio').value = user.portfolioUrl || '';

    // Populate bio
    document.getElementById('editBio').value = user.bio || '';

    modal.style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function saveProfile(event) {
    event.preventDefault();

    const userData = {
        name: document.getElementById('editName').value,
        age: parseInt(document.getElementById('editAge').value) || null,
        phone: document.getElementById('editPhone').value || null,
        location: document.getElementById('editLocation').value || null,
        techRole: document.getElementById('editTechRole').value || null,
        experienceLevel: document.getElementById('editExperience').value || null,
        skills: document.getElementById('editSkills').value || null,
        linkedInUrl: document.getElementById('editLinkedIn').value || null,
        githubUrl: document.getElementById('editGitHub').value || null,
        portfolioUrl: document.getElementById('editPortfolio').value || null,
        bio: document.getElementById('editBio').value || null
    };

    try {
        const saveBtn = document.querySelector('#editProfileForm button[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Saving...';

        await apiClient.updateProfile(userData);
        showSuccess('Profile updated successfully');
        closeEditModal();
        loadDashboardData();
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Error updating profile');
    } finally {
        const saveBtn = document.querySelector('#editProfileForm button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '💾 Save Changes';
        }
    }
}

function refreshHistory() {
    loadResumeHistory();
    loadInterviewHistory();
}

async function viewInterviewReport(sessionId) {
    try {
        const section = document.getElementById('interviewReportSection');
        const contentDiv = document.getElementById('inlineInterviewReportContent');

        section.style.display = 'block';
        contentDiv.innerHTML = '<div class="loading-spinner"></div><p style="text-align:center;">Loading report...</p>';
        section.scrollIntoView({ behavior: 'smooth' });

        const report = await apiClient.getInterviewReport(sessionId);
        currentInterviewReport = report;
        displayInlineInterviewReport(report);
    } catch (error) {
        console.error('Error loading interview report:', error);
        const contentDiv = document.getElementById('inlineInterviewReportContent');
        contentDiv.innerHTML = '<p class="error-message">Error loading report. Please try again.</p>';
    }
}

function closeInlineInterviewReport() {
    document.getElementById('interviewReportSection').style.display = 'none';
}

function displayInlineInterviewReport(report) {
    const contentDiv = document.getElementById('inlineInterviewReportContent');
    const scoreClass = (report.totalScore || 0) >= 85 ? 'high' : (report.totalScore || 0) >= 70 ? 'medium' : 'low';

    let html = `
        <div class="analysis-header">
            <div class="score-display ${scoreClass}">
                <div class="score-circle-large">${report.totalScore || 0}%</div>
                <div class="score-label">Overall Score</div>
            </div>
            <div class="analysis-info">
                <h3>${report.jobRole || 'Technical Interview'}</h3>
                <p class="strength-text">${report.performanceTier || 'Assessment Complete'}</p>
                <p style="font-size:13px; color: var(--text-secondary);">${report.interviewReadinessLevel || ''}</p>
            </div>
        </div>

        <div class="analysis-grid">
            <div class="analysis-card">
                <h4>📊 Performance Breakdown</h4>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span>Basic Questions</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.basicQuestionsScore || 0}%"></div></div>
                        <span>${report.basicQuestionsScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Intermediate</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.intermediateQuestionsScore || 0}%"></div></div>
                        <span>${report.intermediateQuestionsScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Advanced</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.advancedQuestionsScore || 0}%"></div></div>
                        <span>${report.advancedQuestionsScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Technical</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.technicalScore || 0}%"></div></div>
                        <span>${report.technicalScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Behavioral</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.behavioralScore || 0}%"></div></div>
                        <span>${report.behavioralScore || 0}%</span>
                    </div>
                </div>
            </div>

            <div class="analysis-card">
                <h4>📈 Statistics</h4>
                <div class="score-breakdown">
                    <div class="score-item"><span>Questions Asked</span><span>${report.totalQuestionsAsked || 0}</span></div>
                    <div class="score-item"><span>Strong Answers (80%+)</span><span>${report.correctAnswers || 0}</span></div>
                    <div class="score-item"><span>Partial Answers</span><span>${report.partialAnswers || 0}</span></div>
                    <div class="score-item"><span>Weak Answers</span><span>${report.incorrectAnswers || 0}</span></div>
                    <div class="score-item"><span>Duration</span><span>${report.durationMinutes || 0} min</span></div>
                </div>
            </div>
        </div>
    `;

    // Body Language section
    if (report.eyeContactPercentage != null || report.faceCenteringScore != null) {
        html += `
        <div class="analysis-grid">
            <div class="analysis-card">
                <h4>📷 Body Language Analysis</h4>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span>Eye Contact</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.eyeContactPercentage || 0}%"></div></div>
                        <span>${report.eyeContactPercentage || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Face Centering</span>
                        <div class="progress-bar-mini"><div class="fill" style="width: ${report.faceCenteringScore || 0}%"></div></div>
                        <span>${report.faceCenteringScore || 0}%</span>
                    </div>
                </div>
                ${report.bodyLanguageFeedback ? `<p style="margin-top:12px; font-size:14px; line-height:1.6;">${report.bodyLanguageFeedback}</p>` : ''}
            </div>

            <div class="analysis-card">
                <h4>💡 Body Language Tips</h4>
                <ul style="padding-left: 18px; margin: 0;">
                    ${(report.bodyLanguageTips || []).map(tip => `<li style="margin-bottom: 6px; font-size: 14px;">${tip}</li>`).join('')}
                </ul>
            </div>
        </div>
        `;
    }

    // Strengths & Improvements
    html += `
        <div class="analysis-grid">
            <div class="analysis-card">
                <h4>✅ Strength Areas</h4>
                <ul style="padding-left: 18px; margin: 0;">
                    ${(report.strengthAreas || []).map(s => `<li style="margin-bottom: 6px; font-size: 14px;">${s}</li>`).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h4>📌 Areas for Improvement</h4>
                <ul style="padding-left: 18px; margin: 0;">
                    ${(report.improvementAreas || []).map(s => `<li style="margin-bottom: 6px; font-size: 14px;">${s}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="analysis-grid">
            <div class="analysis-card">
                <h4>🎯 Recommendations</h4>
                <ul style="padding-left: 18px; margin: 0;">
                    ${(report.actionableRecommendations || []).map(s => `<li style="margin-bottom: 6px; font-size: 14px;">${s}</li>`).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h4>⚠️ Skill Gaps</h4>
                <ul style="padding-left: 18px; margin: 0;">
                    ${(report.skillGapsIdentified || ['No significant gaps identified']).map(s => `<li style="margin-bottom: 6px; font-size: 14px;">${s}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    // Overall feedback
    if (report.overallFeedback) {
        html += `
        <div class="analysis-card" style="margin-top: 15px;">
            <h4>📊 Overall Feedback</h4>
            <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.6; margin:0;">${report.overallFeedback}</pre>
        </div>
        `;
    }

    contentDiv.innerHTML = html;
}

async function viewResumeAnalysis(resumeId) {
    try {
        // Show loading in inline section
        const analysisSection = document.getElementById('resumeAnalysisSection');
        const contentDiv = document.getElementById('inlineAnalysisContent');
        
        analysisSection.style.display = 'block';
        contentDiv.innerHTML = '<div class="loading-spinner"></div><p style="text-align:center;">Loading analysis...</p>';
        
        // Scroll to analysis section
        analysisSection.scrollIntoView({ behavior: 'smooth' });
        
        const analysis = await apiClient.getResumeAnalysis(resumeId);
        currentResumeAnalysis = analysis;
        displayResumeAnalysis(analysis);
    } catch (error) {
        console.error('Error loading resume analysis:', error);
        const contentDiv = document.getElementById('inlineAnalysisContent');
        contentDiv.innerHTML = '<p class="error-message">Error loading analysis. Please try again.</p>';
    }
}

function displayResumeAnalysis(analysis) {
    const contentDiv = document.getElementById('inlineAnalysisContent');

    const scoreClass = analysis.atsScore >= 85 ? 'high' : analysis.atsScore >= 70 ? 'medium' : 'low';

    let html = `
        <div class="analysis-header">
            <div class="score-display ${scoreClass}">
                <div class="score-circle-large">${analysis.atsScore}%</div>
                <div class="score-label">ATS Score</div>
            </div>
            <div class="analysis-info">
                <h3>${analysis.jobRole || 'General'}</h3>
                <p class="strength-text">${analysis.resumeStrength || 'Analysis Complete'}</p>
            </div>
        </div>

        <div class="analysis-grid">
            <!-- Score Breakdown -->
            <div class="analysis-card">
                <h4>📊 Score Breakdown</h4>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span>Keyword Match</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.keywordMatchPercentage || 0}%"></div>
                        </div>
                        <span>${analysis.keywordMatchPercentage || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Structure</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.structureScore || 0}%"></div>
                        </div>
                        <span>${analysis.structureScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Experience</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.experienceScore || 0}%"></div>
                        </div>
                        <span>${analysis.experienceScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Soft Skills</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.softSkillsScore || 0}%"></div>
                        </div>
                        <span>${analysis.softSkillsScore || 0}%</span>
                    </div>
                </div>
            </div>

            <!-- ATS Compatibility Breakdown -->
            <div class="analysis-card">
                <h4>🤖 ATS Compatibility</h4>
                <div class="score-breakdown">
                    <div class="score-item">
                        <span>Formatting</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.formattingScore || 0}%"></div>
                        </div>
                        <span>${analysis.formattingScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Parsability</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.parsabilityScore || 0}%"></div>
                        </div>
                        <span>${analysis.parsabilityScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Contact Info</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.contactInfoScore || 0}%"></div>
                        </div>
                        <span>${analysis.contactInfoScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Section Org</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.sectionOrganizationScore || 0}%"></div>
                        </div>
                        <span>${analysis.sectionOrganizationScore || 0}%</span>
                    </div>
                    <div class="score-item">
                        <span>Keyword Density</span>
                        <div class="progress-bar-mini">
                            <div class="fill" style="width: ${analysis.keywordDensityScore || 0}%"></div>
                        </div>
                        <span>${analysis.keywordDensityScore || 0}%</span>
                    </div>
                </div>
            </div>

            <!-- Top Matched Skills -->
            <div class="analysis-card">
                <h4>✅ Top Matched Skills</h4>
                <div class="keyword-tags matched">
                    ${(analysis.topMatchedSkills || []).map(k => `<span class="tag">${k}</span>`).join('')}
                    ${(!analysis.topMatchedSkills || analysis.topMatchedSkills.length === 0) ? '<p class="empty-text">No skills matched</p>' : ''}
                </div>
            </div>

            <!-- Critical Missing Skills -->
            <div class="analysis-card">
                <h4>🔴 Critical Missing Skills</h4>
                <div class="keyword-tags missing">
                    ${(analysis.criticalMissingSkills || []).map(k => `<span class="tag">${k}</span>`).join('')}
                    ${(!analysis.criticalMissingSkills || analysis.criticalMissingSkills.length === 0) ? '<p class="empty-text">No critical gaps</p>' : ''}
                </div>
            </div>

            <!-- Matched Keywords -->
            <div class="analysis-card">
                <h4>✅ All Matched Keywords</h4>
                <div class="keyword-tags matched">
                    ${(analysis.matchedKeywords || []).map(k => `<span class="tag">${k}</span>`).join('')}
                    ${(!analysis.matchedKeywords || analysis.matchedKeywords.length === 0) ? '<p class="empty-text">No keywords matched</p>' : ''}
                </div>
            </div>

            <!-- Missing Keywords -->
            <div class="analysis-card">
                <h4>❌ Missing Keywords</h4>
                <div class="keyword-tags missing">
                    ${(analysis.missingKeywords || []).map(k => `<span class="tag">${k}</span>`).join('')}
                    ${(!analysis.missingKeywords || analysis.missingKeywords.length === 0) ? '<p class="empty-text">No critical missing keywords</p>' : ''}
                </div>
            </div>

            <!-- Skill Gaps -->
            <div class="analysis-card">
                <h4>⚠️ Skill Gaps</h4>
                <ul class="suggestion-list">
                    ${(analysis.skillGaps || []).map(gap => `<li>${gap}</li>`).join('')}
                    ${(!analysis.skillGaps || analysis.skillGaps.length === 0) ? '<li>No significant skill gaps identified</li>' : ''}
                </ul>
            </div>

            <!-- ATS Issues -->
            <div class="analysis-card">
                <h4>⚠️ ATS Issues</h4>
                <ul class="suggestion-list">
                    ${(analysis.atsIssues || []).map(issue => `<li>${issue}</li>`).join('')}
                    ${(!analysis.atsIssues || analysis.atsIssues.length === 0) ? '<li style="color: #4caf50;">No ATS issues detected</li>' : ''}
                </ul>
            </div>
        </div>

        <!-- ATS Tips -->
        ${(analysis.atsTips && analysis.atsTips.length > 0) ? `
        <div class="analysis-card suggestions-card">
            <h4>💡 ATS Optimization Tips</h4>
            <div class="suggestions-content">
                ${analysis.atsTips.map(t => `<div class="suggestion-item">${t}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Suggestions -->
        <div class="analysis-card suggestions-card">
            <h4>💡 Improvement Suggestions</h4>
            <div class="suggestions-content">
                ${(analysis.suggestions || []).map(s => `<div class="suggestion-item">${s}</div>`).join('')}
                ${(!analysis.suggestions || analysis.suggestions.length === 0) ? '<p>No specific suggestions at this time.</p>' : ''}
            </div>
        </div>

        <!-- Overall Feedback -->
        <div class="analysis-card feedback-card">
            <h4>📝 Overall Feedback</h4>
            <pre class="feedback-text">${analysis.overallFeedback || 'Great resume! Keep improving based on the suggestions above.'}</pre>
        </div>

        <!-- Competitive Analysis -->
        ${analysis.competitiveAnalysis ? `
        <div class="analysis-card competitive-card">
            <h4>🏆 Competitive Analysis</h4>
            <p>${analysis.competitiveAnalysis}</p>
        </div>
        ` : ''}
    `;

    contentDiv.innerHTML = html;
}

function closeInlineAnalysis() {
    document.getElementById('resumeAnalysisSection').style.display = 'none';
}

function closeAnalysisModal() {
    document.getElementById('resumeAnalysisModal').style.display = 'none';
}

function showError(message) {
    Toast.error(message);
}

function showSuccess(message) {
    Toast.success(message);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const editModal = document.getElementById('editProfileModal');
    if (event.target === editModal) {
        closeEditModal();
    }
};

// ==================== Achievements Functions ====================

// All possible achievements for display
const ALL_ACHIEVEMENTS = [
    { code: 'FIRST_RESUME', title: 'First Steps', description: 'Analyzed your first resume', icon: '📄', category: 'RESUME' },
    { code: 'RESUME_MASTER', title: 'Resume Master', description: 'Analyzed 5 resumes', icon: '📚', category: 'RESUME' },
    { code: 'RESUME_EXPERT', title: 'Resume Expert', description: 'Achieved 80%+ ATS score', icon: '🎯', category: 'RESUME' },
    { code: 'FIRST_INTERVIEW', title: 'Interview Ready', description: 'Completed your first interview', icon: '🎤', category: 'INTERVIEW' },
    { code: 'INTERVIEW_PRO', title: 'Interview Pro', description: 'Completed 5 interviews', icon: '🎙️', category: 'INTERVIEW' },
    { code: 'INTERVIEW_MASTER', title: 'Interview Master', description: 'Completed 10 interviews', icon: '🏅', category: 'INTERVIEW' },
    { code: 'HIGH_SCORER', title: 'High Scorer', description: 'Scored 80%+ in an interview', icon: '⭐', category: 'INTERVIEW' },
    { code: 'PERFECT_SCORE', title: 'Perfect Score', description: 'Achieved a perfect interview score', icon: '💯', category: 'INTERVIEW' },
    { code: 'OUTSTANDING_PERFORMANCE', title: 'Outstanding', description: 'Scored 90%+ in an interview', icon: '🏆', category: 'INTERVIEW' },
    { code: 'STRONG_PERFORMER', title: 'Strong Performer', description: 'Scored 70%+ in an interview', icon: '💪', category: 'INTERVIEW' },
    { code: 'QUICK_THINKER', title: 'Quick Thinker', description: 'Completed interview in under 20 min', icon: '⚡', category: 'INTERVIEW' },
    { code: 'PROFILE_COMPLETED', title: 'Profile Complete', description: 'Filled out your profile', icon: '✅', category: 'PROFILE' },
    { code: 'GOOGLE_CONNECTED', title: 'Google Connected', description: 'Linked your Google account', icon: '🔗', category: 'PROFILE' },
    { code: 'ALL_ROUNDER', title: 'All-Rounder', description: 'Used both resume and interview features', icon: '🌟', category: 'MILESTONE' },
    { code: 'EARLY_BIRD', title: 'Early Bird', description: 'One of the first users', icon: '🐦', category: 'MILESTONE' }
];

async function loadAchievements() {
    try {
        const response = await apiClient.getAchievements();
        const userAchievements = response.achievements || [];
        const stats = response.stats || { earned: 0, total: 15 };
        
        // Update stats
        document.getElementById('unlockedCount').textContent = stats.earned || 0;
        document.getElementById('totalCount').textContent = stats.total || 15;
        
        // Update progress bar
        const progressPercent = stats.total > 0 ? (stats.earned / stats.total) * 100 : 0;
        document.getElementById('achievementProgressBar').style.width = `${progressPercent}%`;
        
        // Render achievements grid
        renderAchievementsGrid(userAchievements);
    } catch (error) {
        console.error('Error loading achievements:', error);
        renderAchievementsGrid([]);
    }
}

function renderAchievementsGrid(userAchievements) {
    const grid = document.getElementById('achievementsGrid');
    
    // Create a map of unlocked achievements (only those with earned: true)
    const unlockedMap = new Map();
    userAchievements.forEach(achievement => {
        if (achievement.earned) {
            unlockedMap.set(achievement.code, achievement);
        }
    });
    
    // Render all achievements (unlocked and locked)
    let html = '';
    
    ALL_ACHIEVEMENTS.forEach(achievement => {
        const unlocked = unlockedMap.has(achievement.code);
        const unlockedData = unlockedMap.get(achievement.code);
        
        html += `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-info">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                    ${unlocked && unlockedData.earnedAt ? `
                        <div class="achievement-date">
                            <span>🎉</span> Earned ${formatAchievementDate(unlockedData.earnedAt)}
                        </div>
                    ` : ''}
                    <span class="achievement-category">${achievement.category}</span>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function formatAchievementDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ==================== PDF Generation Helpers ====================

function pdfHelpers(pdf, margin, contentWidth, pageHeight) {
    let yPos = 20;

    function checkPage(needed) {
        if (yPos + needed > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
        }
    }

    function sectionHeader(title, color) {
        checkPage(18);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPos);
        yPos += 2;
        pdf.setDrawColor(...color);
        pdf.setLineWidth(0.8);
        pdf.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 7;
    }

    function drawProgressBar(label, value) {
        checkPage(12);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text(label, margin, yPos);
        const barX = margin + 55;
        const barWidth = 80;
        const barHeight = 5;
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(barX, yPos - 4, barWidth, barHeight, 2, 2, 'F');
        const fillWidth = (value / 100) * barWidth;
        const fillColor = value >= 70 ? [76, 175, 80] : value >= 50 ? [255, 152, 0] : [244, 67, 54];
        pdf.setFillColor(...fillColor);
        if (fillWidth > 0) {
            pdf.roundedRect(barX, yPos - 4, fillWidth, barHeight, 2, 2, 'F');
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...fillColor);
        pdf.text(`${value}%`, barX + barWidth + 4, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 9;
    }

    function renderList(items, color) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...color);
        const safeItems = (items || []).filter(item => item != null && String(item).trim() !== '');
        safeItems.forEach((item, i) => {
            const lines = pdf.splitTextToSize(`${i + 1}. ${item}`, contentWidth - 5);
            lines.forEach(line => {
                checkPage(5);
                pdf.text(line, margin + 3, yPos);
                yPos += 5;
            });
            yPos += 1;
        });
        yPos += 3;
    }

    function renderBulletList(items, color) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...color);
        const safeItems = (items || []).filter(item => item != null && String(item).trim() !== '');
        safeItems.forEach(item => {
            const lines = pdf.splitTextToSize(`  \u2022  ${item}`, contentWidth - 5);
            lines.forEach(line => {
                checkPage(5);
                pdf.text(line, margin + 3, yPos);
                yPos += 5;
            });
        });
        yPos += 3;
    }

    function renderText(text, color) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text || '', contentWidth);
        lines.forEach(line => {
            checkPage(5);
            pdf.text(line, margin, yPos);
            yPos += 5;
        });
        yPos += 3;
    }

    function addFooters() {
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
            pdf.text(
                `Generated by ResuMentor AI  |  ${new Date().toLocaleDateString()}  |  Page ${i} of ${pageCount}`,
                pageWidth / 2, pageHeight - 8, { align: 'center' }
            );
        }
    }

    return {
        get yPos() { return yPos; },
        set yPos(v) { yPos = v; },
        checkPage, sectionHeader, drawProgressBar, renderList, renderBulletList, renderText, addFooters
    };
}

// ==================== Resume Analysis PDF Download ====================

function downloadResumePDF() {
    if (!currentResumeAnalysis) {
        Toast.error('No analysis data available');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const data = currentResumeAnalysis;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 16;
        const contentWidth = pageWidth - 2 * margin;
        let y = 0;

        // Color palette
        const C = {
            primary: [79, 70, 229], secondary: [124, 58, 237],
            success: [16, 185, 129], danger: [239, 68, 68],
            warning: [245, 158, 11], info: [59, 130, 246],
            dark: [30, 41, 59], muted: [100, 116, 139],
            light: [241, 245, 249], white: [255, 255, 255],
            barBg: [226, 232, 240],
        };

        const score = data.atsScore || 0;
        const tierLabel = score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work';
        const tierColor = score >= 85 ? C.success : score >= 70 ? C.info : score >= 55 ? C.warning : score >= 40 ? [249, 115, 22] : C.danger;

        function needsPage(needed) { if (y + needed > pageHeight - 18) { pdf.addPage(); y = 16; } }

        function drawSectionTitle(title, iconColor) {
            needsPage(14); y += 4;
            pdf.setFillColor(...iconColor);
            pdf.roundedRect(margin, y - 4.5, 3, 7, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(...C.dark);
            pdf.text(title, margin + 7, y); y += 3;
            pdf.setDrawColor(...C.barBg); pdf.setLineWidth(0.4);
            pdf.line(margin, y, margin + contentWidth, y); y += 6;
        }

        function drawProgressRow(label, value, barW) {
            needsPage(10); const bw = barW || 90; const barH = 4.5; const labelWidth = 48;
            const barX = margin + labelWidth;
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...C.dark);
            pdf.text(label, margin + 2, y);
            pdf.setFillColor(...C.barBg); pdf.roundedRect(barX, y - 3.5, bw, barH, 2, 2, 'F');
            const fillW = Math.max(0, (value / 100) * bw);
            const barColor = value >= 70 ? C.success : value >= 50 ? C.warning : C.danger;
            pdf.setFillColor(...barColor); if (fillW > 0) pdf.roundedRect(barX, y - 3.5, fillW, barH, 2, 2, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...barColor);
            pdf.text(`${value}%`, barX + bw + 3, y); y += 8;
        }

        function drawKeywordTags(items, color, bgColor) {
            if (!items || items.length === 0) return;
            const safe = items.filter(i => i != null && String(i).trim() !== '');
            let xPos = margin + 2; const tagH = 6; const tagPad = 3; const tagGap = 2.5;
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            safe.forEach(item => {
                const text = String(item).trim(); const tw = pdf.getTextWidth(text) + tagPad * 2;
                if (xPos + tw > margin + contentWidth - 2) { xPos = margin + 2; y += tagH + 2; needsPage(tagH + 4); }
                pdf.setFillColor(...bgColor); pdf.roundedRect(xPos, y - 4, tw, tagH, 2, 2, 'F');
                pdf.setTextColor(...color); pdf.text(text, xPos + tagPad, y - 0.5);
                xPos += tw + tagGap;
            }); y += tagH + 2;
        }

        function drawNumberedList(items, textColor) {
            if (!items || items.length === 0) return;
            const safe = items.filter(i => i != null && String(i).trim() !== '');
            safe.forEach((item, i) => {
                needsPage(6);
                pdf.setFillColor(...C.light); pdf.circle(margin + 5, y - 1.5, 3, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...C.primary);
                pdf.text(`${i + 1}`, margin + 5, y - 0.5, { align: 'center' });
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...textColor);
                const lines = pdf.splitTextToSize(String(item), contentWidth - 14);
                lines.forEach((line, li) => { if (li > 0) needsPage(4.5); pdf.text(line, margin + 10, y); y += 4.5; });
                y += 1.5;
            }); y += 2;
        }

        function drawParagraph(text, textColor) {
            if (!text) return;
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...textColor);
            const lines = pdf.splitTextToSize(String(text), contentWidth - 4);
            lines.forEach(line => { needsPage(4.5); pdf.text(line, margin + 2, y); y += 4.5; }); y += 3;
        }

        function getScoreInterpretation(s) {
            if (s >= 85) return 'Your resume is ATS-friendly and exceptionally well-optimized. You have a strong match for this position.';
            if (s >= 70) return 'Your resume has most required keywords and good formatting. Minor improvements can significantly boost visibility.';
            if (s >= 55) return 'Your resume meets basic requirements but could be improved. Focus on adding more relevant keywords.';
            if (s >= 40) return 'Your resume needs improvements to compete effectively. Review suggestions and skill gaps.';
            return 'Your resume requires significant improvements. Focus on acquiring missing skills and restructuring.';
        }

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // ── HEADER ──
        pdf.setFillColor(...C.primary); pdf.rect(0, 0, pageWidth, 52, 'F');
        pdf.setFillColor(...C.secondary); pdf.rect(0, 48, pageWidth, 4, 'F');
        pdf.setTextColor(...C.white); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22);
        pdf.text('ATS Resume Analysis Report', pageWidth / 2, 15, { align: 'center' });
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
        pdf.text('Powered by ResuMentor AI', pageWidth / 2, 22, { align: 'center' });
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(36);
        pdf.text(`${score}`, pageWidth / 2, 37, { align: 'center' });
        pdf.setFontSize(11);
        pdf.text(`/ 100`, pageWidth / 2 + pdf.getTextWidth(`${score}`) / 2 + 3, 37);
        pdf.setFontSize(10); pdf.text(tierLabel.toUpperCase(), pageWidth / 2, 45, { align: 'center' });
        y = 58;

        // Meta row
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...C.muted);
        pdf.text(`Target Role: ${data.jobRole || 'General'}`, margin, y);
        pdf.text(`Report Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' }); y += 8;

        // Score interpretation box
        pdf.setFillColor(248, 250, 252); pdf.roundedRect(margin, y - 3, contentWidth, 14, 3, 3, 'F');
        pdf.setFillColor(...tierColor); pdf.roundedRect(margin, y - 3, 3, 14, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...C.dark);
        const interpLines = pdf.splitTextToSize(getScoreInterpretation(score), contentWidth - 10);
        interpLines.forEach(line => { pdf.text(line, margin + 7, y + 2); y += 4; }); y += 6;

        // ── SCORE BREAKDOWN ──
        drawSectionTitle('Score Breakdown', C.primary);
        drawProgressRow('Keyword Match', data.keywordMatchPercentage || 0);
        drawProgressRow('Structure', data.structureScore || 0);
        drawProgressRow('Experience', data.experienceScore || 0);
        drawProgressRow('Soft Skills', data.softSkillsScore || 0); y += 2;

        // ── ATS COMPATIBILITY ──
        drawSectionTitle('ATS Compatibility', C.secondary);
        drawProgressRow('Formatting', data.formattingScore || 0);
        drawProgressRow('Parsability', data.parsabilityScore || 0);
        drawProgressRow('Contact Info', data.contactInfoScore || 0);
        drawProgressRow('Section Organization', data.sectionOrganizationScore || 0);
        drawProgressRow('Keyword Density', data.keywordDensityScore || 0); y += 2;

        // ATS Issues & Tips side by side
        const issues = (data.atsIssues || []).filter(i => i);
        const tips = (data.atsTips || []).filter(t => t);
        if (issues.length > 0 || tips.length > 0) {
            needsPage(20);
            const boxW = (contentWidth - 4) / 2; const issueStartY = y;
            if (issues.length > 0) {
                pdf.setFillColor(254, 242, 242); pdf.roundedRect(margin, y - 3, boxW, 6 + issues.length * 5.5, 2, 2, 'F');
                pdf.setFillColor(...C.danger); pdf.roundedRect(margin, y - 3, 2.5, 6 + issues.length * 5.5, 1, 1, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...C.danger);
                pdf.text('Issues Found', margin + 5, y + 1); let iy = y + 6;
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(153, 27, 27);
                issues.forEach(issue => { const iL = pdf.splitTextToSize(`• ${issue}`, boxW - 8); iL.forEach(l => { pdf.text(l, margin + 5, iy); iy += 4; }); iy += 1; });
            }
            if (tips.length > 0) {
                const tipX = margin + boxW + 4;
                pdf.setFillColor(236, 253, 245); pdf.roundedRect(tipX, issueStartY - 3, boxW, 6 + tips.length * 5.5, 2, 2, 'F');
                pdf.setFillColor(...C.success); pdf.roundedRect(tipX, issueStartY - 3, 2.5, 6 + tips.length * 5.5, 1, 1, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...C.success);
                pdf.text('Optimization Tips', tipX + 5, issueStartY + 1); let ty = issueStartY + 6;
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(6, 95, 70);
                tips.forEach(tip => { const tL = pdf.splitTextToSize(`• ${tip}`, boxW - 8); tL.forEach(l => { pdf.text(l, tipX + 5, ty); ty += 4; }); ty += 1; });
            }
            y = issueStartY + Math.max(issues.length > 0 ? 6 + issues.length * 5.5 : 0, tips.length > 0 ? 6 + tips.length * 5.5 : 0) + 4;
        }

        // ── SKILLS ANALYSIS ──
        if ((data.topMatchedSkills && data.topMatchedSkills.length > 0) || (data.criticalMissingSkills && data.criticalMissingSkills.length > 0)) {
            drawSectionTitle('Skills Analysis', C.success);
            if (data.topMatchedSkills && data.topMatchedSkills.length > 0) {
                needsPage(10); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...C.success);
                pdf.text('Matched Skills', margin + 2, y); y += 5;
                drawKeywordTags(data.topMatchedSkills, [6, 95, 70], [209, 250, 229]);
            }
            if (data.criticalMissingSkills && data.criticalMissingSkills.length > 0) {
                needsPage(10); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...C.danger);
                pdf.text('Critical Missing Skills', margin + 2, y); y += 5;
                drawKeywordTags(data.criticalMissingSkills, [153, 27, 27], [254, 226, 226]);
            }
        }

        // ── KEYWORD ANALYSIS ──
        if ((data.matchedKeywords && data.matchedKeywords.length > 0) || (data.missingKeywords && data.missingKeywords.length > 0)) {
            drawSectionTitle('Keyword Analysis', C.info);
            if (data.matchedKeywords && data.matchedKeywords.length > 0) {
                needsPage(10); const mc = data.matchedKeywords.length; const tc = mc + (data.missingKeywords || []).length;
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...C.success);
                pdf.text(`Matched Keywords (${mc}/${tc})`, margin + 2, y); y += 5;
                drawKeywordTags(data.matchedKeywords, [6, 95, 70], [209, 250, 229]);
            }
            if (data.missingKeywords && data.missingKeywords.length > 0) {
                needsPage(10); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...C.danger);
                pdf.text(`Missing Keywords (${data.missingKeywords.length})`, margin + 2, y); y += 5;
                drawKeywordTags(data.missingKeywords, [153, 27, 27], [254, 226, 226]);
            }
        }

        // ── SKILL GAPS ──
        if (data.skillGaps && data.skillGaps.length > 0) { drawSectionTitle('Skill Gaps Identified', C.warning); drawNumberedList(data.skillGaps, C.dark); }

        // ── SUGGESTIONS ──
        if (data.suggestions && data.suggestions.length > 0) { drawSectionTitle('Improvement Suggestions', C.primary); drawNumberedList(data.suggestions, C.dark); }

        // ── COMPETITIVE ANALYSIS ──
        if (data.competitiveAnalysis) {
            drawSectionTitle('Competitive Analysis', C.secondary);
            needsPage(12); pdf.setFillColor(245, 243, 255);
            const caLines = pdf.splitTextToSize(String(data.competitiveAnalysis), contentWidth - 14);
            const caH = caLines.length * 4.5 + 6;
            pdf.roundedRect(margin, y - 4, contentWidth, caH, 3, 3, 'F');
            pdf.setFillColor(...C.secondary); pdf.roundedRect(margin, y - 4, 3, caH, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...C.dark);
            caLines.forEach(line => { needsPage(4.5); pdf.text(line, margin + 7, y); y += 4.5; }); y += 5;
        }

        // ── OVERALL FEEDBACK ──
        if (data.overallFeedback) {
            drawSectionTitle('Overall Feedback', C.primary);
            needsPage(12); pdf.setFillColor(238, 242, 255);
            const ofLines = pdf.splitTextToSize(String(data.overallFeedback), contentWidth - 14);
            const ofH = ofLines.length * 4.5 + 6;
            pdf.roundedRect(margin, y - 4, contentWidth, ofH, 3, 3, 'F');
            pdf.setFillColor(...C.primary); pdf.roundedRect(margin, y - 4, 3, ofH, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...C.dark);
            ofLines.forEach(line => { needsPage(4.5); pdf.text(line, margin + 7, y); y += 4.5; }); y += 5;
        }

        // ── FOOTER ──
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setDrawColor(...C.barBg); pdf.setLineWidth(0.3);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...C.muted);
            pdf.text(`ResuMentor AI  •  ${dateStr}  •  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        }

        const roleName = (data.jobRole || 'report').replace(/\s+/g, '-').toLowerCase();
        pdf.save(`resume-analysis-${roleName}-${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.success('Resume PDF report downloaded!');
    } catch (error) {
        console.error('Resume PDF generation failed:', error);
        Toast.error('Failed to generate PDF. Please try again.');
    }
}

// ==================== Interview Report PDF Download ====================

function downloadInterviewPDF() {
    if (!currentInterviewReport) {
        Toast.error('No interview report available');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const report = currentInterviewReport;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 18;
        const contentWidth = pageWidth - 2 * margin;
        const h = pdfHelpers(pdf, margin, contentWidth, pageHeight);

        // Header Banner
        pdf.setFillColor(118, 75, 162);
        pdf.rect(0, 0, pageWidth, 50, 'F');
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 46, pageWidth, 4, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Interview Performance Report', pageWidth / 2, 16, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('ResuMentor - AI Mock Interview', pageWidth / 2, 24, { align: 'center' });

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Score: ${report.totalScore || 0}/100`, pageWidth / 2, 35, { align: 'center' });
        pdf.setFontSize(11);
        pdf.text(`${report.performanceTier || 'Assessment Complete'}`, pageWidth / 2, 44, { align: 'center' });

        h.yPos = 58;

        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Job Role: ${report.jobRole || 'General'}`, margin, h.yPos);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, h.yPos, { align: 'right' });
        h.yPos += 5;
        pdf.text(`Duration: ${report.durationMinutes || 0} min  |  Questions: ${report.totalQuestionsAsked || 0}  |  Readiness: ${report.interviewReadinessLevel || 'N/A'}`, margin, h.yPos);
        h.yPos += 10;

        // Performance Breakdown
        h.sectionHeader('Performance Breakdown', [118, 75, 162]);
        h.drawProgressBar('Basic Questions', report.basicQuestionsScore || 0);
        h.drawProgressBar('Intermediate', report.intermediateQuestionsScore || 0);
        h.drawProgressBar('Advanced', report.advancedQuestionsScore || 0);
        h.drawProgressBar('Technical', report.technicalScore || 0);
        h.drawProgressBar('Behavioral', report.behavioralScore || 0);
        h.yPos += 3;

        // Statistics
        h.sectionHeader('Statistics', [102, 126, 234]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        const stats = [
            `Questions Asked: ${report.totalQuestionsAsked || 0}`,
            `Strong Answers (80%+): ${report.correctAnswers || 0}`,
            `Partial Answers (50-79%): ${report.partialAnswers || 0}`,
            `Weak Answers (<50%): ${report.incorrectAnswers || 0}`,
            `Average Score Per Question: ${report.averageScorePerQuestion || 0}`,
            `Communication Rating: ${report.communicationRating || 0}/5`
        ];
        stats.forEach(stat => {
            h.checkPage(6);
            pdf.text(`  \u2022  ${stat}`, margin + 3, h.yPos);
            h.yPos += 6;
        });
        h.yPos += 5;

        // Body Language Analysis
        if (report.eyeContactPercentage != null || report.faceCenteringScore != null ||
            report.hfFaceEngagementScore != null || report.hfFaceConfidenceScore != null) {
            h.sectionHeader('Body Language Analysis', [33, 150, 243]);
            h.drawProgressBar('Eye Contact', report.eyeContactPercentage || 0);
            h.drawProgressBar('Face Centering', report.faceCenteringScore || 0);
            if (report.hfFaceEngagementScore != null) {
                h.drawProgressBar('Engagement (HF)', report.hfFaceEngagementScore || 0);
            }
            if (report.hfFaceConfidenceScore != null) {
                h.drawProgressBar('Confidence (HF)', report.hfFaceConfidenceScore || 0);
            }
            if (report.bodyLanguageFeedback) {
                h.renderText(report.bodyLanguageFeedback, [50, 50, 50]);
            }
            if (report.bodyLanguageTips && report.bodyLanguageTips.length > 0) {
                h.renderBulletList(report.bodyLanguageTips, [0, 100, 180]);
            }
        }

        // Strength Areas
        if (report.strengthAreas && report.strengthAreas.length > 0) {
            h.sectionHeader('Strength Areas', [76, 175, 80]);
            h.renderBulletList(report.strengthAreas, [46, 125, 50]);
        }

        // Improvement Areas
        if (report.improvementAreas && report.improvementAreas.length > 0) {
            h.sectionHeader('Areas for Improvement', [255, 152, 0]);
            h.renderBulletList(report.improvementAreas, [180, 100, 0]);
        }

        // Recommendations
        if (report.actionableRecommendations && report.actionableRecommendations.length > 0) {
            h.sectionHeader('Actionable Recommendations', [102, 126, 234]);
            h.renderList(report.actionableRecommendations, [60, 60, 60]);
        }

        // Skill Gaps
        if (report.skillGapsIdentified && report.skillGapsIdentified.length > 0) {
            h.sectionHeader('Skill Gaps Identified', [244, 67, 54]);
            h.renderList(report.skillGapsIdentified, [200, 40, 40]);
        }

        // Top Performing Areas
        if (report.topPerformingAreas && report.topPerformingAreas.length > 0) {
            h.sectionHeader('Top Performing Areas', [76, 175, 80]);
            h.renderBulletList(report.topPerformingAreas, [46, 125, 50]);
        }

        // Question-by-Question Feedback
        if (report.questionFeedbacks && report.questionFeedbacks.length > 0) {
            h.sectionHeader('Question-by-Question Review', [118, 75, 162]);
            report.questionFeedbacks.forEach(qf => {
                h.checkPage(30);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(60, 60, 60);
                const qLabel = `Q${qf.questionNumber}. [${qf.difficulty || 'N/A'}] ${qf.category || ''}`;
                pdf.text(qLabel, margin, h.yPos);
                h.yPos += 5;

                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(40, 40, 40);
                const qLines = pdf.splitTextToSize(qf.question || '', contentWidth - 5);
                qLines.forEach(line => {
                    h.checkPage(5);
                    pdf.text(line, margin + 3, h.yPos);
                    h.yPos += 5;
                });

                if (qf.userAnswer) {
                    h.yPos += 2;
                    pdf.setTextColor(0, 100, 0);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Your Answer:', margin + 3, h.yPos);
                    h.yPos += 5;
                    pdf.setFont('helvetica', 'normal');
                    const aLines = pdf.splitTextToSize(qf.userAnswer, contentWidth - 10);
                    aLines.forEach(line => {
                        h.checkPage(5);
                        pdf.text(line, margin + 6, h.yPos);
                        h.yPos += 5;
                    });
                } else {
                    h.yPos += 2;
                    pdf.setTextColor(180, 100, 0);
                    pdf.text('Not Answered', margin + 3, h.yPos);
                    h.yPos += 5;
                }

                if (qf.score != null) {
                    const scoreColor = qf.score >= 80 ? [76, 175, 80] : qf.score >= 50 ? [255, 152, 0] : [244, 67, 54];
                    pdf.setTextColor(...scoreColor);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(`Score: ${qf.score}%`, margin + 3, h.yPos);
                    h.yPos += 5;
                }

                if (qf.aiFeedback) {
                    pdf.setTextColor(80, 80, 80);
                    pdf.setFont('helvetica', 'italic');
                    const fLines = pdf.splitTextToSize(qf.aiFeedback, contentWidth - 10);
                    fLines.forEach(line => {
                        h.checkPage(5);
                        pdf.text(line, margin + 6, h.yPos);
                        h.yPos += 5;
                    });
                }

                h.yPos += 6;
            });
        }

        // Overall Feedback
        if (report.overallFeedback) {
            h.sectionHeader('Overall Feedback', [102, 126, 234]);
            h.renderText(report.overallFeedback, [50, 50, 50]);
        }

        h.addFooters();

        const roleName = (report.jobRole || 'interview').replace(/\s+/g, '-').toLowerCase();
        pdf.save(`interview-report-${roleName}-${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.success('Interview PDF report downloaded!');
    } catch (error) {
        console.error('Interview PDF generation failed:', error);
        Toast.error('Failed to generate PDF. Please try again.');
    }
}

// Direct download helpers (fetch data then generate PDF without viewing inline)
async function viewAndDownloadResumePDF(resumeId) {
    try {
        Toast.success('Generating PDF...');
        const analysis = await apiClient.getResumeAnalysis(resumeId);
        currentResumeAnalysis = analysis;
        downloadResumePDF();
    } catch (error) {
        console.error('Error downloading resume PDF:', error);
        Toast.error('Failed to download PDF. Please try again.');
    }
}

async function viewAndDownloadInterviewPDF(sessionId) {
    try {
        Toast.success('Generating PDF...');
        const report = await apiClient.getInterviewReport(sessionId);
        currentInterviewReport = report;
        downloadInterviewPDF();
    } catch (error) {
        console.error('Error downloading interview PDF:', error);
        Toast.error('Failed to download PDF. Please try again.');
    }
}
