package com.a3n.resumentor.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OpenAIService {

    @Value("${openai.api.Key:}")
    private String apiKey;

    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private boolean isAvailable = false;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String GPT_MODEL = "gpt-3.5-turbo";
    private static final int MAX_TOKENS = 2000;
    private static final double TEMPERATURE = 0.7;

    @PostConstruct
    public void init() {
        restTemplate = new RestTemplate();
        objectMapper = new ObjectMapper();
        
        log.info("======================================");
        log.info("    INITIALIZING AI SERVICE");
        log.info("======================================");
        
        if (apiKey != null && !apiKey.isEmpty() && !apiKey.equals("YOUR_OPENAI_API_KEY")) {
            isAvailable = true;
            log.info("OpenAI GPT-3.5 ENABLED");
            log.info("Resume Analysis: AI-Powered");
            log.info("Interview Questions: AI-Generated");
            log.info("Answer Evaluation: AI-Scored");
        } else {
            log.warn("OpenAI API key not configured. Using fallback mock analyzer.");
            isAvailable = false;
        }
        log.info("======================================");
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    /**
     * Analyze resume using GPT
     */
    public String analyzeResumeWithGPT(String resumeText, String jobRole, String jobDescription) {
        if (!isAvailable) {
            return null;
        }

        String systemPrompt = """
            You are an expert ATS (Applicant Tracking System) analyzer and career coach.
            Analyze resumes and provide detailed, actionable feedback.
            Always respond in valid JSON format.
            """;

        String userPrompt = String.format("""
            Analyze this resume for a %s position.
            
            Job Description: %s
            
            Resume:
            %s
            
            Provide a JSON response with this exact structure:
            {
                "atsScore": <number 0-100>,
                "matchedKeywords": ["skill1", "skill2", ...],
                "missingKeywords": ["skill1", "skill2", ...],
                "suggestions": ["suggestion1", "suggestion2", ...],
                "skillGaps": ["gap1", "gap2", ...],
                "overallFeedback": "detailed paragraph feedback",
                "keywordMatchPercentage": <number 0-100>,
                "structureScore": <number 0-100>,
                "experienceScore": <number 0-100>,
                "softSkillsScore": <number 0-100>,
                "resumeStrength": "EXCELLENT|STRONG|GOOD|AVERAGE|NEEDS_IMPROVEMENT",
                "topMatchedSkills": ["skill1", "skill2", ...up to 5],
                "criticalMissingSkills": ["skill1", "skill2", ...up to 5],
                "competitiveAnalysis": "paragraph about candidate's competitive position",
                "atsFriendlinessScore": <number 0-100>,
                "formattingScore": <number 0-100>,
                "parsabilityScore": <number 0-100>,
                "contactInfoScore": <number 0-100>,
                "sectionOrganizationScore": <number 0-100>,
                "keywordDensityScore": <number 0-100>,
                "atsIssues": ["issue1", "issue2", ...],
                "atsTips": ["tip1", "tip2", ...]
            }
            
            Be thorough and specific. Consider:
            - Technical skills alignment with job role
            - Years of experience indicators
            - Project complexity and achievements
            - Education relevance
            - ATS-friendly formatting
            - Action verbs and quantified achievements
            """, jobRole, jobDescription != null ? jobDescription : "Not provided", resumeText);

        return callGPT(systemPrompt, userPrompt);
    }

    /**
     * Generate interview questions using GPT
     */
    public String generateInterviewQuestionsWithGPT(String resumeText, String jobRole, int questionCount) {
        if (!isAvailable) {
            return null;
        }

        String systemPrompt = """
            You are an expert technical interviewer with experience interviewing candidates for top tech companies.
            Generate challenging but fair interview questions based on the candidate's resume and target role.
            Always respond in valid JSON format.
            """;

        String userPrompt = String.format("""
            Generate %d interview questions for a %s position based on this resume.
            
            Resume:
            %s
            
            Create a mix of:
            - 6 Basic questions (fundamentals, easy)
            - 6 Intermediate questions (practical application, medium)
            - 6 Advanced questions (complex scenarios, hard)
            
            Respond with JSON array:
            {
                "questions": [
                    {
                        "text": "question text",
                        "difficulty": "BASIC|INTERMEDIATE|ADVANCED",
                        "category": "TECHNICAL|BEHAVIORAL|SITUATIONAL",
                        "expectedTopics": ["topic1", "topic2"],
                        "idealAnswerPoints": ["point1", "point2", "point3"]
                    }
                ]
            }
            
            Make questions specific to:
            - Skills mentioned in resume
            - The target job role
            - Real-world scenarios
            - Both technical and soft skills
            """, questionCount, jobRole, resumeText);

        return callGPT(systemPrompt, userPrompt);
    }

    /**
     * Evaluate interview answer using GPT
     */
    public String evaluateAnswerWithGPT(String question, String answer, String jobRole, String difficulty) {
        if (!isAvailable) {
            return null;
        }

        String systemPrompt = """
            You are an expert interview evaluator. Provide fair, constructive, and detailed feedback.
            Score answers based on content quality, relevance, communication skills, and technical accuracy.
            Always respond in valid JSON format.
            """;

        String userPrompt = String.format("""
            Evaluate this interview response for a %s position.
            
            Question (Difficulty: %s):
            %s
            
            Candidate's Answer:
            %s
            
            Provide JSON response:
            {
                "score": <number 0-100>,
                "feedback": "detailed constructive feedback paragraph",
                "strengths": ["strength1", "strength2", ...],
                "improvements": ["area1", "area2", ...],
                "technicalAccuracy": <number 0-100>,
                "communicationScore": <number 0-100>,
                "relevanceScore": <number 0-100>,
                "depthScore": <number 0-100>,
                "keyPointsCovered": ["point1", "point2", ...],
                "missedOpportunities": ["missed1", "missed2", ...],
                "improvedAnswer": "brief suggestion for better answer"
            }
            
            Be encouraging but honest. Consider:
            - Direct relevance to the question
            - Technical accuracy
            - Use of specific examples
            - Communication clarity
            - Depth of knowledge demonstrated
            """, jobRole, difficulty, question, answer);

        return callGPT(systemPrompt, userPrompt);
    }

    /**
     * Generate interview report summary using GPT
     */
    public String generateReportSummaryWithGPT(String jobRole, int questionsAnswered, 
                                                double avgScore, List<String> strengths, 
                                                List<String> weaknesses) {
        if (!isAvailable) {
            return null;
        }

        String systemPrompt = """
            You are a career coach providing interview performance summaries.
            Be encouraging, specific, and actionable in your feedback.
            Always respond in valid JSON format.
            """;

        String userPrompt = String.format("""
            Generate interview performance summary for a %s position candidate.
            
            Performance Data:
            - Questions Answered: %d
            - Average Score: %.1f%%
            - Strengths Shown: %s
            - Areas for Improvement: %s
            
            Provide JSON response:
            {
                "overallAssessment": "paragraph summary",
                "performanceLevel": "EXCEPTIONAL|STRONG|GOOD|DEVELOPING|NEEDS_PRACTICE",
                "topStrengths": ["strength1", "strength2", "strength3"],
                "priorityImprovements": ["improvement1", "improvement2", "improvement3"],
                "actionPlan": ["action1", "action2", "action3"],
                "interviewReadiness": <number 0-100>,
                "encouragement": "motivational closing message",
                "resourceRecommendations": ["resource1", "resource2"]
            }
            """, jobRole, questionsAnswered, avgScore, 
             String.join(", ", strengths), String.join(", ", weaknesses));

        return callGPT(systemPrompt, userPrompt);
    }

    /**
     * Generate a conversational follow-up question based on the candidate's answer
     */
    public String generateFollowUpQuestion(String question, String answer, String jobRole) {
        if (!isAvailable) {
            return null;
        }

        String systemPrompt = """
            You are an expert interviewer conducting a conversational interview.
            Based on the candidate's answer, generate ONE short follow-up question that digs deeper.
            Respond with ONLY the follow-up question text, no JSON, no formatting.
            If the answer is too short or off-topic, return exactly: NO_FOLLOWUP
            """;

        String userPrompt = String.format("""
            Role: %s

            Original Question: %s

            Candidate's Answer: %s

            Generate a brief, natural follow-up question that explores their answer deeper.
            Keep it conversational and under 30 words.
            """, jobRole, question, answer);

        try {
            String result = callGPT(systemPrompt, userPrompt);
            if (result != null && !result.isBlank() && !result.contains("NO_FOLLOWUP")) {
                return result.trim();
            }
        } catch (Exception e) {
            log.warn("Failed to generate follow-up question: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Core GPT API call method using RestTemplate
     */
    private String callGPT(String systemPrompt, String userPrompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            List<Map<String, String>> messages = new ArrayList<>();
            
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            messages.add(systemMessage);
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);
            messages.add(userMessage);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", GPT_MODEL);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", MAX_TOKENS);
            requestBody.put("temperature", TEMPERATURE);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    OPENAI_API_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                JsonNode choices = jsonResponse.get("choices");
                if (choices != null && choices.isArray() && choices.size() > 0) {
                    String content = choices.get(0).get("message").get("content").asText();
                    log.debug("GPT Response received: {} chars", content.length());
                    return content;
                }
            }
        } catch (Exception e) {
            log.error("Error calling OpenAI API: {}", e.getMessage());
        }
        return null;
    }
}
