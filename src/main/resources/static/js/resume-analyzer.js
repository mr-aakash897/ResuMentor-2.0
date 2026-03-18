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

// ==================== Score Tier Helpers ====================

function getScoreTier(score) {
    if (score >= 85) return { label: 'Excellent', class: 'tier-excellent', color: '#10b981' };
    if (score >= 70) return { label: 'Strong', class: 'tier-strong', color: '#3b82f6' };
    if (score >= 55) return { label: 'Good', class: 'tier-good', color: '#f59e0b' };
    if (score >= 40) return { label: 'Average', class: 'tier-average', color: '#f97316' };
    return { label: 'Needs Work', class: 'tier-needs-work', color: '#ef4444' };
}

function getBarClass(value) {
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    return 'low';
}

function generateScoreInterpretation(score) {
    if (score >= 85) {
        return 'Your resume is ATS-friendly and exceptionally well-optimized. You have a strong match for this position and stand out among applicants.';
    } else if (score >= 70) {
        return 'Your resume has most of the required keywords and good formatting. With minor improvements, you can significantly boost your visibility.';
    } else if (score >= 55) {
        return 'Your resume meets basic requirements but could be improved. Focus on adding more relevant keywords and highlighting achievements.';
    } else if (score >= 40) {
        return 'Your resume needs improvements to compete effectively. Review the suggestions and skill gaps to strengthen your profile.';
    } else {
        return 'Your resume requires significant improvements. Focus on acquiring missing skills and restructuring your content for ATS compatibility.';
    }
}

// ==================== Display Results ====================

function displayResults(data) {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';

    const score = data.atsScore || 0;
    const tier = getScoreTier(score);

    // --- Score Ring with SVG animated circle ---
    const scoreRingEl = document.getElementById('scoreRing');
    if (scoreRingEl) {
        const circumference = 2 * Math.PI * 54; // r=54
        const offset = circumference - (score / 100) * circumference;
        scoreRingEl.innerHTML = `
            <svg viewBox="0 0 120 120" class="score-ring-svg">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-color)" stroke-width="8" opacity="0.2"/>
                <circle cx="60" cy="60" r="54" fill="none" stroke="${tier.color}" stroke-width="8"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                    stroke-linecap="round" transform="rotate(-90 60 60)" class="score-ring-fill"/>
            </svg>
            <div class="score-ring-text">
                <span class="score-ring-value">${score}</span>
                <span class="score-ring-label">/ 100</span>
            </div>
        `;
        // Animate after paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const fill = scoreRingEl.querySelector('.score-ring-fill');
                if (fill) fill.style.strokeDashoffset = offset;
            });
        });
    }

    // Tier badge
    const tierBadgeEl = document.getElementById('scoreTierBadge');
    if (tierBadgeEl) {
        tierBadgeEl.textContent = tier.label;
        tierBadgeEl.className = `tier-badge ${tier.class}`;
    }

    // Score interpretation
    document.getElementById('scoreInterpretation').textContent = generateScoreInterpretation(score);

    // --- Score Breakdown with animation ---
    setTimeout(() => {
        setProgressWithAnimation('keywordMatchBar', 'keywordMatchValue', data.keywordMatchPercentage || 0);
        setProgressWithAnimation('structureBar', 'structureValue', data.structureScore || 0);
        setProgressWithAnimation('experienceBar', 'experienceValue', data.experienceScore || 0);
        setProgressWithAnimation('softSkillsBar', 'softSkillsValue', data.softSkillsScore || 0);
    }, 300);

    // --- ATS Compatibility Breakdown with animation ---
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
                <h4>Issues Found</h4>
                <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>
            `;
        } else {
            issuesEl.innerHTML = '<h4>No Issues</h4><p class="ats-ok-msg">No ATS compatibility issues detected.</p>';
        }
    }

    // ATS Tips
    const tipsEl = document.getElementById('atsTips');
    if (tipsEl) {
        const tips = data.atsTips || [];
        if (tips.length > 0) {
            tipsEl.innerHTML = `
                <h4>Optimization Tips</h4>
                <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
            `;
        } else {
            tipsEl.innerHTML = '<h4>Tips</h4><p class="ats-ok-msg">Your resume is ATS-ready.</p>';
        }
    }

    // Top Matched Skills
    const topMatchedEl = document.getElementById('topMatchedSkills');
    if (topMatchedEl) {
        topMatchedEl.innerHTML = (data.topMatchedSkills || [])
            .map(k => `<span class="keyword-tag keyword-tag--success">${k}</span>`)
            .join('') || '<span class="keyword-tag keyword-tag--neutral">No skills matched</span>';
    }

    // Critical Missing Skills
    const criticalMissingEl = document.getElementById('criticalMissingSkills');
    if (criticalMissingEl) {
        criticalMissingEl.innerHTML = (data.criticalMissingSkills || [])
            .map(k => `<span class="keyword-tag keyword-tag--danger">${k}</span>`)
            .join('') || '<span class="keyword-tag keyword-tag--neutral">No critical gaps</span>';
    }

    // All Matched Keywords
    document.getElementById('matchedKeywords').innerHTML = (data.matchedKeywords || [])
        .map(k => `<span class="keyword-tag keyword-tag--success">${k}</span>`)
        .join('') || '<span class="keyword-tag keyword-tag--neutral">No keywords matched</span>';

    // Missing Keywords
    document.getElementById('missingKeywords').innerHTML = (data.missingKeywords || [])
        .map(k => `<span class="keyword-tag keyword-tag--danger">${k}</span>`)
        .join('') || '<span class="keyword-tag keyword-tag--success">All keywords present!</span>';

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
        bar.style.width = percentage + '%';
        value.textContent = percentage + '%';

        if (percentage >= 70) {
            bar.className = 'progress-fill high';
        } else if (percentage >= 50) {
            bar.className = 'progress-fill medium';
        } else {
            bar.className = 'progress-fill low';
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
║                           ResuMentor AI                                      ║
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
${(data.topMatchedSkills || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  No skills matched'}

════════════════════════════════════════════════════════════════════════════════
                              CRITICAL MISSING SKILLS
════════════════════════════════════════════════════════════════════════════════
${(data.criticalMissingSkills || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  No critical gaps'}

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
${(data.atsIssues || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  No ATS issues detected'}

════════════════════════════════════════════════════════════════════════════════
                              ATS OPTIMIZATION TIPS
════════════════════════════════════════════════════════════════════════════════
${(data.atsTips || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  Your resume is ATS-ready!'}

════════════════════════════════════════════════════════════════════════════════
                              SKILL GAPS IDENTIFIED
════════════════════════════════════════════════════════════════════════════════
${(data.skillGaps || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  No significant gaps'}

════════════════════════════════════════════════════════════════════════════════
                              IMPROVEMENT SUGGESTIONS
════════════════════════════════════════════════════════════════════════════════
${(data.suggestions || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')
 || '  Your resume looks great!'}

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

// ==================== PDF Export - Professional Report ====================

function exportResumePDF() {
    if (!analysisData) {
        Toast.error('No analysis data available');
        return;
    }

    try {
        generateResumePDFReport(analysisData);
        Toast.success('PDF report downloaded!');
    } catch (error) {
        console.error('PDF generation failed:', error);
        Toast.error('Failed to generate PDF. Please try again.');
    }
}

/**
 * Generates a professional, multi-page ATS analysis PDF report.
 * Shared by both resume-analyzer and dashboard pages.
 */
function generateResumePDFReport(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();   // 210
    const pageHeight = pdf.internal.pageSize.getHeight();  // 297
    const margin = 16;
    const contentWidth = pageWidth - 2 * margin;
    let y = 0;

    // Color palette
    const C = {
        primary:    [79, 70, 229],   // indigo-600
        secondary:  [124, 58, 237],  // violet-600
        success:    [16, 185, 129],   // emerald-500
        danger:     [239, 68, 68],    // red-500
        warning:    [245, 158, 11],   // amber-500
        info:       [59, 130, 246],   // blue-500
        dark:       [30, 41, 59],     // slate-800
        muted:      [100, 116, 139],  // slate-500
        light:      [241, 245, 249],  // slate-100
        white:      [255, 255, 255],
        barBg:      [226, 232, 240],  // slate-200
    };

    const score = data.atsScore || 0;
    const tier = getScoreTier(score);
    const tierColorMap = {
        'Excellent': C.success,
        'Strong': C.info,
        'Good': C.warning,
        'Average': [249, 115, 22],  // orange-500
        'Needs Work': C.danger,
    };
    const tierColor = tierColorMap[tier.label] || C.primary;

    // ── Helpers ─────────────────────────────────────────────

    function needsPage(needed) {
        if (y + needed > pageHeight - 18) {
            pdf.addPage();
            y = 16;
            return true;
        }
        return false;
    }

    function drawSectionTitle(title, iconColor) {
        needsPage(14);
        y += 4;
        // Colored left accent bar
        pdf.setFillColor(...iconColor);
        pdf.roundedRect(margin, y - 4.5, 3, 7, 1.5, 1.5, 'F');
        // Title text
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(...C.dark);
        pdf.text(title, margin + 7, y);
        y += 3;
        // Thin line
        pdf.setDrawColor(...C.barBg);
        pdf.setLineWidth(0.4);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 6;
    }

    function drawProgressRow(label, value, barWidth) {
        needsPage(10);
        const bw = barWidth || 90;
        const barH = 4.5;
        const labelWidth = 48;
        const barX = margin + labelWidth;

        // Label
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.dark);
        pdf.text(label, margin + 2, y);

        // Background bar
        pdf.setFillColor(...C.barBg);
        pdf.roundedRect(barX, y - 3.5, bw, barH, 2, 2, 'F');

        // Filled bar
        const fillW = Math.max(0, (value / 100) * bw);
        const barColor = value >= 70 ? C.success : value >= 50 ? C.warning : C.danger;
        pdf.setFillColor(...barColor);
        if (fillW > 0) pdf.roundedRect(barX, y - 3.5, fillW, barH, 2, 2, 'F');

        // Percentage value
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...barColor);
        pdf.text(`${value}%`, barX + bw + 3, y);

        y += 8;
    }

    function drawKeywordTags(items, color, bgColor) {
        if (!items || items.length === 0) return;
        const safe = items.filter(i => i != null && String(i).trim() !== '');
        let xPos = margin + 2;
        const tagH = 6;
        const tagPadding = 3;
        const tagGap = 2.5;

        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');

        safe.forEach(item => {
            const text = String(item).trim();
            const tw = pdf.getTextWidth(text) + tagPadding * 2;
            // Wrap if needed
            if (xPos + tw > margin + contentWidth - 2) {
                xPos = margin + 2;
                y += tagH + 2;
                needsPage(tagH + 4);
            }
            // Tag background
            pdf.setFillColor(...bgColor);
            pdf.roundedRect(xPos, y - 4, tw, tagH, 2, 2, 'F');
            // Tag text
            pdf.setTextColor(...color);
            pdf.text(text, xPos + tagPadding, y - 0.5);
            xPos += tw + tagGap;
        });
        y += tagH + 2;
    }

    function drawNumberedList(items, textColor) {
        if (!items || items.length === 0) return;
        const safe = items.filter(i => i != null && String(i).trim() !== '');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);

        safe.forEach((item, i) => {
            // Number circle
            needsPage(6);
            const numText = `${i + 1}`;
            pdf.setFillColor(...C.light);
            pdf.circle(margin + 5, y - 1.5, 3, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(...C.primary);
            pdf.text(numText, margin + 5, y - 0.5, { align: 'center' });

            // Item text
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...textColor);
            const lines = pdf.splitTextToSize(String(item), contentWidth - 14);
            lines.forEach((line, li) => {
                if (li > 0) needsPage(4.5);
                pdf.text(line, margin + 10, y);
                y += 4.5;
            });
            y += 1.5;
        });
        y += 2;
    }

    function drawParagraph(text, textColor) {
        if (!text) return;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...textColor);
        const lines = pdf.splitTextToSize(String(text), contentWidth - 4);
        lines.forEach(line => {
            needsPage(4.5);
            pdf.text(line, margin + 2, y);
            y += 4.5;
        });
        y += 3;
    }

    function drawCardBox(drawContent) {
        // Save start y for box
        const startY = y;
        // Draw content first to measure height
        drawContent();
        y += 2;
    }

    // ══════════════════════════════════════════════════════════
    // PAGE 1: HEADER + SCORE OVERVIEW
    // ══════════════════════════════════════════════════════════

    // Full-width gradient header
    pdf.setFillColor(...C.primary);
    pdf.rect(0, 0, pageWidth, 52, 'F');
    // Accent strip
    pdf.setFillColor(...C.secondary);
    pdf.rect(0, 48, pageWidth, 4, 'F');

    // Title
    pdf.setTextColor(...C.white);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('ATS Resume Analysis Report', pageWidth / 2, 15, { align: 'center' });

    // Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255, 180);
    pdf.text('Powered by ResuMentor AI', pageWidth / 2, 22, { align: 'center' });

    // Score display in header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(...C.white);
    pdf.text(`${score}`, pageWidth / 2, 37, { align: 'center' });
    pdf.setFontSize(11);
    pdf.text(`/ 100`, pageWidth / 2 + pdf.getTextWidth(`${score}`) / 2 + 3, 37, { align: 'left' });

    // Tier label
    pdf.setFontSize(10);
    pdf.setTextColor(...C.white);
    pdf.text(tier.label.toUpperCase(), pageWidth / 2, 45, { align: 'center' });

    y = 58;

    // Meta info row
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.muted);
    const jobRoleDisplay = data.jobRole || 'General';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    pdf.text(`Target Role: ${jobRoleDisplay}`, margin, y);
    pdf.text(`Report Date: ${dateStr}`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    // Score interpretation box
    pdf.setFillColor(248, 250, 252);  // slate-50
    pdf.roundedRect(margin, y - 3, contentWidth, 14, 3, 3, 'F');
    pdf.setFillColor(...tierColor);
    pdf.roundedRect(margin, y - 3, 3, 14, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.dark);
    const interp = generateScoreInterpretation(score);
    const interpLines = pdf.splitTextToSize(interp, contentWidth - 10);
    interpLines.forEach(line => {
        pdf.text(line, margin + 7, y + 2);
        y += 4;
    });
    y += 6;

    // ══════════════════════════════════════════════════════════
    // SCORE BREAKDOWN
    // ══════════════════════════════════════════════════════════
    drawSectionTitle('Score Breakdown', C.primary);

    // Two-column layout for score bars
    const col1X = margin;
    const col2X = margin + contentWidth / 2 + 4;
    const colW = contentWidth / 2 - 6;
    const savedY = y;

    // Column 1
    const scores1 = [
        ['Keyword Match', data.keywordMatchPercentage || 0],
        ['Structure', data.structureScore || 0],
    ];
    const scores2 = [
        ['Experience', data.experienceScore || 0],
        ['Soft Skills', data.softSkillsScore || 0],
    ];

    // Draw left column
    scores1.forEach(([label, val]) => {
        drawProgressRow(label, val, colW - 20);
    });
    const endY1 = y;

    // Draw right column
    y = savedY;
    const origMargin = margin;
    // Temporarily shift for column 2 by drawing manually
    scores2.forEach(([label, val]) => {
        needsPage(10);
        const barH = 4.5;
        const labelWidth = 48;
        const barW = colW - 20;
        const barX = col2X + labelWidth;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.dark);
        pdf.text(label, col2X + 2, y);

        pdf.setFillColor(...C.barBg);
        pdf.roundedRect(barX, y - 3.5, barW, barH, 2, 2, 'F');

        const fillW = Math.max(0, (val / 100) * barW);
        const barColor = val >= 70 ? C.success : val >= 50 ? C.warning : C.danger;
        pdf.setFillColor(...barColor);
        if (fillW > 0) pdf.roundedRect(barX, y - 3.5, fillW, barH, 2, 2, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...barColor);
        pdf.text(`${val}%`, barX + barW + 3, y);
        y += 8;
    });
    const endY2 = y;
    y = Math.max(endY1, endY2) + 2;

    // ══════════════════════════════════════════════════════════
    // ATS COMPATIBILITY BREAKDOWN
    // ══════════════════════════════════════════════════════════
    drawSectionTitle('ATS Compatibility', C.secondary);

    const atsScores = [
        ['Formatting', data.formattingScore || 0],
        ['Parsability', data.parsabilityScore || 0],
        ['Contact Info', data.contactInfoScore || 0],
        ['Section Organization', data.sectionOrganizationScore || 0],
        ['Keyword Density', data.keywordDensityScore || 0],
    ];
    atsScores.forEach(([label, val]) => {
        drawProgressRow(label, val);
    });
    y += 2;

    // ATS Issues & Tips side by side
    const issues = (data.atsIssues || []).filter(i => i);
    const tips = (data.atsTips || []).filter(t => t);

    if (issues.length > 0 || tips.length > 0) {
        needsPage(20);
        const boxW = (contentWidth - 4) / 2;
        const issueStartY = y;

        // Issues box
        if (issues.length > 0) {
            pdf.setFillColor(254, 242, 242);  // red-50
            pdf.roundedRect(margin, y - 3, boxW, 6 + issues.length * 5.5, 2, 2, 'F');
            pdf.setFillColor(...C.danger);
            pdf.roundedRect(margin, y - 3, 2.5, 6 + issues.length * 5.5, 1, 1, 'F');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(...C.danger);
            pdf.text('Issues Found', margin + 5, y + 1);
            let iy = y + 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(153, 27, 27);  // red-800
            issues.forEach(issue => {
                const iLines = pdf.splitTextToSize(`• ${issue}`, boxW - 8);
                iLines.forEach(line => {
                    pdf.text(line, margin + 5, iy);
                    iy += 4;
                });
                iy += 1;
            });
        }

        // Tips box
        if (tips.length > 0) {
            const tipX = margin + boxW + 4;
            pdf.setFillColor(236, 253, 245);  // emerald-50
            pdf.roundedRect(tipX, issueStartY - 3, boxW, 6 + tips.length * 5.5, 2, 2, 'F');
            pdf.setFillColor(...C.success);
            pdf.roundedRect(tipX, issueStartY - 3, 2.5, 6 + tips.length * 5.5, 1, 1, 'F');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(...C.success);
            pdf.text('Optimization Tips', tipX + 5, issueStartY + 1);
            let ty = issueStartY + 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(6, 95, 70);  // emerald-800
            tips.forEach(tip => {
                const tLines = pdf.splitTextToSize(`• ${tip}`, boxW - 8);
                tLines.forEach(line => {
                    pdf.text(line, tipX + 5, ty);
                    ty += 4;
                });
                ty += 1;
            });
        }

        // Move y past the taller box
        const issueH = issues.length > 0 ? 6 + issues.length * 5.5 : 0;
        const tipH = tips.length > 0 ? 6 + tips.length * 5.5 : 0;
        y = issueStartY + Math.max(issueH, tipH) + 4;
    }

    // ══════════════════════════════════════════════════════════
    // SKILLS ANALYSIS
    // ══════════════════════════════════════════════════════════
    if ((data.topMatchedSkills && data.topMatchedSkills.length > 0) ||
        (data.criticalMissingSkills && data.criticalMissingSkills.length > 0)) {
        drawSectionTitle('Skills Analysis', C.success);

        if (data.topMatchedSkills && data.topMatchedSkills.length > 0) {
            needsPage(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...C.success);
            pdf.text('Matched Skills', margin + 2, y);
            y += 5;
            drawKeywordTags(data.topMatchedSkills, [6, 95, 70], [209, 250, 229]); // emerald text on emerald-100
        }

        if (data.criticalMissingSkills && data.criticalMissingSkills.length > 0) {
            needsPage(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...C.danger);
            pdf.text('Critical Missing Skills', margin + 2, y);
            y += 5;
            drawKeywordTags(data.criticalMissingSkills, [153, 27, 27], [254, 226, 226]); // red text on red-100
        }
    }

    // ══════════════════════════════════════════════════════════
    // KEYWORD ANALYSIS
    // ══════════════════════════════════════════════════════════
    if ((data.matchedKeywords && data.matchedKeywords.length > 0) ||
        (data.missingKeywords && data.missingKeywords.length > 0)) {
        drawSectionTitle('Keyword Analysis', C.info);

        if (data.matchedKeywords && data.matchedKeywords.length > 0) {
            needsPage(10);
            const matchCount = data.matchedKeywords.length;
            const totalCount = matchCount + (data.missingKeywords || []).length;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...C.success);
            pdf.text(`Matched Keywords (${matchCount}/${totalCount})`, margin + 2, y);
            y += 5;
            drawKeywordTags(data.matchedKeywords, [6, 95, 70], [209, 250, 229]);
        }

        if (data.missingKeywords && data.missingKeywords.length > 0) {
            needsPage(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...C.danger);
            pdf.text(`Missing Keywords (${data.missingKeywords.length})`, margin + 2, y);
            y += 5;
            drawKeywordTags(data.missingKeywords, [153, 27, 27], [254, 226, 226]);
        }
    }

    // ══════════════════════════════════════════════════════════
    // SKILL GAPS
    // ══════════════════════════════════════════════════════════
    if (data.skillGaps && data.skillGaps.length > 0) {
        drawSectionTitle('Skill Gaps Identified', C.warning);
        drawNumberedList(data.skillGaps, C.dark);
    }

    // ══════════════════════════════════════════════════════════
    // IMPROVEMENT SUGGESTIONS
    // ══════════════════════════════════════════════════════════
    if (data.suggestions && data.suggestions.length > 0) {
        drawSectionTitle('Improvement Suggestions', C.primary);
        drawNumberedList(data.suggestions, C.dark);
    }

    // ══════════════════════════════════════════════════════════
    // COMPETITIVE ANALYSIS
    // ══════════════════════════════════════════════════════════
    if (data.competitiveAnalysis) {
        drawSectionTitle('Competitive Analysis', C.secondary);
        // Embed in a light box
        needsPage(12);
        pdf.setFillColor(245, 243, 255);  // violet-50
        const caText = String(data.competitiveAnalysis);
        const caLines = pdf.splitTextToSize(caText, contentWidth - 14);
        const caH = caLines.length * 4.5 + 6;
        pdf.roundedRect(margin, y - 4, contentWidth, caH, 3, 3, 'F');
        pdf.setFillColor(...C.secondary);
        pdf.roundedRect(margin, y - 4, 3, caH, 1.5, 1.5, 'F');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...C.dark);
        caLines.forEach(line => {
            needsPage(4.5);
            pdf.text(line, margin + 7, y);
            y += 4.5;
        });
        y += 5;
    }

    // ══════════════════════════════════════════════════════════
    // OVERALL FEEDBACK
    // ══════════════════════════════════════════════════════════
    if (data.overallFeedback) {
        drawSectionTitle('Overall Feedback', C.primary);
        // Embed in a light box
        needsPage(12);
        pdf.setFillColor(238, 242, 255);  // indigo-50
        const ofText = String(data.overallFeedback);
        const ofLines = pdf.splitTextToSize(ofText, contentWidth - 14);
        const ofH = ofLines.length * 4.5 + 6;
        pdf.roundedRect(margin, y - 4, contentWidth, ofH, 3, 3, 'F');
        pdf.setFillColor(...C.primary);
        pdf.roundedRect(margin, y - 4, 3, ofH, 1.5, 1.5, 'F');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...C.dark);
        ofLines.forEach(line => {
            needsPage(4.5);
            pdf.text(line, margin + 7, y);
            y += 4.5;
        });
        y += 5;
    }

    // ══════════════════════════════════════════════════════════
    // FOOTER on every page
    // ══════════════════════════════════════════════════════════
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // Footer line
        pdf.setDrawColor(...C.barBg);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        // Footer text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...C.muted);
        pdf.text(
            `ResuMentor AI  •  ${dateStr}  •  Page ${i} of ${totalPages}`,
            pageWidth / 2, pageHeight - 8, { align: 'center' }
        );
    }

    // Save
    const roleName = (data.jobRole || 'report').replace(/\s+/g, '-').toLowerCase();
    const filename = `resume-analysis-${roleName}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
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
