// ==================== Resume Analyzer Functions ==================== 
let selectedResumeFile = null;
let analysisData = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupFileUpload();
    
    // Initialize scroll-to-top button
    if (typeof initScrollToTop === 'function') {
        initScrollToTop();
    }
});

function setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const resumeFile = document.getElementById('resumeFile');

    dropZone.addEventListener('click', () => resumeFile.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-color)';
        dropZone.style.backgroundColor = 'var(--section-bg)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border-color)';
        dropZone.style.backgroundColor = 'var(--section-bg)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    resumeFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Only PDF and DOCX are allowed.');
        return;
    }

    if (file.size > 10485760) { // 10MB
        showError('File size exceeds 10MB limit.');
        return;
    }

    selectedResumeFile = file;
    const uploadZone = document.querySelector('.upload-placeholder');
    uploadZone.innerHTML = `
        <div class="upload-icon">✓</div>
        <p><strong>${file.name}</strong></p>
        <p class="upload-hint">File ready for analysis</p>
    `;
}

function analyzeResume() {
    const jobRole = document.getElementById('jobRole').value;
    
    if (!jobRole) {
        showError('Please select a job role');
        return;
    }

    if (!selectedResumeFile) {
        showError('Please select a resume file');
        return;
    }

    const jobDescription = document.getElementById('jobDescription').value || '';
    const analyzeBtn = document.getElementById('analyzeBtn');

    showLoadingSection();
    analyzeBtn.disabled = true;

    apiClient.uploadResume(selectedResumeFile, jobRole, jobDescription)
        .then(response => {
            analysisData = response;
            displayResults(response);
            analyzeBtn.disabled = false;
        })
        .catch(error => {
            console.error('Analysis error:', error);
            showError('Error analyzing resume. Please try again.');
            analyzeBtn.disabled = false;
        });
}

function displayResults(data) {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';

    // ATS Score
    document.getElementById('scoreValue').textContent = data.atsScore || 0;
    updateScoreColor(data.atsScore);
    document.getElementById('scoreInterpretation').textContent = generateScoreInterpretation(data.atsScore, data.resumeStrength);

    // Score Breakdown - with animation
    setTimeout(() => {
        setProgressWithAnimation('keywordMatchBar', 'keywordMatchValue', data.keywordMatchPercentage || 0);
        setProgressWithAnimation('structureBar', 'structureValue', data.structureScore || 0);
        setProgressWithAnimation('experienceBar', 'experienceValue', data.experienceScore || 0);
        setProgressWithAnimation('softSkillsBar', 'softSkillsValue', data.softSkillsScore || 0);
    }, 300);

    // ATS Friendliness Breakdown
    setTimeout(() => {
        displayATSFriendliness(data);
    }, 500);

    // Top Matched Skills
    const topMatchedEl = document.getElementById('topMatchedSkills');
    if (topMatchedEl) {
        topMatchedEl.innerHTML = (data.topMatchedSkills || [])
            .map(k => `<span>${k}</span>`)
            .join('') || '<span>No skills matched</span>';
    }

    // Critical Missing Skills
    const criticalMissingEl = document.getElementById('criticalMissingSkills');
    if (criticalMissingEl) {
        criticalMissingEl.innerHTML = (data.criticalMissingSkills || [])
            .map(k => `<span>${k}</span>`)
            .join('') || '<span>No critical gaps</span>';
    }

    // Keywords
    document.getElementById('matchedKeywords').innerHTML = (data.matchedKeywords || [])
        .map(k => `<span>${k}</span>`)
        .join('') || '<span>No keywords matched</span>';

    document.getElementById('missingKeywords').innerHTML = (data.missingKeywords || [])
        .map(k => `<span>${k}</span>`)
        .join('') || '<span>All keywords present!</span>';

    // Skill Gaps
    document.getElementById('skillGaps').innerHTML = (data.skillGaps || [])
        .map(s => `<li>${s}</li>`)
        .join('') || '<li>No significant skill gaps detected</li>';

    // Suggestions
    document.getElementById('suggestions').innerHTML = (data.suggestions || [])
        .map(s => `<li>${s}</li>`)
        .join('') || '<li>Your resume looks great!</li>';

    // Competitive Analysis
    const competitiveEl = document.getElementById('competitiveAnalysis');
    if (competitiveEl) {
        competitiveEl.textContent = data.competitiveAnalysis || 'Analysis complete.';
    }

    // Overall Feedback
    document.getElementById('overallFeedback').textContent = data.overallFeedback || 'Analysis complete.';
}

function setProgressWithAnimation(barId, valueId, percentage) {
    const bar = document.getElementById(barId);
    const value = document.getElementById(valueId);
    
    if (bar && value) {
        // Set the width with animation
        bar.style.width = percentage + '%';
        value.textContent = percentage + '%';
        
        // Set color based on percentage
        if (percentage >= 70) {
            bar.className = 'progress-fill high';
        } else if (percentage >= 50) {
            bar.className = 'progress-fill medium';
        } else {
            bar.className = 'progress-fill low';
        }
    }
}

function generateScoreInterpretation(score, strength) {
    const strengthLabel = strength || '';
    if (score >= 85) {
        return '🎉 EXCELLENT! Your resume is ATS-friendly and exceptionally well-optimized. You have a strong match for this position and stand out among applicants.';
    } else if (score >= 70) {
        return '👍 STRONG! Your resume has most of the required keywords and good formatting. With minor improvements, you can significantly boost your visibility.';
    } else if (score >= 55) {
        return '⚠️ GOOD. Your resume meets basic requirements but could be improved. Focus on adding more relevant keywords and highlighting achievements.';
    } else if (score >= 40) {
        return '📋 AVERAGE. Your resume needs improvements to compete effectively. Review the suggestions and skill gaps to strengthen your profile.';
    } else {
        return '❌ NEEDS WORK. Your resume requires significant improvements. Focus on acquiring missing skills and restructuring your content.';
    }
}

function updateScoreColor(score) {
    const circle = document.getElementById('scoreCircle');
    if (score >= 85) {
        circle.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
    } else if (score >= 70) {
        circle.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
    } else if (score >= 50) {
        circle.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
    } else {
        circle.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    }
}

function displayATSFriendliness(data) {
    const score = data.atsFriendlinessScore || 0;
    
    // Update score circle
    const scoreCircle = document.getElementById('atsFriendlyCircle');
    const scoreEl = document.getElementById('atsFriendlyScore');
    if (scoreEl) scoreEl.textContent = score;
    
    // Update circle color based on score
    if (scoreCircle) {
        scoreCircle.classList.remove('high', 'medium', 'low');
        if (score >= 75) scoreCircle.classList.add('high');
        else if (score >= 50) scoreCircle.classList.add('medium');
        else scoreCircle.classList.add('low');
    }
    
    // Update summary text
    const summaryEl = document.getElementById('atsSummary');
    if (summaryEl) {
        let summaryText = '';
        if (score >= 80) {
            summaryText = '✅ <strong>Excellent ATS Compatibility!</strong> Your resume is well-optimized for Applicant Tracking Systems. Most ATS software should be able to parse your resume correctly.';
        } else if (score >= 65) {
            summaryText = '👍 <strong>Good ATS Compatibility.</strong> Your resume will pass most ATS filters. Consider addressing the issues below to improve further.';
        } else if (score >= 50) {
            summaryText = '⚠️ <strong>Moderate ATS Compatibility.</strong> Your resume may face issues with some ATS systems. Review the suggestions below to improve parsability.';
        } else {
            summaryText = '❌ <strong>Low ATS Compatibility.</strong> Your resume may be filtered out by ATS software. Focus on the critical issues identified below.';
        }
        summaryEl.innerHTML = `<p>${summaryText}</p>`;
    }
    
    // Update progress bars
    setProgressWithAnimation('formattingBar', 'formattingValue', data.formattingScore || 0);
    setProgressWithAnimation('parsabilityBar', 'parsabilityValue', data.parsabilityScore || 0);
    setProgressWithAnimation('contactInfoBar', 'contactInfoValue', data.contactInfoScore || 0);
    setProgressWithAnimation('sectionOrgBar', 'sectionOrgValue', data.sectionOrganizationScore || 0);
    setProgressWithAnimation('keywordDensityBar', 'keywordDensityValue', data.keywordDensityScore || 0);
    
    // Display issues
    const issuesEl = document.getElementById('atsIssues');
    if (issuesEl) {
        const issues = data.atsIssues || [];
        if (issues.length > 0) {
            issuesEl.innerHTML = `
                <h4>⚠️ Issues Found</h4>
                <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>
            `;
        } else {
            issuesEl.innerHTML = '<h4>✅ No Issues</h4><p style="font-size: 13px; color: #4caf50;">No ATS compatibility issues detected!</p>';
        }
    }
    
    // Display tips
    const tipsEl = document.getElementById('atsTips');
    if (tipsEl) {
        const tips = data.atsTips || [];
        if (tips.length > 0) {
            tipsEl.innerHTML = `
                <h4>💡 Tips</h4>
                <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
            `;
        } else {
            tipsEl.innerHTML = '<h4>💡 Tips</h4><p style="font-size: 13px; color: #4caf50;">Your resume is ATS-ready!</p>';
        }
    }
}

function showLoadingSection() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
}

function resetAnalyzer() {
    selectedResumeFile = null;
    analysisData = null;
    document.getElementById('resumeFile').value = '';
    document.getElementById('jobRole').value = '';
    document.getElementById('jobDescription').value = '';
    document.getElementById('uploadSection').style.display = 'grid';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';

    const uploadZone = document.querySelector('.upload-placeholder');
    uploadZone.innerHTML = `
        <div class="upload-icon">📄</div>
        <p>Drag & drop your resume here or click to upload</p>
        <p class="upload-hint">Supported formats: PDF, DOC, DOCX</p>
    `;
}

function downloadReport() {
    const data = analysisData;
    const reportContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        RESUME ANALYSIS REPORT                                ║
║                           ResuMentor AI                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Job Role: ${data.jobRole || 'N/A'}
Analysis Date: ${new Date().toLocaleDateString()}

════════════════════════════════════════════════════════════════════════════════
                              ATS SCORE: ${data.atsScore || 0}/100
════════════════════════════════════════════════════════════════════════════════

SCORE BREAKDOWN:
─────────────────────────────────────────────────────────────────────────────────
  • Keyword Match:     ${data.keywordMatchPercentage || 0}%
  • Structure Score:   ${data.structureScore || 0}%
  • Experience Score:  ${data.experienceScore || 0}%
  • Soft Skills:       ${data.softSkillsScore || 0}%

RESUME STRENGTH: ${data.resumeStrength || 'N/A'}

════════════════════════════════════════════════════════════════════════════════
                              TOP MATCHED SKILLS
════════════════════════════════════════════════════════════════════════════════
${(data.topMatchedSkills || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  No skills matched'}

════════════════════════════════════════════════════════════════════════════════
                              CRITICAL MISSING SKILLS
════════════════════════════════════════════════════════════════════════════════
${(data.criticalMissingSkills || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  No critical gaps'}

════════════════════════════════════════════════════════════════════════════════
                              ALL MATCHED KEYWORDS
════════════════════════════════════════════════════════════════════════════════
${(data.matchedKeywords || []).join(', ') || 'None'}

════════════════════════════════════════════════════════════════════════════════
                              MISSING KEYWORDS
════════════════════════════════════════════════════════════════════════════════
${(data.missingKeywords || []).join(', ') || 'None'}

════════════════════════════════════════════════════════════════════════════════
                              SKILL GAPS IDENTIFIED
════════════════════════════════════════════════════════════════════════════════
${(data.skillGaps || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  No significant gaps'}

════════════════════════════════════════════════════════════════════════════════
                              IMPROVEMENT SUGGESTIONS
════════════════════════════════════════════════════════════════════════════════
${(data.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  Your resume looks great!'}

════════════════════════════════════════════════════════════════════════════════
                              COMPETITIVE ANALYSIS
════════════════════════════════════════════════════════════════════════════════
${data.competitiveAnalysis || 'Analysis complete.'}

════════════════════════════════════════════════════════════════════════════════
                              OVERALL FEEDBACK
════════════════════════════════════════════════════════════════════════════════
${data.overallFeedback || 'Analysis complete.'}

─────────────────────────────────────────────────────────────────────────────────
                    Generated by ResuMentor AI - Resume Analysis Tool
─────────────────────────────────────────────────────────────────────────────────
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', 'resume_analysis_report.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// PDF Export Function
function exportResumePDF() {
    if (!analysisData) {
        Toast.error('No analysis data available');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const data = analysisData;
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let yPos = 20;

        // Header with gradient effect
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 0, pageWidth, 45, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resume Analysis Report', pageWidth / 2, 18, { align: 'center' });
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('ResuMentor - AI Resume Analyzer', pageWidth / 2, 28, { align: 'center' });
        
        // ATS Score in header
        pdf.setFontSize(14);
        pdf.text(`ATS Score: ${data.atsScore || 0}/100`, pageWidth / 2, 40, { align: 'center' });

        yPos = 55;
        pdf.setTextColor(0, 0, 0);

        // Job Role & Date
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Job Role: ${data.jobRole || 'General'}  |  Date: ${new Date().toLocaleDateString()}`, margin, yPos);
        yPos += 12;

        // Score Breakdown Section
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Score Breakdown', margin, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const scores = [
            { label: 'Keyword Match', value: data.keywordMatchPercentage || 0 },
            { label: 'Resume Structure', value: data.structureScore || 0 },
            { label: 'Experience Quality', value: data.experienceScore || 0 },
            { label: 'Soft Skills', value: data.softSkillsScore || 0 }
        ];

        scores.forEach(score => {
            // Draw progress bar background
            pdf.setFillColor(230, 230, 230);
            pdf.roundedRect(margin, yPos - 3, 100, 6, 2, 2, 'F');
            
            // Draw progress bar fill
            const fillColor = score.value >= 70 ? [0, 212, 170] : score.value >= 50 ? [255, 167, 38] : [255, 107, 107];
            pdf.setFillColor(...fillColor);
            pdf.roundedRect(margin, yPos - 3, score.value, 6, 2, 2, 'F');
            
            // Label and value
            pdf.setTextColor(60, 60, 60);
            pdf.text(score.label, margin + 105, yPos);
            pdf.text(`${score.value}%`, margin + 155, yPos);
            yPos += 10;
        });
        yPos += 5;

        // ATS Friendliness if available
        if (data.atsFriendlinessScore) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ATS Friendliness', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Overall ATS Score: ${data.atsFriendlinessScore}%`, margin, yPos);
            yPos += 12;
        }

        // Top Matched Skills
        if (data.topMatchedSkills && data.topMatchedSkills.length > 0) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top Matched Skills', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 150, 0);
            data.topMatchedSkills.slice(0, 5).forEach(skill => {
                pdf.text(`✓ ${skill}`, margin, yPos);
                yPos += 6;
            });
            yPos += 5;
        }

        // Critical Missing Skills
        if (data.criticalMissingSkills && data.criticalMissingSkills.length > 0) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Critical Missing Skills', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(200, 0, 0);
            data.criticalMissingSkills.slice(0, 5).forEach(skill => {
                pdf.text(`✗ ${skill}`, margin, yPos);
                yPos += 6;
            });
            yPos += 5;
        }

        // Suggestions (on new page if needed)
        if (data.suggestions && data.suggestions.length > 0) {
            if (yPos > 230) {
                pdf.addPage();
                yPos = 20;
            }

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Improvement Suggestions', margin, yPos);
            yPos += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);
            data.suggestions.slice(0, 6).forEach((suggestion, i) => {
                const lines = pdf.splitTextToSize(`${i + 1}. ${suggestion}`, pageWidth - 2 * margin);
                lines.forEach(line => {
                    if (yPos > 275) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(line, margin, yPos);
                    yPos += 5;
                });
                yPos += 2;
            });
        }

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.text(`Generated by ResuMentor on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        }

        // Save
        const filename = `resume-analysis-${data.jobRole || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
        
        Toast.success('PDF report downloaded successfully!');
    } catch (error) {
        console.error('PDF generation failed:', error);
        Toast.error('Failed to generate PDF. Please try again.');
    }
}

function startInterview() {
    if (analysisData && analysisData.resumeId) {
        window.location.href = `/pages/interview.html?resumeId=${analysisData.resumeId}`;
    } else {
        showError('Please analyze a resume first');
    }
}

function showError(message) {
    Toast.error(message);
}

// Initialize upload section on load
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('uploadSection')) {
        const content = document.querySelector('.analyzer-content');
        if (content) {
            content.innerHTML = `
                <div class="upload-section" id="uploadSection">
                    <div class="upload-area" id="dropZone">
                        <input type="file" id="resumeFile" accept=".pdf,.doc,.docx" hidden>
                        <div class="upload-placeholder">
                            <div class="upload-icon">📄</div>
                            <p>Drag & drop your resume here or click to upload</p>
                            <p class="upload-hint">Supported formats: PDF, DOC, DOCX</p>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="form-group">
                            <label for="jobRole">Select Your Target Role:</label>
                            <select id="jobRole">
                                <option value="">-- Select Role --</option>
                                <option value="backend">Backend Developer</option>
                                <option value="frontend">Frontend Developer</option>
                                <option value="fullstack">Full Stack Developer</option>
                                <option value="data-scientist">Data Scientist</option>
                                <option value="devops">DevOps Engineer</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="jobDescription">Job Description (Optional):</label>
                            <textarea id="jobDescription" placeholder="Paste the job description..."></textarea>
                        </div>

                        <button class="btn btn-primary" onclick="analyzeResume()" id="analyzeBtn">
                            Analyze Resume
                        </button>
                    </div>
                </div>

                <div id="loadingSection" class="loading-section" style="display: none;">
                    <div class="spinner"></div>
                    <p>Analyzing your resume...</p>
                </div>

                <div id="resultsSection" class="results-section" style="display: none;">
                    <!-- Results HTML here -->
                </div>
            ` ;
            setupFileUpload();
        }
    }
});
