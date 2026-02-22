package com.a3n.resumentor.util;

import com.a3n.resumentor.dto.ResumeAnalysisResponse;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class MockAIAnalyzer {

    private static final int TOTAL_QUESTIONS = 18;

    // ==================== RESUME ANALYSIS ====================

    public ResumeAnalysisResponse analyzeResume(String resumeText, String jobRole, String jobDescription) {
        String textLower = resumeText.toLowerCase();
        String roleLower = jobRole.toLowerCase();
        String descLower = jobDescription != null ? jobDescription.toLowerCase() : "";

        // Get role-specific requirements
        Map<String, List<String>> requirements = getRoleRequirements(roleLower);
        List<String> requiredSkills = requirements.get("required");
        List<String> preferredSkills = requirements.get("preferred");
        List<String> softSkills = requirements.get("soft");

        // Analyze skills
        List<String> matchedKeywords = new ArrayList<>();
        List<String> missingKeywords = new ArrayList<>();
        List<String> foundSkills = new ArrayList<>();

        // Check required skills
        for (String skill : requiredSkills) {
            if (containsSkill(textLower, skill)) {
                matchedKeywords.add(skill);
                foundSkills.add(skill);
            } else {
                missingKeywords.add(skill);
            }
        }

        // Check preferred skills
        for (String skill : preferredSkills) {
            if (containsSkill(textLower, skill)) {
                matchedKeywords.add(skill);
            }
        }

        // Check soft skills
        List<String> matchedSoftSkills = new ArrayList<>();
        for (String skill : softSkills) {
            if (containsSkill(textLower, skill)) {
                matchedSoftSkills.add(skill);
            }
        }

        // Calculate comprehensive ATS score and component scores
        double structureScore = analyzeStructure(resumeText) * 100;
        double experienceScore = analyzeExperience(resumeText) * 100;
        double softSkillsScore = matchedSoftSkills.size() / 5.0 * 100;
        
        int atsScore = calculateATSScore(resumeText, matchedKeywords, missingKeywords, 
                                          requiredSkills, preferredSkills, matchedSoftSkills);

        // Calculate keyword match percentage
        int totalKeywords = requiredSkills.size() + preferredSkills.size();
        int keywordMatchPercentage = totalKeywords > 0 ? 
            (matchedKeywords.size() * 100) / totalKeywords : 0;

        // Generate detailed feedback and suggestions
        List<String> suggestions = generateDetailedSuggestions(resumeText, matchedKeywords, 
                                                                missingKeywords, jobRole);
        List<String> skillGaps = identifySkillGaps(missingKeywords, jobRole);
        String overallFeedback = generateOverallFeedback(atsScore, matchedKeywords, 
                                                          missingKeywords, jobRole);

        // Determine resume strength
        String resumeStrength;
        if (atsScore >= 85) resumeStrength = "EXCELLENT";
        else if (atsScore >= 70) resumeStrength = "STRONG";
        else if (atsScore >= 55) resumeStrength = "GOOD";
        else if (atsScore >= 40) resumeStrength = "AVERAGE";
        else resumeStrength = "NEEDS_IMPROVEMENT";

        // Get top matched skills (first 5)
        List<String> topMatchedSkills = matchedKeywords.stream()
            .limit(5)
            .collect(Collectors.toList());

        // Get critical missing skills (required skills that are missing)
        List<String> criticalMissingSkills = missingKeywords.stream()
            .filter(requiredSkills::contains)
            .limit(5)
            .collect(Collectors.toList());

        // Generate competitive analysis
        String competitiveAnalysis = generateCompetitiveAnalysis(atsScore, matchedKeywords.size(), 
                                                                  missingKeywords.size(), jobRole);

        // Calculate ATS Friendliness Breakdown
        Map<String, Object> atsFriendliness = calculateATSFriendliness(resumeText, matchedKeywords, missingKeywords);

        // Build response
        ResumeAnalysisResponse response = new ResumeAnalysisResponse();
        response.setAtsScore(atsScore);
        response.setJobRole(jobRole);
        response.setMatchedKeywords(matchedKeywords);
        response.setMissingKeywords(missingKeywords);
        response.setSuggestions(suggestions);
        response.setSkillGaps(skillGaps);
        response.setOverallFeedback(overallFeedback);
        
        // Set additional analysis fields
        response.setKeywordMatchPercentage(keywordMatchPercentage);
        response.setStructureScore((int) Math.round(structureScore));
        response.setExperienceScore((int) Math.round(experienceScore));
        response.setSoftSkillsScore((int) Math.min(Math.round(softSkillsScore), 100));
        response.setResumeStrength(resumeStrength);
        response.setTopMatchedSkills(topMatchedSkills);
        response.setCriticalMissingSkills(criticalMissingSkills);
        response.setCompetitiveAnalysis(competitiveAnalysis);
        
        // Set ATS Friendliness fields
        response.setAtsFriendlinessScore((Integer) atsFriendliness.get("overallScore"));
        response.setFormattingScore((Integer) atsFriendliness.get("formattingScore"));
        response.setParsabilityScore((Integer) atsFriendliness.get("parsabilityScore"));
        response.setContactInfoScore((Integer) atsFriendliness.get("contactInfoScore"));
        response.setSectionOrganizationScore((Integer) atsFriendliness.get("sectionOrganizationScore"));
        response.setKeywordDensityScore((Integer) atsFriendliness.get("keywordDensityScore"));
        response.setAtsIssues((List<String>) atsFriendliness.get("issues"));
        response.setAtsTips((List<String>) atsFriendliness.get("tips"));

        return response;
    }

    private String generateCompetitiveAnalysis(int atsScore, int matched, int missing, String jobRole) {
        StringBuilder analysis = new StringBuilder();
        
        if (atsScore >= 85) {
            analysis.append("🏆 TOP TIER CANDIDATE\n\n");
            analysis.append("Your resume places you in the top 10-15% of applicants for ").append(jobRole).append(" positions. ");
            analysis.append("With ").append(matched).append(" matching skills and strong ATS optimization, ");
            analysis.append("you're highly likely to pass automated screening systems.\n\n");
            analysis.append("💼 Expected Callback Rate: 60-80%\n");
            analysis.append("🎯 Recommended: Apply to senior-level positions and negotiate confidently.");
        } else if (atsScore >= 70) {
            analysis.append("✅ COMPETITIVE CANDIDATE\n\n");
            analysis.append("Your resume is well-positioned among applicants for ").append(jobRole).append(" roles. ");
            analysis.append("You have ").append(matched).append(" relevant skills, putting you ahead of average candidates. ");
            analysis.append("Addressing ").append(Math.min(missing, 3)).append(" key skill gaps could elevate you to top-tier status.\n\n");
            analysis.append("💼 Expected Callback Rate: 35-55%\n");
            analysis.append("🎯 Recommended: Target mid to senior-level positions.");
        } else if (atsScore >= 55) {
            analysis.append("👍 MODERATE CANDIDATE\n\n");
            analysis.append("Your resume shows potential but faces competition for ").append(jobRole).append(" positions. ");
            analysis.append("With ").append(matched).append(" matching skills, you meet basic requirements but ");
            analysis.append("need ").append(missing).append(" additional skills to stand out.\n\n");
            analysis.append("💼 Expected Callback Rate: 15-30%\n");
            analysis.append("🎯 Recommended: Focus on skill development before applying widely.");
        } else if (atsScore >= 40) {
            analysis.append("⚠️ BELOW AVERAGE FIT\n\n");
            analysis.append("Your resume shows limited alignment with typical ").append(jobRole).append(" job requirements. ");
            analysis.append("Many applications may be filtered out by ATS systems. Consider:\n");
            analysis.append("• Taking relevant courses or certifications\n");
            analysis.append("• Gaining project experience in missing skill areas\n");
            analysis.append("• Targeting entry-level or adjacent roles\n\n");
            analysis.append("💼 Expected Callback Rate: 5-15%\n");
            analysis.append("🎯 Recommended: Build skills before applying.");
        } else {
            analysis.append("📚 SIGNIFICANT PREPARATION NEEDED\n\n");
            analysis.append("Your current resume is unlikely to pass ATS screening for ").append(jobRole).append(" positions. ");
            analysis.append("This isn't a reflection of your potential - it means the resume needs substantial revision.\n\n");
            analysis.append("Action Plan:\n");
            analysis.append("1. Complete online courses in core ").append(jobRole).append(" technologies\n");
            analysis.append("2. Build 2-3 portfolio projects demonstrating key skills\n");
            analysis.append("3. Obtain relevant certifications\n");
            analysis.append("4. Consider internships or entry-level adjacent roles\n\n");
            analysis.append("💼 Expected Callback Rate: <5%\n");
            analysis.append("🎯 Recommended: Invest 3-6 months in skill building.");
        }
        
        return analysis.toString();
    }

    private boolean containsSkill(String text, String skill) {
        String skillLower = skill.toLowerCase();
        // Check for exact match or variations
        String pattern = "\\b" + Pattern.quote(skillLower) + "\\b";
        return Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text).find();
    }

    private int calculateATSScore(String resumeText, List<String> matched, List<String> missing,
                                   List<String> required, List<String> preferred, 
                                   List<String> matchedSoft) {
        double score = 0;
        
        // Base score - everyone starts with some credit (15 points)
        score += 15;
        
        // 1. Required Skills Match (30% weight - reduced from 40%)
        double requiredMatchRate = required.isEmpty() ? 0.5 : 
            (double) matched.stream().filter(required::contains).count() / required.size();
        score += requiredMatchRate * 30;
        
        // 2. Preferred Skills Match (15% weight - reduced, more lenient)
        long preferredMatched = matched.stream().filter(preferred::contains).count();
        double preferredMatchRate = preferred.isEmpty() ? 0.5 : 
            Math.min((double) preferredMatched / Math.max(preferred.size() / 2, 1), 1.0);
        score += preferredMatchRate * 15;
        
        // 3. Resume Structure & Format (15% weight)
        double structureScore = analyzeStructure(resumeText);
        score += structureScore * 15;
        
        // 4. Experience & Achievements (12% weight - reduced)
        double experienceScore = analyzeExperience(resumeText);
        score += experienceScore * 12;
        
        // 5. Soft Skills (8% weight - reduced, more lenient)
        double softSkillRate = matchedSoft.size() / 3.0; // Reduced from 5 to 3 expected
        score += Math.min(softSkillRate, 1.0) * 8;
        
        // 6. Bonus for having any relevant skills (up to 5 points)
        if (matched.size() >= 3) score += 5;
        else if (matched.size() >= 1) score += 3;
        
        return (int) Math.min(Math.round(score), 100);
    }

    private double analyzeStructure(String text) {
        double score = 0;
        String textLower = text.toLowerCase();
        
        // Check for essential sections
        String[] sections = {"experience", "education", "skills", "projects", "summary", 
                            "objective", "certifications", "achievements"};
        int sectionCount = 0;
        for (String section : sections) {
            if (textLower.contains(section)) sectionCount++;
        }
        score += Math.min(sectionCount / 5.0, 1.0) * 0.4;
        
        // Check for contact info
        boolean hasEmail = text.contains("@") && (textLower.contains(".com") || 
                          textLower.contains(".edu") || textLower.contains(".org"));
        boolean hasPhone = Pattern.compile("\\d{3}[-.]?\\d{3}[-.]?\\d{4}").matcher(text).find();
        boolean hasLinkedIn = textLower.contains("linkedin");
        if (hasEmail) score += 0.2;
        if (hasPhone) score += 0.2;
        if (hasLinkedIn) score += 0.1;
        
        // Check for proper length (300-1500 words ideal)
        int wordCount = text.split("\\s+").length;
        if (wordCount >= 300 && wordCount <= 1500) score += 0.1;
        else if (wordCount >= 200 && wordCount <= 2000) score += 0.05;
        
        return Math.min(score, 1.0);
    }

    private double analyzeExperience(String text) {
        double score = 0;
        String textLower = text.toLowerCase();
        
        // Action verbs
        String[] actionVerbs = {"developed", "implemented", "designed", "created", "managed", 
                               "led", "built", "improved", "increased", "reduced", "achieved",
                               "delivered", "launched", "optimized", "automated", "integrated"};
        int verbCount = 0;
        for (String verb : actionVerbs) {
            if (textLower.contains(verb)) verbCount++;
        }
        score += Math.min(verbCount / 8.0, 1.0) * 0.4;
        
        // Quantifiable achievements (numbers, percentages)
        Pattern numberPattern = Pattern.compile("\\d+%|\\$\\d+|\\d+\\+|\\d+ years?");
        Matcher matcher = numberPattern.matcher(text);
        int metricCount = 0;
        while (matcher.find()) metricCount++;
        score += Math.min(metricCount / 5.0, 1.0) * 0.4;
        
        // Years of experience mentioned
        if (textLower.contains("years of experience") || 
            textLower.contains("years experience")) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    private Map<String, Object> calculateATSFriendliness(String text, List<String> matchedKeywords, List<String> missingKeywords) {
        Map<String, Object> result = new HashMap<>();
        List<String> issues = new ArrayList<>();
        List<String> tips = new ArrayList<>();
        String textLower = text.toLowerCase();
        
        // 1. Formatting Score (avoid complex formatting)
        int formattingScore = 100;
        if (text.contains("│") || text.contains("║") || text.contains("═") || text.contains("┌")) {
            formattingScore -= 25;
            issues.add("Resume contains special characters/table formatting that may confuse ATS");
        }
        if (text.contains("■") || text.contains("▪") || text.contains("●") || text.contains("○")) {
            formattingScore -= 10;
            issues.add("Decorative bullet characters may not be parsed correctly");
        }
        if (text.split("\n").length < 15) {
            formattingScore -= 15;
            issues.add("Resume appears too short or may have formatting issues");
        }
        // Check for consistent formatting
        int wordCount = text.split("\\s+").length;
        if (wordCount >= 200 && wordCount <= 800) {
            formattingScore = Math.min(formattingScore + 10, 100);
        }
        formattingScore = Math.max(formattingScore, 20);
        
        // 2. Parsability Score (standard sections, readable text)
        int parsabilityScore = 0;
        String[] requiredSections = {"experience", "education", "skills"};
        String[] optionalSections = {"summary", "objective", "projects", "certifications", "achievements"};
        int foundRequired = 0;
        int foundOptional = 0;
        for (String section : requiredSections) {
            if (textLower.contains(section)) foundRequired++;
        }
        for (String section : optionalSections) {
            if (textLower.contains(section)) foundOptional++;
        }
        parsabilityScore = (int) ((foundRequired / 3.0 * 60) + Math.min(foundOptional / 2.0 * 40, 40));
        if (foundRequired < 3) {
            issues.add("Missing standard sections: Experience, Education, or Skills");
            tips.add("Add clear section headers like 'Work Experience', 'Education', 'Skills'");
        }
        
        // 3. Contact Info Score
        int contactInfoScore = 0;
        boolean hasEmail = text.contains("@") && (textLower.contains(".com") || textLower.contains(".edu") || textLower.contains(".org") || textLower.contains(".io"));
        boolean hasPhone = Pattern.compile("\\(?\\d{3}\\)?[-.]?\\s?\\d{3}[-.]?\\d{4}").matcher(text).find();
        boolean hasLinkedIn = textLower.contains("linkedin");
        boolean hasGitHub = textLower.contains("github");
        boolean hasLocation = textLower.contains("city") || textLower.contains("state") || Pattern.compile("\\b[A-Z][a-z]+,\\s*[A-Z]{2}\\b").matcher(text).find();
        
        if (hasEmail) contactInfoScore += 35;
        else issues.add("No email address found");
        if (hasPhone) contactInfoScore += 30;
        else issues.add("No phone number found");
        if (hasLinkedIn) contactInfoScore += 20;
        else tips.add("Add your LinkedIn profile URL");
        if (hasGitHub || hasLocation) contactInfoScore += 15;
        contactInfoScore = Math.min(contactInfoScore, 100);
        
        // 4. Section Organization Score
        int sectionOrgScore = 0;
        // Check if sections appear in logical order
        int expPos = textLower.indexOf("experience");
        int eduPos = textLower.indexOf("education");
        int skillPos = textLower.indexOf("skills");
        
        if (expPos >= 0 && eduPos >= 0 && skillPos >= 0) {
            sectionOrgScore = 70; // Has all major sections
            // Bonus for good ordering
            if (expPos < eduPos) sectionOrgScore += 15;
            if (skillPos > 0) sectionOrgScore += 15;
        } else if (expPos >= 0 || eduPos >= 0) {
            sectionOrgScore = 50;
            issues.add("Consider adding clear section dividers");
        } else {
            sectionOrgScore = 30;
            issues.add("Resume structure is unclear - add standard sections");
        }
        sectionOrgScore = Math.min(sectionOrgScore, 100);
        
        // 5. Keyword Density Score
        int keywordDensityScore;
        int totalKeywords = matchedKeywords.size() + missingKeywords.size();
        if (totalKeywords == 0) {
            keywordDensityScore = 50;
        } else {
            double density = (double) matchedKeywords.size() / totalKeywords;
            keywordDensityScore = (int) (density * 100);
        }
        if (keywordDensityScore < 50) {
            issues.add("Low keyword match - resume may be filtered by ATS");
            tips.add("Include more role-specific keywords from the job description");
        } else if (keywordDensityScore >= 80) {
            tips.add("Excellent keyword optimization!");
        }
        
        // Calculate overall ATS Friendliness Score
        int overallScore = (int) (
            formattingScore * 0.20 +
            parsabilityScore * 0.25 +
            contactInfoScore * 0.15 +
            sectionOrgScore * 0.20 +
            keywordDensityScore * 0.20
        );
        
        // Add general tips
        if (tips.isEmpty()) {
            if (overallScore >= 80) {
                tips.add("Your resume is well-optimized for ATS systems");
            } else {
                tips.add("Use standard fonts like Arial, Calibri, or Times New Roman");
                tips.add("Avoid images, graphics, or complex tables");
            }
        }
        
        result.put("overallScore", overallScore);
        result.put("formattingScore", formattingScore);
        result.put("parsabilityScore", parsabilityScore);
        result.put("contactInfoScore", contactInfoScore);
        result.put("sectionOrganizationScore", sectionOrgScore);
        result.put("keywordDensityScore", keywordDensityScore);
        result.put("issues", issues);
        result.put("tips", tips);
        
        return result;
    }

    private Map<String, List<String>> getRoleRequirements(String role) {
        Map<String, List<String>> requirements = new HashMap<>();
        
        // Default skills
        List<String> required = new ArrayList<>();
        List<String> preferred = new ArrayList<>();
        List<String> soft = Arrays.asList("communication", "teamwork", "problem-solving", 
                                          "leadership", "time management", "adaptability",
                                          "critical thinking", "collaboration");

        if (role.contains("backend") || role.contains("java") || role.contains("spring")) {
            required = Arrays.asList("java", "spring boot", "rest api", "sql", "git", 
                                    "microservices", "database", "maven", "junit");
            preferred = Arrays.asList("kubernetes", "docker", "aws", "kafka", "redis", 
                                     "mongodb", "hibernate", "ci/cd", "jenkins");
        } else if (role.contains("frontend") || role.contains("react") || role.contains("angular")) {
            required = Arrays.asList("javascript", "html", "css", "react", "typescript", 
                                    "responsive design", "git", "npm");
            preferred = Arrays.asList("redux", "webpack", "jest", "graphql", "tailwind", 
                                     "next.js", "vue", "sass", "figma");
        } else if (role.contains("fullstack") || role.contains("full stack")) {
            required = Arrays.asList("javascript", "html", "css", "node.js", "react", 
                                    "sql", "rest api", "git");
            preferred = Arrays.asList("typescript", "mongodb", "docker", "aws", "graphql", 
                                     "redis", "ci/cd", "kubernetes");
        } else if (role.contains("data scientist") || role.contains("data science")) {
            required = Arrays.asList("python", "machine learning", "sql", "statistics", 
                                    "pandas", "numpy", "data visualization", "jupyter");
            preferred = Arrays.asList("tensorflow", "pytorch", "scikit-learn", "spark", 
                                     "tableau", "deep learning", "nlp", "r");
        } else if (role.contains("machine learning") || role.contains("ml engineer")) {
            required = Arrays.asList("python", "tensorflow", "pytorch", "machine learning", 
                                    "deep learning", "numpy", "pandas", "scikit-learn");
            preferred = Arrays.asList("mlops", "kubernetes", "aws sagemaker", "computer vision", 
                                     "nlp", "transformers", "hugging face", "onnx");
        } else if (role.contains("devops") || role.contains("sre") || role.contains("site reliability")) {
            required = Arrays.asList("docker", "kubernetes", "ci/cd", "linux", "aws", 
                                    "terraform", "jenkins", "git");
            preferred = Arrays.asList("ansible", "prometheus", "grafana", "helm", "azure", 
                                     "gcp", "python", "bash", "istio");
        } else if (role.contains("cloud") || role.contains("aws") || role.contains("azure")) {
            required = Arrays.asList("aws", "cloud architecture", "ec2", "s3", "vpc", 
                                    "iam", "lambda", "cloudformation");
            preferred = Arrays.asList("azure", "gcp", "kubernetes", "terraform", "docker", 
                                     "serverless", "dynamodb", "rds");
        } else if (role.contains("security") || role.contains("cybersecurity")) {
            required = Arrays.asList("security", "penetration testing", "vulnerability assessment", 
                                    "siem", "firewalls", "encryption", "network security");
            preferred = Arrays.asList("owasp", "soc", "incident response", "compliance", "cissp", 
                                     "ethical hacking", "python", "splunk");
        } else if (role.contains("qa") || role.contains("test") || role.contains("quality")) {
            required = Arrays.asList("test automation", "selenium", "junit", "api testing", 
                                    "manual testing", "test cases", "bug tracking", "agile");
            preferred = Arrays.asList("cypress", "postman", "jira", "performance testing", 
                                     "cucumber", "jenkins", "python", "javascript");
        } else if (role.contains("mobile") || role.contains("android") || role.contains("ios")) {
            required = Arrays.asList("mobile development", "android", "ios", "java", "kotlin", 
                                    "swift", "rest api", "git");
            preferred = Arrays.asList("react native", "flutter", "firebase", "mvvm", 
                                     "unit testing", "ci/cd", "app store");
        } else if (role.contains("product manager") || role.contains("product owner")) {
            required = Arrays.asList("product management", "agile", "scrum", "roadmap", 
                                    "stakeholder management", "user stories", "jira");
            preferred = Arrays.asList("data analysis", "a/b testing", "ux", "sql", 
                                     "analytics", "okr", "customer research");
        } else if (role.contains("ui") || role.contains("ux") || role.contains("designer")) {
            required = Arrays.asList("ui design", "ux design", "figma", "wireframing", 
                                    "prototyping", "user research", "design systems");
            preferred = Arrays.asList("adobe xd", "sketch", "usability testing", "html", 
                                     "css", "accessibility", "motion design");
        } else if (role.contains("data engineer")) {
            required = Arrays.asList("python", "sql", "etl", "spark", "data pipelines", 
                                    "airflow", "aws", "data warehousing");
            preferred = Arrays.asList("kafka", "snowflake", "dbt", "redshift", "databricks", 
                                     "hadoop", "scala", "kubernetes");
        } else if (role.contains("architect") || role.contains("solution")) {
            required = Arrays.asList("system design", "architecture", "microservices", 
                                    "cloud", "api design", "scalability", "security");
            preferred = Arrays.asList("aws", "azure", "kubernetes", "event-driven", 
                                     "domain-driven design", "togaf", "caching");
        } else if (role.contains("blockchain")) {
            required = Arrays.asList("blockchain", "solidity", "ethereum", "smart contracts", 
                                    "web3", "cryptography", "javascript");
            preferred = Arrays.asList("hyperledger", "defi", "nft", "rust", "truffle", 
                                     "hardhat", "node.js");
        } else {
            // Generic software developer
            required = Arrays.asList("programming", "software development", "git", 
                                    "problem-solving", "sql", "api", "agile");
            preferred = Arrays.asList("java", "python", "javascript", "aws", "docker", 
                                     "testing", "ci/cd");
        }

        requirements.put("required", required);
        requirements.put("preferred", preferred);
        requirements.put("soft", soft);
        return requirements;
    }

    private List<String> generateDetailedSuggestions(String text, List<String> matched, 
                                                      List<String> missing, String jobRole) {
        List<String> suggestions = new ArrayList<>();
        String textLower = text.toLowerCase();

        // ========== KEYWORD INTEGRATION SUGGESTIONS ==========
        if (!missing.isEmpty()) {
            // Group missing skills by category
            Map<String, List<String>> categorizedMissing = categorizeMissingSkills(missing, jobRole);
            
            suggestions.add("🎯 MISSING KEYWORDS - HOW TO ADD THEM NATURALLY\n");
            
            // Technical skills with placement guidance
            if (categorizedMissing.containsKey("technical")) {
                List<String> techSkills = categorizedMissing.get("technical");
                suggestions.add("📋 Technical Skills (" + String.join(", ", techSkills.subList(0, Math.min(4, techSkills.size()))) + "):");
                suggestions.add("   → Add to Skills section: Group by category (Languages, Frameworks, Tools)");
                suggestions.add("   → Integrate in Experience: 'Developed REST APIs using Spring Boot...'");
                suggestions.add("   → Include in Projects: 'Built microservice architecture with Docker/Kubernetes'");
            }
            
            // Soft skills with integration examples
            if (categorizedMissing.containsKey("soft")) {
                List<String> softSkills = categorizedMissing.get("soft");
                suggestions.add("💬 Soft Skills (" + String.join(", ", softSkills.subList(0, Math.min(3, softSkills.size()))) + "):");
                suggestions.add("   → Show through achievements: 'Led cross-functional team of 5 engineers'");
                suggestions.add("   → Demonstrate in action: 'Collaborated with stakeholders to define requirements'");
                suggestions.add("   → Quantify impact: 'Mentored 3 junior developers, reducing onboarding time by 40%'");
            }
            
            // Tool/Platform skills
            if (categorizedMissing.containsKey("tools")) {
                List<String> tools = categorizedMissing.get("tools");
                suggestions.add("🔧 Tools & Platforms (" + String.join(", ", tools.subList(0, Math.min(3, tools.size()))) + "):");
                suggestions.add("   → Add dedicated Tools section under Skills");
                suggestions.add("   → Reference in achievements: 'Automated CI/CD pipeline using Jenkins/GitHub Actions'");
                suggestions.add("   → Include certifications if available");
            }
        }

        // ========== SPECIFIC PLACEMENT RECOMMENDATIONS ==========
        suggestions.add("\n📍 WHERE TO PLACE KEYWORDS:\n");
        
        // Summary section
        if (!textLower.contains("summary") && !textLower.contains("objective")) {
            suggestions.add("📝 Professional Summary (Add at top):");
            suggestions.add("   Template: '[Years] experienced [Role] skilled in [Top 3-4 Keywords].");
            suggestions.add("   Proven track record of [Achievement with keyword]. Seeking to leverage");
            suggestions.add("   [Keyword] expertise as [Target Role] at [Company].'");
        } else {
            suggestions.add("📝 Professional Summary: Front-load with your strongest matching keywords");
        }
        
        // Skills section
        if (!textLower.contains("technical skills") && !textLower.contains("core competencies")) {
            suggestions.add("🔑 Skills Section (Organize by category):");
            suggestions.add("   • Languages: Java, Python, JavaScript");
            suggestions.add("   • Frameworks: Spring Boot, React, Node.js");
            suggestions.add("   • Tools: Git, Docker, Jenkins, AWS");
            suggestions.add("   • Databases: MySQL, MongoDB, Redis");
        }
        
        // Experience section keyword density
        suggestions.add("💼 Experience Section: Aim for 2-3 keywords per bullet point");
        suggestions.add("   Before: 'Worked on backend services'");
        suggestions.add("   After: 'Designed and deployed RESTful microservices using Spring Boot and Docker'");

        // Quantifiable achievements
        Pattern numberPattern = Pattern.compile("\\d+%|\\$\\d+");
        if (!numberPattern.matcher(text).find()) {
            suggestions.add("\n📊 ADD METRICS (Critical for ATS & Impact):");
            suggestions.add("   • Performance: 'Improved API response time by 60%'");
            suggestions.add("   • Scale: 'Processed 1M+ daily transactions'");
            suggestions.add("   • Team: 'Led team of 8 engineers across 3 time zones'");
            suggestions.add("   • Business: 'Reduced infrastructure costs by $50K annually'");
        }

        // Action verbs
        String[] strongVerbs = {"spearheaded", "orchestrated", "revolutionized", "pioneered", "architected"};
        boolean hasStrongVerbs = false;
        for (String verb : strongVerbs) {
            if (textLower.contains(verb)) hasStrongVerbs = true;
        }
        if (!hasStrongVerbs) {
            suggestions.add("\n💪 USE POWER VERBS:");
            suggestions.add("   Replace: 'Worked on' → 'Architected', 'Spearheaded', 'Engineered'");
            suggestions.add("   Replace: 'Helped with' → 'Drove', 'Championed', 'Accelerated'");
            suggestions.add("   Replace: 'Was responsible for' → 'Owned', 'Directed', 'Orchestrated'");
        }

        // Project section
        if (!textLower.contains("project") && !textLower.contains("portfolio")) {
            suggestions.add("\n🚀 ADD PROJECTS SECTION:");
            suggestions.add("   Format: Project Name | Technologies Used (keyword-rich)");
            suggestions.add("   • Describe problem solved using technical keywords");
            suggestions.add("   • Include metrics: users, performance, scale");
            suggestions.add("   • Link to GitHub/live demo if available");
        }

        // Certifications
        if (!textLower.contains("certification") && !textLower.contains("certified")) {
            suggestions.add("\n🏆 CERTIFICATIONS (Boosts ATS Score):");
            suggestions.add("   Consider: AWS Certified, Google Cloud, Azure, Kubernetes (CKA)");
            suggestions.add("   Format: 'AWS Certified Solutions Architect - Associate (2024)'");
        }

        // LinkedIn
        if (!textLower.contains("linkedin")) {
            suggestions.add("\n🔗 ADD LINKEDIN URL:");
            suggestions.add("   Customize your URL: linkedin.com/in/yourname");
            suggestions.add("   Ensure LinkedIn keywords match resume for consistency");
        }

        // Keywords already good
        if (matched.size() >= 8) {
            suggestions.add("\n✅ STRONG KEYWORD PRESENCE:");
            suggestions.add("   Your resume already matches " + matched.size() + " key terms.");
            suggestions.add("   Focus on context and demonstrating impact with these skills.");
        }

        // ATS formatting reminder
        suggestions.add("\n📋 ATS-FRIENDLY FORMATTING:");
        suggestions.add("   • Use standard fonts (Arial, Calibri, Times New Roman)");
        suggestions.add("   • Avoid tables, graphics, headers/footers");
        suggestions.add("   • Use standard section headers (Experience, Education, Skills)");
        suggestions.add("   • Save as PDF or DOCX (PDF preferred for formatting)");

        return suggestions;
    }
    
    private Map<String, List<String>> categorizeMissingSkills(List<String> missing, String jobRole) {
        Map<String, List<String>> categorized = new HashMap<>();
        List<String> technical = new ArrayList<>();
        List<String> soft = new ArrayList<>();
        List<String> tools = new ArrayList<>();
        
        String[] softSkillsList = {"communication", "teamwork", "leadership", "problem-solving", 
                                   "collaboration", "adaptability", "critical thinking", "time management"};
        String[] toolsList = {"git", "docker", "kubernetes", "jenkins", "aws", "azure", "gcp", 
                             "jira", "confluence", "slack", "figma", "postman"};
        
        for (String skill : missing) {
            String skillLower = skill.toLowerCase();
            boolean isSoft = false;
            boolean isTool = false;
            
            for (String soft1 : softSkillsList) {
                if (skillLower.contains(soft1)) {
                    soft.add(skill);
                    isSoft = true;
                    break;
                }
            }
            
            if (!isSoft) {
                for (String tool : toolsList) {
                    if (skillLower.contains(tool)) {
                        tools.add(skill);
                        isTool = true;
                        break;
                    }
                }
            }
            
            if (!isSoft && !isTool) {
                technical.add(skill);
            }
        }
        
        if (!technical.isEmpty()) categorized.put("technical", technical);
        if (!soft.isEmpty()) categorized.put("soft", soft);
        if (!tools.isEmpty()) categorized.put("tools", tools);
        
        return categorized;
    }

    private List<String> identifySkillGaps(List<String> missing, String jobRole) {
        List<String> gaps = new ArrayList<>();
        
        if (missing.isEmpty()) {
            gaps.add("✅ You have strong coverage of essential skills for " + jobRole);
            return gaps;
        }

        // Categorize missing skills
        List<String> critical = new ArrayList<>();
        List<String> important = new ArrayList<>();
        
        Map<String, List<String>> requirements = getRoleRequirements(jobRole.toLowerCase());
        List<String> required = requirements.get("required");
        
        for (String skill : missing) {
            if (required.contains(skill)) {
                critical.add(skill);
            } else {
                important.add(skill);
            }
        }

        if (!critical.isEmpty()) {
            gaps.add("🔴 Critical Gaps (Must Address): " + String.join(", ", critical));
            gaps.add("💡 These are core requirements - consider online courses, certifications, or project experience");
        }

        if (!important.isEmpty()) {
            gaps.add("🟡 Nice-to-Have Gaps: " + String.join(", ", important.subList(0, Math.min(5, important.size()))));
            gaps.add("💡 These boost competitiveness but aren't dealbreakers");
        }

        return gaps;
    }

    private String generateOverallFeedback(int atsScore, List<String> matched, 
                                           List<String> missing, String jobRole) {
        StringBuilder feedback = new StringBuilder();
        
        // Score-based assessment
        if (atsScore >= 85) {
            feedback.append("🌟 EXCELLENT MATCH!\n\n");
            feedback.append("Your resume is exceptionally well-aligned with ").append(jobRole).append(" requirements. ");
            feedback.append("You demonstrate strong technical expertise with ").append(matched.size()).append(" matching skills. ");
            feedback.append("Your profile stands out among applicants, and you're likely to pass ATS screening with flying colors.\n\n");
            feedback.append("📈 Competitive Advantage: Top 15% of applicants for this role.");
        } else if (atsScore >= 70) {
            feedback.append("✅ STRONG CANDIDATE\n\n");
            feedback.append("Your resume shows solid alignment with ").append(jobRole).append(" requirements. ");
            feedback.append("With ").append(matched.size()).append(" relevant skills, you have a good foundation. ");
            feedback.append("However, addressing ").append(Math.min(missing.size(), 3)).append(" key missing skills could significantly improve your chances.\n\n");
            feedback.append("📈 Market Position: Top 35% of applicants.");
        } else if (atsScore >= 50) {
            feedback.append("⚠️ MODERATE MATCH\n\n");
            feedback.append("Your resume has partial alignment with ").append(jobRole).append(" requirements. ");
            feedback.append("While you have ").append(matched.size()).append(" relevant skills, the role expects more specialized expertise. ");
            feedback.append("Focus on acquiring ").append(Math.min(missing.size(), 5)).append(" critical skills through courses or projects before applying.\n\n");
            feedback.append("📈 Market Position: Average applicant pool.");
        } else {
            feedback.append("⛔ NEEDS IMPROVEMENT\n\n");
            feedback.append("Your resume shows limited alignment with ").append(jobRole).append(" requirements. ");
            feedback.append("There are significant skill gaps that need addressing. Consider:\n");
            feedback.append("• Taking online courses in core technologies\n");
            feedback.append("• Building portfolio projects demonstrating required skills\n");
            feedback.append("• Seeking entry-level or adjacent roles to build experience\n\n");
            feedback.append("📈 Recommendation: Strengthen your profile before applying to this role.");
        }

        return feedback.toString();
    }

    // ==================== INTERVIEW QUESTIONS ====================

    public List<String> generateInterviewQuestions(String resumeText, String jobRole) {
        List<String> questions = new ArrayList<>();
        String roleLower = jobRole.toLowerCase();

        // Add intro questions (3 questions)
        questions.addAll(getIntroQuestions());

        // Add role-specific technical questions (9 questions)
        questions.addAll(getRoleSpecificQuestions(roleLower));

        // Add behavioral/situational questions (6 questions)
        questions.addAll(getBehavioralQuestions(roleLower));

        // Ensure we have exactly TOTAL_QUESTIONS
        while (questions.size() < TOTAL_QUESTIONS) {
            questions.addAll(getGenericQuestions());
        }

        // Shuffle and return exactly 18 questions
        Collections.shuffle(questions.subList(3, questions.size())); // Keep intro questions at start
        return questions.subList(0, TOTAL_QUESTIONS);
    }

    private List<String> getIntroQuestions() {
        return Arrays.asList(
            "Tell me about yourself and what made you interested in this role.",
            "Walk me through your career journey so far - what are you most proud of?",
            "What excites you most about the technology landscape today?"
        );
    }

    private List<String> getRoleSpecificQuestions(String role) {
        List<String> questions = new ArrayList<>();

        if (role.contains("backend") || role.contains("java") || role.contains("spring")) {
            questions.addAll(Arrays.asList(
                "How do you approach designing a RESTful API from scratch? What principles guide your decisions?",
                "Tell me about a time you had to optimize a slow database query. What was your process?",
                "How do you ensure thread safety in a multi-threaded Java application?",
                "Explain your approach to handling exceptions and error responses in a Spring Boot API.",
                "What's your strategy for breaking down a monolith into microservices?",
                "How do you implement authentication and authorization in your applications?",
                "Describe your experience with caching strategies. When would you use Redis vs in-memory cache?",
                "How do you approach writing testable code? What's your testing strategy?",
                "Explain a challenging concurrency problem you solved and your approach."
            ));
        } else if (role.contains("frontend") || role.contains("react") || role.contains("angular")) {
            questions.addAll(Arrays.asList(
                "How do you decide between local state, context, and global state management?",
                "When would you use useMemo vs useCallback? Give me a real example.",
                "How do you approach performance optimization in a React application?",
                "Explain your strategy for handling complex forms with validation.",
                "How do you structure your components to maximize reusability?",
                "What's your approach to responsive design and cross-browser compatibility?",
                "How do you handle API calls and loading/error states elegantly?",
                "Tell me about your experience with CSS-in-JS vs traditional CSS approaches.",
                "How do you ensure accessibility in your applications?"
            ));
        } else if (role.contains("fullstack") || role.contains("full stack")) {
            questions.addAll(Arrays.asList(
                "How do you decide what logic belongs in frontend vs backend?",
                "Explain your approach to API design between your frontend and backend.",
                "How do you handle authentication across your full-stack application?",
                "What's your strategy for managing environment-specific configurations?",
                "How do you approach database schema design for a new feature?",
                "Tell me about your experience with real-time features like WebSockets.",
                "How do you handle file uploads in a full-stack application?",
                "What's your approach to error handling across the entire stack?",
                "How do you ensure consistency between frontend and backend validations?"
            ));
        } else if (role.contains("data scientist") || role.contains("data science")) {
            questions.addAll(Arrays.asList(
                "Walk me through your typical approach to a new data science project.",
                "How do you handle missing data and what factors influence your approach?",
                "Explain a time you had to communicate complex findings to non-technical stakeholders.",
                "How do you choose between different machine learning algorithms for a problem?",
                "What's your approach to feature engineering and selection?",
                "How do you prevent overfitting in your models?",
                "Tell me about a time your model didn't perform as expected in production.",
                "How do you validate your models before deployment?",
                "What tools and practices do you use to ensure reproducibility?"
            ));
        } else if (role.contains("machine learning") || role.contains("ml engineer")) {
            questions.addAll(Arrays.asList(
                "How do you approach deploying ML models to production?",
                "Explain your MLOps practices and how you handle model versioning.",
                "What metrics do you use to monitor model performance in production?",
                "How do you handle model retraining and data drift?",
                "Tell me about your experience optimizing model inference latency.",
                "How do you approach feature store design and management?",
                "What's your strategy for A/B testing ML models?",
                "Explain a complex neural network architecture you designed.",
                "How do you handle large-scale distributed training?"
            ));
        } else if (role.contains("devops") || role.contains("sre")) {
            questions.addAll(Arrays.asList(
                "How do you design a CI/CD pipeline for a microservices architecture?",
                "Tell me about your experience with infrastructure as code.",
                "How do you approach Kubernetes cluster management and security?",
                "What's your incident response process when something goes wrong in production?",
                "How do you implement effective monitoring and alerting?",
                "Explain your approach to capacity planning and scaling.",
                "How do you handle secrets management in your infrastructure?",
                "Tell me about a time you improved deployment reliability.",
                "What's your strategy for disaster recovery and business continuity?"
            ));
        } else if (role.contains("security") || role.contains("cybersecurity")) {
            questions.addAll(Arrays.asList(
                "How do you approach a security assessment of a new application?",
                "Walk me through your incident response methodology.",
                "How do you stay current with emerging security threats?",
                "Explain your approach to implementing zero-trust architecture.",
                "How do you balance security requirements with developer experience?",
                "Tell me about a security vulnerability you discovered and how you handled it.",
                "What's your strategy for security awareness training?",
                "How do you prioritize security findings for remediation?",
                "Explain your approach to secure code review."
            ));
        } else if (role.contains("qa") || role.contains("test") || role.contains("quality")) {
            questions.addAll(Arrays.asList(
                "How do you decide what to automate vs test manually?",
                "Walk me through your test strategy for a new feature.",
                "How do you handle flaky tests in your automation suite?",
                "What's your approach to API testing?",
                "How do you design test data management strategies?",
                "Tell me about your experience with performance testing.",
                "How do you ensure test coverage without slowing down development?",
                "What metrics do you track to measure quality?",
                "How do you approach cross-browser and cross-device testing?"
            ));
        } else if (role.contains("mobile") || role.contains("android") || role.contains("ios")) {
            questions.addAll(Arrays.asList(
                "How do you approach offline-first architecture in mobile apps?",
                "What's your strategy for handling different screen sizes and orientations?",
                "How do you optimize app performance and battery usage?",
                "Explain your approach to state management in mobile development.",
                "How do you handle app updates and version compatibility?",
                "What's your testing strategy for mobile applications?",
                "How do you implement push notifications effectively?",
                "Tell me about your experience with app store deployment process.",
                "How do you handle sensitive data storage on mobile devices?"
            ));
        } else if (role.contains("cloud") || role.contains("architect")) {
            questions.addAll(Arrays.asList(
                "How do you approach designing highly available systems?",
                "Explain your strategy for cost optimization in the cloud.",
                "How do you design for scalability from day one?",
                "What's your approach to multi-region architecture?",
                "How do you handle data consistency in distributed systems?",
                "Tell me about your experience with serverless architectures.",
                "How do you approach vendor lock-in concerns?",
                "What patterns do you use for inter-service communication?",
                "How do you design for observability in complex systems?"
            ));
        } else if (role.contains("product manager") || role.contains("product owner")) {
            questions.addAll(Arrays.asList(
                "How do you prioritize features when everything seems important?",
                "Walk me through your process for gathering user requirements.",
                "How do you measure the success of a product feature?",
                "Tell me about a time you had to say no to a stakeholder.",
                "How do you balance technical debt against new features?",
                "What's your approach to defining and tracking OKRs?",
                "How do you handle competing priorities from different teams?",
                "Describe your ideal product development workflow.",
                "How do you validate product ideas before building?"
            ));
        } else {
            questions.addAll(getGenericTechnicalQuestions());
        }

        return questions;
    }

    private List<String> getBehavioralQuestions(String role) {
        return Arrays.asList(
            "Tell me about a time you had to work under a tight deadline. How did you manage?",
            "Describe a situation where you disagreed with a team member. How did you resolve it?",
            "Give me an example of when you took initiative beyond your regular responsibilities.",
            "Tell me about a mistake you made and what you learned from it.",
            "How do you handle feedback, especially when it's critical?",
            "Describe a time when you had to learn a new technology quickly. What was your approach?",
            "Tell me about your most challenging project and how you overcame obstacles.",
            "How do you stay motivated when working on long-term projects?",
            "Describe a situation where you had to explain a technical concept to a non-technical person."
        );
    }

    private List<String> getGenericTechnicalQuestions() {
        return Arrays.asList(
            "How do you approach debugging a complex issue?",
            "What's your process for learning a new technology or framework?",
            "How do you ensure code quality in your projects?",
            "Explain your approach to documentation.",
            "How do you handle technical debt in your codebase?",
            "What development methodologies have you worked with?",
            "How do you approach code reviews?",
            "Tell me about your experience with version control workflows.",
            "How do you keep your technical skills up to date?"
        );
    }

    private List<String> getGenericQuestions() {
        return Arrays.asList(
            "Where do you see yourself in 5 years?",
            "What questions do you have for me about the role or team?",
            "What's your ideal work environment?",
            "How do you handle stress and pressure?",
            "What makes you stand out as a candidate?"
        );
    }

    // ==================== ANSWER EVALUATION ====================

    public String evaluateInterviewAnswer(String question, String answer, String resumeText) {
        if (answer == null || answer.trim().isEmpty()) {
            return generateEmptyAnswerFeedback();
        }

        String answerLower = answer.toLowerCase();
        String questionLower = question.toLowerCase();
        int wordCount = answer.split("\\s+").length;
        int sentenceCount = answer.split("[.!?]+").length;

        StringBuilder feedback = new StringBuilder();

        // Determine answer quality
        int qualityScore = 0;

        // ========== CLARITY ANALYSIS (how clear and understandable) ==========
        int clarityScore = 0;
        StringBuilder clarityFeedback = new StringBuilder();
        
        // Check for jargon without explanation
        boolean hasJargon = Pattern.compile("\\b(API|SDK|MVP|OOP|DRY|SOLID|REST)\\b").matcher(answer).find();
        boolean hasExplanation = answerLower.contains("which means") || answerLower.contains("this is") ||
                                answerLower.contains("essentially") || answerLower.contains("in other words");
        if (hasJargon && !hasExplanation) {
            clarityFeedback.append("Consider explaining technical acronyms briefly. ");
            clarityScore -= 1;
        } else if (hasJargon && hasExplanation) {
            clarityScore += 2;
        }
        
        // Check for clear structure
        boolean hasStructure = answerLower.contains("first") || answerLower.contains("second") ||
                              answerLower.contains("finally") || answerLower.contains("additionally") ||
                              answerLower.contains("to begin") || answerLower.contains("in conclusion");
        if (hasStructure) {
            clarityScore += 2;
        } else if (wordCount > 80) {
            clarityFeedback.append("Longer responses benefit from clear structure (First, Then, Finally). ");
        }
        
        // Check for run-on sentences (avg words per sentence)
        double avgWordsPerSentence = sentenceCount > 0 ? (double) wordCount / sentenceCount : wordCount;
        if (avgWordsPerSentence > 30) {
            clarityFeedback.append("Some sentences are quite long - shorter sentences improve readability. ");
            clarityScore -= 1;
        } else if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 20) {
            clarityScore += 1;
        }

        // ========== CONCISENESS ANALYSIS (right amount of content) ==========
        int concisenessScore = 0;
        StringBuilder concisenessFeedback = new StringBuilder();
        
        if (wordCount < 20) {
            concisenessFeedback.append("Response is too brief - expand with more details and examples. ");
            concisenessScore -= 2;
        } else if (wordCount >= 40 && wordCount <= 150) {
            concisenessScore += 2; // Ideal range
        } else if (wordCount > 200) {
            concisenessFeedback.append("Response could be more concise - focus on key points. ");
            concisenessScore -= 1;
        } else if (wordCount >= 20 && wordCount < 40) {
            concisenessFeedback.append("Good start, but could use a bit more detail. ");
            concisenessScore += 1;
        }
        
        // Check for filler words and redundancy
        String[] fillerWords = {"basically", "actually", "really", "very", "literally", "honestly", "just"};
        int fillerCount = 0;
        for (String filler : fillerWords) {
            if (answerLower.contains(filler)) fillerCount++;
        }
        if (fillerCount >= 3) {
            concisenessFeedback.append("Reduce filler words (basically, actually, etc.) for stronger impact. ");
            concisenessScore -= 1;
        }

        // ========== RELEVANCE ANALYSIS (addresses the actual question) ==========
        int relevanceScore = 0;
        StringBuilder relevanceFeedback = new StringBuilder();
        
        // Extract key topics from question
        List<String> questionKeywords = extractKeyTopics(questionLower);
        int topicsAddressed = 0;
        for (String keyword : questionKeywords) {
            if (answerLower.contains(keyword)) topicsAddressed++;
        }
        
        double relevanceRate = questionKeywords.isEmpty() ? 0.5 : (double) topicsAddressed / questionKeywords.size();
        if (relevanceRate >= 0.6) {
            relevanceScore += 2;
        } else if (relevanceRate >= 0.3) {
            relevanceScore += 1;
            relevanceFeedback.append("Your answer partially addresses the question. ");
        } else {
            relevanceFeedback.append("Make sure to directly address what's being asked. ");
            relevanceScore -= 1;
        }
        
        // Check for specifics related to the question type
        boolean hasExample = answerLower.contains("for example") || answerLower.contains("for instance") ||
                            answerLower.contains("specifically") || answerLower.contains("in my experience") ||
                            answerLower.contains("when i") || answerLower.contains("i once");
        boolean hasMetrics = Pattern.compile("\\d+%|\\d+ times|\\d+ users|\\d+ years|\\d+ months").matcher(answer).find();
        
        if (hasExample) {
            relevanceScore += 1;
        }
        if (hasMetrics) {
            relevanceScore += 1;
        }

        // Question-specific evaluation
        if (questionLower.contains("tell me about yourself") || questionLower.contains("walk me through")) {
            if (!hasStructure) {
                relevanceFeedback.append("Structure your background chronologically or thematically. ");
            }
        }

        if (questionLower.contains("challenge") || questionLower.contains("mistake") || 
            questionLower.contains("difficult") || questionLower.contains("failure")) {
            boolean hasLearning = answerLower.contains("learned") || answerLower.contains("realized") ||
                                 answerLower.contains("improved") || answerLower.contains("outcome") ||
                                 answerLower.contains("grew") || answerLower.contains("taught me");
            if (!hasLearning) {
                relevanceFeedback.append("Emphasize what you learned from this experience. ");
                relevanceScore -= 1;
            }
        }

        if (questionLower.contains("approach") || questionLower.contains("strategy") || 
            questionLower.contains("how do you") || questionLower.contains("your process")) {
            boolean hasProcess = answerLower.contains("step") || answerLower.contains("process") ||
                                answerLower.contains("typically") || answerLower.contains("approach") ||
                                answerLower.contains("method") || answerLower.contains("framework");
            if (!hasProcess) {
                relevanceFeedback.append("Outline your systematic approach or methodology. ");
                relevanceScore -= 1;
            }
        }

        // Technical question evaluation
        if (isTehnicalQuestion(questionLower)) {
            List<String> expectedTerms = getExpectedTerms(questionLower);
            int termsFound = 0;
            for (String term : expectedTerms) {
                if (answerLower.contains(term)) termsFound++;
            }
            if (termsFound < expectedTerms.size() / 3) {
                relevanceFeedback.append("Include more technical specifics relevant to the question. ");
                relevanceScore -= 1;
            } else if (termsFound >= expectedTerms.size() / 2) {
                relevanceScore += 1;
            }
        }

        // Calculate total quality score
        qualityScore = clarityScore + concisenessScore + relevanceScore;

        // ========== BUILD DETAILED FEEDBACK ==========
        // Overall assessment header
        if (qualityScore >= 5) {
            feedback.append("🌟 EXCELLENT RESPONSE\n\n");
        } else if (qualityScore >= 2) {
            feedback.append("✅ GOOD ANSWER\n\n");
        } else if (qualityScore >= 0) {
            feedback.append("👍 DECENT RESPONSE\n\n");
        } else {
            feedback.append("💡 NEEDS IMPROVEMENT\n\n");
        }

        // Detailed analysis section
        feedback.append("📊 DETAILED ANALYSIS\n");
        feedback.append("─────────────────────\n\n");
        
        // Clarity rating
        feedback.append("🔍 Clarity: ");
        if (clarityScore >= 2) {
            feedback.append("★★★ Excellent - Your response was clear and easy to follow.\n");
        } else if (clarityScore >= 0) {
            feedback.append("★★☆ Good - ");
            if (clarityFeedback.length() > 0) feedback.append(clarityFeedback);
            else feedback.append("Response was reasonably clear.\n");
        } else {
            feedback.append("★☆☆ Needs Work - ").append(clarityFeedback).append("\n");
        }
        
        // Conciseness rating
        feedback.append("📏 Conciseness: ");
        if (concisenessScore >= 2) {
            feedback.append("★★★ Excellent - Well-balanced response length.\n");
        } else if (concisenessScore >= 0) {
            feedback.append("★★☆ Good - ");
            if (concisenessFeedback.length() > 0) feedback.append(concisenessFeedback);
            else feedback.append("Acceptable length.\n");
        } else {
            feedback.append("★☆☆ Needs Work - ").append(concisenessFeedback).append("\n");
        }
        
        // Relevance rating
        feedback.append("🎯 Relevance: ");
        if (relevanceScore >= 2) {
            feedback.append("★★★ Excellent - Directly addressed the question asked.\n");
        } else if (relevanceScore >= 0) {
            feedback.append("★★☆ Good - ");
            if (relevanceFeedback.length() > 0) feedback.append(relevanceFeedback);
            else feedback.append("Mostly on topic.\n");
        } else {
            feedback.append("★☆☆ Needs Work - ").append(relevanceFeedback).append("\n");
        }

        // Transcript examples
        feedback.append("\n📝 FROM YOUR ANSWER:\n");
        if (hasExample) {
            feedback.append("✓ Good use of examples to illustrate points\n");
        } else {
            feedback.append("✗ Missing concrete examples - add real scenarios\n");
        }
        if (hasMetrics) {
            feedback.append("✓ Included quantifiable metrics (great!)\n");
        } else {
            feedback.append("✗ No metrics found - add numbers to show impact\n");
        }
        if (hasStructure) {
            feedback.append("✓ Well-structured with clear transitions\n");
        } else if (wordCount > 60) {
            feedback.append("✗ Could benefit from structural markers\n");
        }

        // Actionable improvement tip
        feedback.append("\n💪 ACTIONABLE TIP:\n");
        if (!hasExample) {
            feedback.append("Use the STAR method (Situation, Task, Action, Result) - describe a specific situation, your task, the actions you took, and the measurable results.");
        } else if (!hasMetrics) {
            feedback.append("Quantify your impact wherever possible (e.g., 'reduced load time by 40%', 'managed team of 5', 'processed 10K daily transactions').");
        } else if (!hasStructure && wordCount > 50) {
            feedback.append("Structure longer answers with signpost phrases: 'First...', 'Additionally...', 'Finally...' to guide the interviewer.");
        } else if (clarityScore < 1) {
            feedback.append("Break complex ideas into shorter sentences. Define technical terms briefly when first used.");
        } else if (concisenessScore < 1) {
            feedback.append("Aim for 50-150 words per response. Cut filler words and focus on your strongest points.");
        } else {
            feedback.append("Excellent foundation! Continue practicing to maintain this quality. Consider preparing 3-5 achievement stories you can adapt to different questions.");
        }

        return feedback.toString();
    }

    private List<String> extractKeyTopics(String question) {
        List<String> topics = new ArrayList<>();
        
        // Remove common question words
        String[] stopWords = {"what", "how", "why", "when", "where", "which", "who", "tell", "describe", 
                             "explain", "your", "you", "can", "could", "would", "about", "the", "a", "an"};
        String[] words = question.split("\\s+");
        
        for (String word : words) {
            String cleaned = word.replaceAll("[^a-z]", "").trim();
            if (cleaned.length() > 3) {
                boolean isStopWord = false;
                for (String stop : stopWords) {
                    if (cleaned.equals(stop)) {
                        isStopWord = true;
                        break;
                    }
                }
                if (!isStopWord) {
                    topics.add(cleaned);
                }
            }
        }
        return topics;
    }

    private boolean isTehnicalQuestion(String question) {
        String[] technicalKeywords = {"api", "database", "code", "design", "architecture", 
                                      "testing", "deploy", "optimize", "implement", "debug",
                                      "kubernetes", "docker", "react", "java", "python"};
        for (String keyword : technicalKeywords) {
            if (question.contains(keyword)) return true;
        }
        return false;
    }

    private List<String> getExpectedTerms(String question) {
        List<String> terms = new ArrayList<>();
        
        if (question.contains("api") || question.contains("rest")) {
            terms = Arrays.asList("http", "endpoint", "status", "json", "request", "response", "method", "post", "get");
        } else if (question.contains("database") || question.contains("query")) {
            terms = Arrays.asList("index", "query", "table", "join", "performance", "normalization", "sql", "optimization");
        } else if (question.contains("react") || question.contains("frontend")) {
            terms = Arrays.asList("component", "state", "props", "render", "hook", "lifecycle", "dom", "effect");
        } else if (question.contains("testing") || question.contains("test")) {
            terms = Arrays.asList("unit", "integration", "coverage", "mock", "assert", "edge case", "scenario", "automation");
        } else if (question.contains("deploy") || question.contains("ci/cd")) {
            terms = Arrays.asList("pipeline", "build", "release", "environment", "automation", "rollback", "container");
        } else if (question.contains("security")) {
            terms = Arrays.asList("authentication", "authorization", "encryption", "vulnerability", "owasp", "token", "secure");
        } else if (question.contains("kubernetes") || question.contains("docker")) {
            terms = Arrays.asList("container", "pod", "service", "deployment", "image", "cluster", "orchestration", "yaml");
        } else {
            terms = Arrays.asList("approach", "solution", "implement", "design", "process", "best practice");
        }
        
        return terms;
    }

    private String generateEmptyAnswerFeedback() {
        return "❌ No answer provided. It's important to attempt an answer, even if you're unsure. " +
               "Try to share your thought process or ask clarifying questions if needed. " +
               "\n\n💡 Tip: Saying 'I'm not sure, but here's how I would approach it...' shows problem-solving skills.";
    }
}
