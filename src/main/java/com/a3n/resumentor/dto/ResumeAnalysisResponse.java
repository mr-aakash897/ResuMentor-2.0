package com.a3n.resumentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisResponse {
    private Long resumeId;
    private Integer atsScore;
    private String jobRole;
    
    // Keywords Analysis
    private List<String> matchedKeywords;
    private List<String> missingKeywords;
    
    // Suggestions and Feedback
    private List<String> suggestions;
    private String overallFeedback;
    private List<String> skillGaps;
    
    // Additional Analysis Fields
    private Integer keywordMatchPercentage;
    private Integer structureScore;
    private Integer experienceScore;
    private Integer softSkillsScore;
    private String resumeStrength;
    private List<String> topMatchedSkills;
    private List<String> criticalMissingSkills;
    private String competitiveAnalysis;
    
    // ATS Friendliness Breakdown
    private Integer atsFriendlinessScore;
    private Integer formattingScore;
    private Integer parsabilityScore;
    private Integer contactInfoScore;
    private Integer sectionOrganizationScore;
    private Integer keywordDensityScore;
    private List<String> atsIssues;
    private List<String> atsTips;
}
