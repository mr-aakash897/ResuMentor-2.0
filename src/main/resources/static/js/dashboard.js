// ==================== Dashboard Functions ==================== 
let resumeChartInstance = null;
let interviewChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    showSkeletonLoaders();
    loadDashboardData();
    
    // Initialize scroll-to-top button
    if (typeof initScrollToTop === 'function') {
        initScrollToTop();
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
                            `<button class="btn btn-secondary" onclick="viewInterviewReport(${interview.id})">View Report</button>` :
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

function viewInterviewReport(sessionId) {
    window.open(`/pages/report.html?sessionId=${sessionId}`, '_blank');
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
            
            <!-- Matched Keywords -->
            <div class="analysis-card">
                <h4>✅ Matched Keywords</h4>
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
        </div>
        
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
