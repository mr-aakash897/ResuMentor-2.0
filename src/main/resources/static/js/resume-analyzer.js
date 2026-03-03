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

    // ATS Compatibility Breakdown - with animation
    setTimeout(() => {
        setProgressWithAnimation('formattingBar', 'formattingValue', data.formattingScore || 0);
        setProgressWithAnimation('parsabilityBar', 'parsabilityValue', data.parsabilityScore || 0);
        setProgressWithAnimation('contactInfoBar', 'contactInfoValue', data.contactInfoScore || 0);
        setProgressWithAnimation('sectionOrgBar', 'sectionOrgValue', data.sectionOrganizationScore || 0);
        setProgressWithAnimation('keywordDensityBar', 'keywordDensityValue', data.keywordDensityScore || 0);
    }, 500);

    // ATS Issues
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

    // ATS Tips
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
        return 'EXCELLENT! Your resume is ATS-friendly and exceptionally well-optimized. You have a strong match for this position and stand out among applicants.';
    } else if (score >= 70) {
        return 'STRONG! Your resume has most of the required keywords and good formatting. With minor improvements, you can significantly boost your visibility.';
    } else if (score >= 55) {
        return 'GOOD. Your resume meets basic requirements but could be improved. Focus on adding more relevant keywords and highlighting achievements.';
    } else if (score >= 40) {
        return 'AVERAGE. Your resume needs improvements to compete effectively. Review the suggestions and skill gaps to strengthen your profile.';
    } else {
        return 'NEEDS WORK. Your resume requires significant improvements. Focus on acquiring missing skills and restructuring your content.';
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

RESUME STRENGTH: ${data.resumeStrength || 'N/A'}

SCORE BREAKDOWN:
─────────────────────────────────────────────────────────────────────────────────
  • Keyword Match:     ${data.keywordMatchPercentage || 0}%
  • Structure Score:   ${data.structureScore || 0}%
  • Experience Score:  ${data.experienceScore || 0}%
  • Soft Skills:       ${data.softSkillsScore || 0}%

ATS COMPATIBILITY BREAKDOWN:
─────────────────────────────────────────────────────────────────────────────────
  • Formatting:          ${data.formattingScore || 0}%
  • Parsability:         ${data.parsabilityScore || 0}%
  • Contact Info:        ${data.contactInfoScore || 0}%
  • Section Organization:${data.sectionOrganizationScore || 0}%
  • Keyword Density:     ${data.keywordDensityScore || 0}%

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
                              ATS ISSUES FOUND
════════════════════════════════════════════════════════════════════════════════
${(data.atsIssues || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  No ATS issues detected'}

════════════════════════════════════════════════════════════════════════════════
                              ATS OPTIMIZATION TIPS
════════════════════════════════════════════════════════════════════════════════
${(data.atsTips || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n') || '  Your resume is ATS-ready!'}

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

// PDF Export Function - Full Comprehensive Report
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
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 18;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = 20;

        // Helper: check page overflow
        function checkPage(needed) {
            if (yPos + needed > pageHeight - 20) {
                pdf.addPage();
                yPos = 20;
            }
        }

        // Helper: draw section header with colored underline
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

        // Helper: draw progress bar with label
        function drawProgressBar(label, value) {
            checkPage(12);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(60, 60, 60);
            pdf.text(label, margin, yPos);

            const barX = margin + 55;
            const barWidth = 80;
            const barHeight = 5;

            // Background
            pdf.setFillColor(230, 230, 230);
            pdf.roundedRect(barX, yPos - 4, barWidth, barHeight, 2, 2, 'F');

            // Fill
            const fillWidth = (value / 100) * barWidth;
            const fillColor = value >= 70 ? [76, 175, 80] : value >= 50 ? [255, 152, 0] : [244, 67, 54];
            pdf.setFillColor(...fillColor);
            if (fillWidth > 0) {
                pdf.roundedRect(barX, yPos - 4, fillWidth, barHeight, 2, 2, 'F');
            }

            // Value
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...fillColor);
            pdf.text(`${value}%`, barX + barWidth + 4, yPos);
            pdf.setFont('helvetica', 'normal');

            yPos += 9;
        }

        // Helper: render numbered list
        function renderList(items, color) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...color);
            const safeItems = items.filter(item => item != null && String(item).trim() !== '');
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

        // Helper: render bullet list
        function renderBulletList(items, color) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...color);
            const safeItems = items.filter(item => item != null && String(item).trim() !== '');
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

        // Helper: render wrapped text
        function renderText(text, color) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...color);
            const lines = pdf.splitTextToSize(text, contentWidth);
            lines.forEach(line => {
                checkPage(5);
                pdf.text(line, margin, yPos);
                yPos += 5;
            });
            yPos += 3;
        }

        // =====================================================
        // 1. HEADER BANNER
        // =====================================================
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 0, pageWidth, 50, 'F');
        // Accent stripe
        pdf.setFillColor(118, 75, 162);
        pdf.rect(0, 46, pageWidth, 4, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resume Analysis Report', pageWidth / 2, 16, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('ResuMentor - AI Resume Analyzer', pageWidth / 2, 24, { align: 'center' });

        // Score badge
        const scoreColor = (data.atsScore || 0) >= 85 ? 'EXCELLENT' :
                          (data.atsScore || 0) >= 70 ? 'STRONG' :
                          (data.atsScore || 0) >= 55 ? 'GOOD' :
                          (data.atsScore || 0) >= 40 ? 'AVERAGE' : 'NEEDS WORK';
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`ATS Score: ${data.atsScore || 0}/100`, pageWidth / 2, 35, { align: 'center' });

        pdf.setFontSize(11);
        pdf.text(`${data.resumeStrength || scoreColor}`, pageWidth / 2, 44, { align: 'center' });

        yPos = 58;

        // Job Role & Date line
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Job Role: ${data.jobRole || 'General'}`, margin, yPos);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 10;

        // =====================================================
        // 2. SCORE INTERPRETATION
        // =====================================================
        sectionHeader('Score Interpretation', [102, 126, 234]);
        const interpretation = generateScoreInterpretation(data.atsScore || 0, data.resumeStrength);
        renderText(interpretation, [50, 50, 50]);

        // =====================================================
        // 3. SCORE BREAKDOWN
        // =====================================================
        sectionHeader('Score Breakdown', [102, 126, 234]);
        drawProgressBar('Keyword Match', data.keywordMatchPercentage || 0);
        drawProgressBar('Structure', data.structureScore || 0);
        drawProgressBar('Experience', data.experienceScore || 0);
        drawProgressBar('Soft Skills', data.softSkillsScore || 0);
        yPos += 3;

        // =====================================================
        // 4. ATS COMPATIBILITY BREAKDOWN
        // =====================================================
        sectionHeader('ATS Compatibility Breakdown', [118, 75, 162]);
        drawProgressBar('Formatting', data.formattingScore || 0);
        drawProgressBar('Parsability', data.parsabilityScore || 0);
        drawProgressBar('Contact Info', data.contactInfoScore || 0);
        drawProgressBar('Section Organization', data.sectionOrganizationScore || 0);
        drawProgressBar('Keyword Density', data.keywordDensityScore || 0);
        yPos += 3;

        // =====================================================
        // 5. TOP MATCHED SKILLS
        // =====================================================
        if (data.topMatchedSkills && data.topMatchedSkills.length > 0) {
            sectionHeader('Top Matched Skills', [76, 175, 80]);
            renderBulletList(data.topMatchedSkills, [46, 125, 50]);
        }

        // =====================================================
        // 6. CRITICAL MISSING SKILLS
        // =====================================================
        if (data.criticalMissingSkills && data.criticalMissingSkills.length > 0) {
            sectionHeader('Critical Missing Skills', [244, 67, 54]);
            renderBulletList(data.criticalMissingSkills, [200, 40, 40]);
        }

        // =====================================================
        // 7. ALL MATCHED KEYWORDS
        // =====================================================
        if (data.matchedKeywords && data.matchedKeywords.length > 0) {
            sectionHeader('Matched Keywords', [76, 175, 80]);
            const keywordsText = data.matchedKeywords.join(',  ');
            renderText(keywordsText, [46, 125, 50]);
        }

        // =====================================================
        // 8. MISSING KEYWORDS
        // =====================================================
        if (data.missingKeywords && data.missingKeywords.length > 0) {
            sectionHeader('Missing Keywords', [244, 67, 54]);
            const missingText = data.missingKeywords.join(',  ');
            renderText(missingText, [200, 40, 40]);
        }

        // =====================================================
        // 9. ATS ISSUES FOUND
        // =====================================================
        if (data.atsIssues && data.atsIssues.length > 0) {
            sectionHeader('ATS Issues Found', [255, 152, 0]);
            renderList(data.atsIssues, [180, 100, 0]);
        }

        // =====================================================
        // 10. ATS OPTIMIZATION TIPS
        // =====================================================
        if (data.atsTips && data.atsTips.length > 0) {
            sectionHeader('ATS Optimization Tips', [33, 150, 243]);
            renderList(data.atsTips, [0, 100, 180]);
        }

        // =====================================================
        // 11. SKILL GAPS IDENTIFIED
        // =====================================================
        if (data.skillGaps && data.skillGaps.length > 0) {
            sectionHeader('Skill Gaps Identified', [255, 152, 0]);
            renderList(data.skillGaps, [140, 80, 0]);
        }

        // =====================================================
        // 12. IMPROVEMENT SUGGESTIONS
        // =====================================================
        if (data.suggestions && data.suggestions.length > 0) {
            sectionHeader('Improvement Suggestions', [102, 126, 234]);
            renderList(data.suggestions, [60, 60, 60]);
        }

        // =====================================================
        // 13. COMPETITIVE ANALYSIS
        // =====================================================
        if (data.competitiveAnalysis) {
            sectionHeader('Competitive Analysis', [118, 75, 162]);
            renderText(data.competitiveAnalysis, [60, 60, 60]);
        }

        // =====================================================
        // 14. OVERALL FEEDBACK
        // =====================================================
        if (data.overallFeedback) {
            sectionHeader('Overall Feedback', [102, 126, 234]);
            renderText(data.overallFeedback, [50, 50, 50]);
        }

        // =====================================================
        // 15. FOOTER on every page
        // =====================================================
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            // Footer line
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
            pdf.text(
                `Generated by ResuMentor AI  |  ${new Date().toLocaleDateString()}  |  Page ${i} of ${pageCount}`,
                pageWidth / 2, pageHeight - 8, { align: 'center' }
            );
        }

        // Save
        const roleName = (data.jobRole || 'report').replace(/\s+/g, '-').toLowerCase();
        const filename = `resume-analysis-${roleName}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        Toast.success('Full PDF report downloaded!');
    } catch (error) {
        console.error('PDF generation failed:', error);
        Toast.error('Failed to generate PDF. Please try again.');
    }
}

function viewOnDashboard() {
    if (analysisData && analysisData.resumeId) {
        window.location.href = `/pages/dashboard.html?resumeId=${analysisData.resumeId}`;
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
