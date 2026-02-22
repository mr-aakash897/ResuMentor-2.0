package com.a3n.resumentor.service;

import com.a3n.resumentor.dto.InterviewResponse;
import com.a3n.resumentor.dto.ReportDTO;
import com.a3n.resumentor.entity.InterviewQuestion;
import com.a3n.resumentor.entity.InterviewSession;
import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.exception.ResourceNotFoundException;
import com.a3n.resumentor.repository.InterviewQuestionRepository;
import com.a3n.resumentor.repository.InterviewSessionRepository;
import com.a3n.resumentor.repository.ResumeRepository;
import com.a3n.resumentor.repository.UserRepository;
import com.a3n.resumentor.util.MockAIAnalyzer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

@Service
@Slf4j
@Transactional
public class InterviewService {

    private static final int INTERVIEW_DURATION_MINUTES = 30;
    private static final int TOTAL_QUESTIONS = 18;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private MockAIAnalyzer mockAIAnalyzer;

    @Autowired
    private AchievementService achievementService;

    public InterviewSession startInterview(Long userId, Long resumeId) {
        log.info("Starting interview for user: {}, resume: {}", userId, resumeId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));

        // Create new session
        InterviewSession session = new InterviewSession();
        session.setUser(user);
        session.setResume(resume);
        session.setStatus(InterviewSession.SessionStatus.ONGOING);

        InterviewSession savedSession = interviewSessionRepository.save(session);

        // Generate questions
        generateQuestions(savedSession, resume);

        log.info("Interview session started. Session ID: {}", savedSession.getId());
        return savedSession;
    }

    private void generateQuestions(InterviewSession session, Resume resume) {
        List<String> questionTexts = mockAIAnalyzer.generateInterviewQuestions(
                resume.getResumeText(),
                resume.getJobRole()
        );

        // Create basic, intermediate, advanced distribution (6-6-6 for 18 questions)
        int[] difficulties = new int[TOTAL_QUESTIONS];
        for (int i = 0; i < TOTAL_QUESTIONS; i++) {
            if (i < 6) difficulties[i] = 0; // BASIC (6 questions)
            else if (i < 12) difficulties[i] = 1; // INTERMEDIATE (6 questions)
            else difficulties[i] = 2; // ADVANCED (6 questions)
        }

        IntStream.range(0, TOTAL_QUESTIONS).forEach(i -> {
            InterviewQuestion question = new InterviewQuestion();
            question.setSession(session);
            question.setQuestionNumber(i + 1);
            question.setQuestionText(questionTexts.get(i % questionTexts.size()));
            question.setDifficultyLevel(InterviewQuestion.DifficultyLevel.values()[difficulties[i]]);

            interviewQuestionRepository.save(question);
        });

        log.info("Generated 18 interview questions for session: {}", session.getId());
    }

    public InterviewResponse getNextQuestion(Long sessionId, Long userId) {
        InterviewSession session = verifySessionOwnership(sessionId, userId);

        if (isInterviewCompleted(session)) {
            throw new IllegalArgumentException("Interview has been completed");
        }

        // Get the first unanswered question
        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
        InterviewQuestion nextQuestion = questions.stream()
                .filter(q -> q.getUserAnswer() == null)
                .findFirst()
                .orElse(questions.get(questions.size() - 1));

        return buildInterviewResponse(session, nextQuestion);
    }

    public InterviewResponse submitAnswer(Long sessionId, Long questionId, String answer, Long userId) {
        InterviewSession session = verifySessionOwnership(sessionId, userId);

        if (isInterviewCompleted(session)) {
            throw new IllegalArgumentException("Interview has been completed");
        }

        InterviewQuestion question = interviewQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        log.info("=== SUBMIT ANSWER DEBUG ===");
        log.info("Session: {}, Question: {}, Answer length: {}", sessionId, questionId, answer != null ? answer.length() : 0);

        // Evaluate answer
        String feedback = mockAIAnalyzer.evaluateInterviewAnswer(
                question.getQuestionText(),
                answer,
                session.getResume().getResumeText()
        );

        // Score the answer (mock scoring)
        int score = calculateScore(answer, feedback);
        
        log.info("Generated score: {}, Feedback length: {}", score, feedback != null ? feedback.length() : 0);

        question.setUserAnswer(answer);
        question.setAiFeedback(feedback);
        question.setAnswerScore(score);

        InterviewQuestion savedQuestion = interviewQuestionRepository.save(question);
        log.info("Saved question - ID: {}, Score: {}, Answer saved: {}", 
            savedQuestion.getId(), savedQuestion.getAnswerScore(), savedQuestion.getUserAnswer() != null);

        // Check if all questions answered or time exceeded
        if (isInterviewCompleted(session)) {
            session.setStatus(InterviewSession.SessionStatus.COMPLETED);
            session.setEndTime(LocalDateTime.now());
            session.setDurationMinutes((int) ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime()));
            
            // Calculate and save the session score
            List<InterviewQuestion> allQuestions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
            int avgScore = (int) allQuestions.stream()
                    .filter(q -> q.getUserAnswer() != null && !q.getUserAnswer().trim().isEmpty() && q.getAnswerScore() != null)
                    .mapToInt(InterviewQuestion::getAnswerScore)
                    .average()
                    .orElse(0);
            session.setScore(avgScore);
            
            interviewSessionRepository.save(session);
            log.info("Interview completed for session: {}, Final Score: {}", sessionId, avgScore);

            // Check and award achievements
            try {
                int durationMins = session.getDurationMinutes() != null ? session.getDurationMinutes() : 0;
                achievementService.checkInterviewAchievements(userId, avgScore, durationMins);
            } catch (Exception e) {
                log.warn("Error checking interview achievements: {}", e.getMessage());
            }
        }

        return getNextQuestion(sessionId, userId);
    }

    public void endInterview(Long sessionId, Long userId) {
        InterviewSession session = verifySessionOwnership(sessionId, userId);

        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setEndTime(LocalDateTime.now());
        session.setDurationMinutes((int) ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime()));

        // Calculate overall score from ANSWERED questions only
        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
        List<InterviewQuestion> answeredQuestions = questions.stream()
                .filter(q -> q.getUserAnswer() != null && !q.getUserAnswer().trim().isEmpty() && q.getAnswerScore() != null)
                .collect(java.util.stream.Collectors.toList());
        
        int avgScore = (int) answeredQuestions.stream()
                .mapToInt(InterviewQuestion::getAnswerScore)
                .average()
                .orElse(0);

        session.setScore(avgScore);
        interviewSessionRepository.save(session);

        // Check and award achievements
        try {
            int durationMins = session.getDurationMinutes() != null ? session.getDurationMinutes() : 0;
            achievementService.checkInterviewAchievements(userId, avgScore, durationMins);
        } catch (Exception e) {
            log.warn("Error checking interview achievements: {}", e.getMessage());
        }

        log.info("Interview ended for session: {}. Answered: {}, Avg Score: {}", sessionId, answeredQuestions.size(), avgScore);
    }

    public void deleteInterview(Long sessionId, Long userId) {
        InterviewSession session = verifySessionOwnership(sessionId, userId);

        // Delete all questions first
        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
        interviewQuestionRepository.deleteAll(questions);

        // Delete the session
        interviewSessionRepository.delete(session);

        log.info("Interview session deleted: {}", sessionId);
    }

    public ReportDTO getInterviewReport(Long sessionId, Long userId) {
        InterviewSession session = verifySessionOwnership(sessionId, userId);

        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
        
        log.info("=== REPORT GENERATION DEBUG ===");
        log.info("Session ID: {}, Total questions in DB: {}", sessionId, questions.size());
        
        // Log each question's state
        for (InterviewQuestion q : questions) {
            log.info("Q{}: Answer={}, Score={}, Feedback={}", 
                q.getQuestionNumber(),
                q.getUserAnswer() != null ? "YES (len=" + q.getUserAnswer().length() + ")" : "NULL",
                q.getAnswerScore(),
                q.getAiFeedback() != null ? "YES" : "NULL"
            );
        }
        
        // Only consider answered questions for scoring
        List<InterviewQuestion> answeredQuestions = questions.stream()
                .filter(q -> q.getUserAnswer() != null && !q.getUserAnswer().trim().isEmpty())
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Answered questions count: {}", answeredQuestions.size());

        ReportDTO report = new ReportDTO();
        report.setSessionId(session.getId());
        report.setJobRole(session.getResume() != null ? session.getResume().getJobRole() : "General");
        report.setTotalQuestionsAsked(questions.size()); // Total questions generated for the session
        report.setDurationMinutes(session.getDurationMinutes() != null ? session.getDurationMinutes() : 0);
        
        // ALWAYS calculate totalScore from answered questions
        int totalScore = (int) answeredQuestions.stream()
                .filter(q -> q.getAnswerScore() != null)
                .mapToInt(InterviewQuestion::getAnswerScore)
                .average()
                .orElse(0);
        
        log.info("Calculated total score from {} answered questions: {}", answeredQuestions.size(), totalScore);
        report.setTotalScore(totalScore);

        // Calculate basic statistics based on answered questions
        long correctAnswers = answeredQuestions.stream()
                .filter(q -> q.getAnswerScore() != null && q.getAnswerScore() >= 80)
                .count();
        long partialAnswers = answeredQuestions.stream()
                .filter(q -> q.getAnswerScore() != null && q.getAnswerScore() >= 50 && q.getAnswerScore() < 80)
                .count();
        long incorrectAnswers = answeredQuestions.stream()
                .filter(q -> q.getAnswerScore() != null && q.getAnswerScore() < 50)
                .count();

        report.setCorrectAnswers((int) correctAnswers);
        report.setPartialAnswers((int) partialAnswers);
        report.setIncorrectAnswers((int) incorrectAnswers);

        // Calculate average score per question
        double avgScore = answeredQuestions.stream()
                .filter(q -> q.getAnswerScore() != null)
                .mapToInt(InterviewQuestion::getAnswerScore)
                .average()
                .orElse(0);
        report.setAverageScorePerQuestion(Math.round(avgScore * 10) / 10.0);

        // Calculate scores by difficulty
        int basicScore = calculateAverageByDifficulty(answeredQuestions, InterviewQuestion.DifficultyLevel.BASIC);
        int intermediateScore = calculateAverageByDifficulty(answeredQuestions, InterviewQuestion.DifficultyLevel.INTERMEDIATE);
        int advancedScore = calculateAverageByDifficulty(answeredQuestions, InterviewQuestion.DifficultyLevel.ADVANCED);
        
        report.setBasicQuestionsScore(basicScore);
        report.setIntermediateQuestionsScore(intermediateScore);
        report.setAdvancedQuestionsScore(advancedScore);

        // Calculate technical vs behavioral scores
        int technicalScore = calculateCategoryScore(answeredQuestions, true);
        int behavioralScore = calculateCategoryScore(answeredQuestions, false);
        report.setTechnicalScore(technicalScore);
        report.setBehavioralScore(behavioralScore);

        // Communication rating (based on answer length and structure)
        int commRating = calculateCommunicationRating(answeredQuestions);
        report.setCommunicationRating(commRating);

        // Determine performance tier based on totalScore
        if (totalScore >= 85) report.setPerformanceTier("OUTSTANDING");
        else if (totalScore >= 70) report.setPerformanceTier("STRONG");
        else if (totalScore >= 55) report.setPerformanceTier("SATISFACTORY");
        else if (totalScore >= 40) report.setPerformanceTier("NEEDS_IMPROVEMENT");
        else report.setPerformanceTier("REQUIRES_PREPARATION");

        // Interview readiness level
        if (totalScore >= 75 && basicScore >= 80) report.setInterviewReadinessLevel("Ready for Senior Roles");
        else if (totalScore >= 65 && basicScore >= 70) report.setInterviewReadinessLevel("Ready for Mid-Level Roles");
        else if (totalScore >= 50) report.setInterviewReadinessLevel("Ready for Entry-Level Roles");
        else report.setInterviewReadinessLevel("More Preparation Needed");

        // Build question feedbacks with enhanced details - include ALL questions for review
        List<ReportDTO.QuestionFeedback> feedbacks = new ArrayList<>();
        for (InterviewQuestion q : questions) {
            ReportDTO.QuestionFeedback feedback = new ReportDTO.QuestionFeedback();
            feedback.setQuestionNumber(q.getQuestionNumber());
            feedback.setQuestion(q.getQuestionText());
            feedback.setUserAnswer(q.getUserAnswer());
            feedback.setAiFeedback(q.getAiFeedback());
            feedback.setScore(q.getAnswerScore());
            feedback.setDifficulty(q.getDifficultyLevel().toString());
            feedback.setCategory(determineQuestionCategory(q.getQuestionText()));
            feedbacks.add(feedback);
        }
        report.setQuestionFeedbacks(feedbacks);

        // Identify strength areas
        List<String> strengths = new ArrayList<>();
        if (basicScore >= 80) strengths.add("Strong foundation in basics");
        if (intermediateScore >= 75) strengths.add("Good grasp of intermediate concepts");
        if (advancedScore >= 70) strengths.add("Handles advanced topics well");
        if (behavioralScore >= 75) strengths.add("Excellent soft skills & communication");
        if (technicalScore >= 75) strengths.add("Strong technical knowledge");
        if (commRating >= 4) strengths.add("Clear and structured responses");
        if (strengths.isEmpty()) strengths.add("Shows willingness to learn");
        report.setStrengthAreas(strengths);

        // Identify improvement areas
        List<String> improvements = new ArrayList<>();
        if (basicScore < 70) improvements.add("Review fundamental concepts");
        if (intermediateScore < 60) improvements.add("Practice intermediate-level problems");
        if (advancedScore < 50) improvements.add("Study advanced topics more deeply");
        if (behavioralScore < 60) improvements.add("Work on behavioral interview skills");
        if (technicalScore < 60) improvements.add("Strengthen technical foundations");
        if (commRating < 3) improvements.add("Practice structuring your answers better");
        report.setImprovementAreas(improvements);

        // Top performing areas
        List<String> topAreas = new ArrayList<>();
        if (basicScore == Math.max(basicScore, Math.max(intermediateScore, advancedScore))) {
            topAreas.add("Fundamentals (" + basicScore + "%)");
        }
        if (intermediateScore == Math.max(basicScore, Math.max(intermediateScore, advancedScore))) {
            topAreas.add("Applied Knowledge (" + intermediateScore + "%)");
        }
        if (technicalScore > behavioralScore) topAreas.add("Technical Questions");
        else topAreas.add("Behavioral Questions");
        report.setTopPerformingAreas(topAreas);

        // Skill gaps identified
        List<String> skillGaps = new ArrayList<>();
        if (advancedScore < basicScore - 20) skillGaps.add("Gap between basic understanding and advanced application");
        if (technicalScore < 60) skillGaps.add("Technical depth needs improvement");
        if (behavioralScore < 60) skillGaps.add("Storytelling and examples could be stronger");
        if (incorrectAnswers > answeredQuestions.size() / 3) skillGaps.add("Significant knowledge gaps in core areas");
        report.setSkillGapsIdentified(skillGaps);

        // Actionable recommendations
        List<String> recommendations = new ArrayList<>();
        if (totalScore < 50) {
            recommendations.add("Take structured courses on " + report.getJobRole() + " fundamentals");
            recommendations.add("Practice with online coding platforms daily");
            recommendations.add("Build 2-3 portfolio projects demonstrating key skills");
        } else if (totalScore < 70) {
            recommendations.add("Focus on weak areas identified in this assessment");
            recommendations.add("Practice explaining your thought process out loud");
            recommendations.add("Prepare STAR-format stories for behavioral questions");
        } else {
            recommendations.add("Polish your answers with more quantifiable metrics");
            recommendations.add("Practice system design discussions");
            recommendations.add("Consider targeting senior or lead positions");
        }
        report.setActionableRecommendations(recommendations);

        // Generate overall feedback
        report.setOverallFeedback(generateOverallFeedback(report));

        return report;
    }

    private int calculateAverageByDifficulty(List<InterviewQuestion> questions, InterviewQuestion.DifficultyLevel level) {
        return (int) questions.stream()
                .filter(q -> q.getDifficultyLevel() == level && q.getAnswerScore() != null)
                .mapToInt(InterviewQuestion::getAnswerScore)
                .average()
                .orElse(0);
    }

    private int calculateCategoryScore(List<InterviewQuestion> questions, boolean technical) {
        return (int) questions.stream()
                .filter(q -> {
                    String text = q.getQuestionText().toLowerCase();
                    boolean isTechnical = text.contains("code") || text.contains("design") || 
                                         text.contains("implement") || text.contains("api") ||
                                         text.contains("database") || text.contains("system") ||
                                         text.contains("architecture") || text.contains("testing");
                    return technical ? isTechnical : !isTechnical;
                })
                .filter(q -> q.getAnswerScore() != null)
                .mapToInt(InterviewQuestion::getAnswerScore)
                .average()
                .orElse(0);
    }

    private int calculateCommunicationRating(List<InterviewQuestion> questions) {
        long wellAnswered = questions.stream()
                .filter(q -> q.getUserAnswer() != null && q.getUserAnswer().split("\\s+").length >= 30)
                .count();
        double ratio = questions.isEmpty() ? 0 : (double) wellAnswered / questions.size();
        if (ratio >= 0.8) return 5;
        if (ratio >= 0.6) return 4;
        if (ratio >= 0.4) return 3;
        if (ratio >= 0.2) return 2;
        return 1;
    }

    private String determineQuestionCategory(String questionText) {
        String q = questionText.toLowerCase();
        if (q.contains("tell me about yourself") || q.contains("walk me through")) return "Introduction";
        if (q.contains("challenge") || q.contains("mistake") || q.contains("disagree")) return "Behavioral";
        if (q.contains("design") || q.contains("architect")) return "System Design";
        if (q.contains("code") || q.contains("implement") || q.contains("api")) return "Technical";
        if (q.contains("approach") || q.contains("strategy")) return "Problem Solving";
        if (q.contains("team") || q.contains("lead")) return "Leadership";
        return "General";
    }

    public List<InterviewSession> getUserInterviews(Long userId) {
        return interviewSessionRepository.findByUserOrderByStartTimeDesc(
                userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found"))
        );
    }

    private InterviewResponse buildInterviewResponse(InterviewSession session, InterviewQuestion question) {
        long elapsedMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), LocalDateTime.now());
        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);

        InterviewResponse response = new InterviewResponse();
        response.setSessionId(session.getId());
        response.setQuestionId(question.getId());
        response.setCurrentQuestion(question.getQuestionText());
        response.setJobRole(session.getResume().getJobRole());
        response.setQuestionNumber(question.getQuestionNumber());
        response.setTotalQuestions(questions.size());
        response.setElapsedMinutes((int) elapsedMinutes);
        response.setIsCompleted(elapsedMinutes >= INTERVIEW_DURATION_MINUTES || hasAllQuestionsAnswered(session));
        response.setDifficultyLevel(question.getDifficultyLevel());

        return response;
    }

    private int calculateScore(String answer, String feedback) {
        if (answer == null || answer.trim().isEmpty()) {
            return 0;
        }
        
        if (feedback == null || feedback.trim().isEmpty()) {
            return 50; // Default score if no feedback
        }
        
        String feedbackLower = feedback.toLowerCase();
        int wordCount = answer.split("\\s+").length;
        int baseScore = 50;
        
        // Check for excellent/outstanding indicators
        if (feedbackLower.contains("excellent") || feedbackLower.contains("outstanding") || 
            feedbackLower.contains("★★★")) {
            baseScore = 85 + new java.util.Random().nextInt(15); // 85-100
        } 
        // Check for good indicators
        else if (feedbackLower.contains("good answer") || feedbackLower.contains("good -") ||
                 feedbackLower.contains("★★☆")) {
            baseScore = 70 + new java.util.Random().nextInt(15); // 70-85
        } 
        // Check for decent/satisfactory indicators
        else if (feedbackLower.contains("decent") || feedbackLower.contains("satisfactory") ||
                 feedbackLower.contains("★★☆")) {
            baseScore = 55 + new java.util.Random().nextInt(15); // 55-70
        }
        // Check for needs improvement indicators
        else if (feedbackLower.contains("needs improvement") || feedbackLower.contains("needs work") ||
                 feedbackLower.contains("★☆☆")) {
            baseScore = 35 + new java.util.Random().nextInt(20); // 35-55
        }
        
        // Additional modifiers based on answer quality
        if (wordCount < 15) {
            baseScore = Math.max(20, baseScore - 15); // Penalty for very short answers
        } else if (wordCount >= 40 && wordCount <= 150) {
            baseScore = Math.min(100, baseScore + 5); // Bonus for good length
        }
        
        // Check if answer contains examples
        String answerLower = answer.toLowerCase();
        if (answerLower.contains("for example") || answerLower.contains("for instance") ||
            answerLower.contains("in my experience")) {
            baseScore = Math.min(100, baseScore + 5);
        }
        
        return Math.min(100, Math.max(0, baseScore));
    }

    private boolean isInterviewCompleted(InterviewSession session) {
        long elapsedMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), LocalDateTime.now());
        return elapsedMinutes >= INTERVIEW_DURATION_MINUTES || hasAllQuestionsAnswered(session);
    }

    private boolean hasAllQuestionsAnswered(InterviewSession session) {
        List<InterviewQuestion> questions = interviewQuestionRepository.findBySessionOrderByQuestionNumberAsc(session);
        return questions.stream().allMatch(q -> q.getUserAnswer() != null);
    }

    private InterviewSession verifySessionOwnership(Long sessionId, Long userId) {
        log.info("Verifying session ownership: sessionId={}, userId={}", sessionId, userId);
        Optional<InterviewSession> sessionOpt = interviewSessionRepository.findBySessionIdAndUserId(sessionId, userId);
        if (sessionOpt.isEmpty()) {
            // Try to find the session without user check for debugging
            Optional<InterviewSession> anySession = interviewSessionRepository.findById(sessionId);
            if (anySession.isEmpty()) {
                log.error("Session {} does not exist at all", sessionId);
                throw new ResourceNotFoundException("Interview session not found");
            } else {
                log.error("Session {} exists but belongs to different user (not userId={})", sessionId, userId);
                throw new ResourceNotFoundException("Interview session unauthorized access");
            }
        }
        return sessionOpt.get();
    }

    private String generateOverallFeedback(ReportDTO report) {
        int score = report.getTotalScore() != null ? report.getTotalScore() : 0;
        int total = report.getTotalQuestionsAsked() != null ? report.getTotalQuestionsAsked() : 18;
        int correct = report.getCorrectAnswers() != null ? report.getCorrectAnswers() : 0;
        int partial = report.getPartialAnswers() != null ? report.getPartialAnswers() : 0;
        int incorrect = report.getIncorrectAnswers() != null ? report.getIncorrectAnswers() : 0;
        double correctRate = total > 0 ? (correct * 100.0) / total : 0;
        
        StringBuilder feedback = new StringBuilder();
        
        // Performance tier
        if (score >= 85) {
            feedback.append("🌟 OUTSTANDING PERFORMANCE\n\n");
            feedback.append("Congratulations! You've demonstrated exceptional interview skills. ");
            feedback.append("Your responses showed deep technical knowledge, clear communication, and strong problem-solving abilities. ");
            feedback.append("You're well-prepared for senior-level positions.\n\n");
        } else if (score >= 70) {
            feedback.append("✅ STRONG PERFORMANCE\n\n");
            feedback.append("Great job! You've shown solid technical competence and good communication skills. ");
            feedback.append("With some refinement in specific areas, you'll be ready for challenging roles. ");
            feedback.append("Focus on adding more depth and examples to your answers.\n\n");
        } else if (score >= 55) {
            feedback.append("👍 SATISFACTORY PERFORMANCE\n\n");
            feedback.append("You've demonstrated foundational knowledge but have room for growth. ");
            feedback.append("Your answers covered basics but lacked depth in some areas. ");
            feedback.append("Practice explaining concepts more thoroughly with real examples.\n\n");
        } else if (score >= 40) {
            feedback.append("⚠️ NEEDS IMPROVEMENT\n\n");
            feedback.append("Your performance indicates gaps in preparation. ");
            feedback.append("Several answers were too brief or missed key technical points. ");
            feedback.append("Dedicate time to strengthening fundamentals and practicing structured responses.\n\n");
        } else {
            feedback.append("📚 MORE PREPARATION NEEDED\n\n");
            feedback.append("Your responses suggest you need more study and practice before interviews. ");
            feedback.append("Focus on core concepts, take online courses, and practice with the STAR method. ");
            feedback.append("Don't be discouraged - everyone starts somewhere!\n\n");
        }
        
        // Statistical breakdown
        feedback.append("📊 DETAILED BREAKDOWN\n");
        feedback.append("────────────────────\n");
        feedback.append(String.format("• Questions Answered: %d of %d\n", (correct + partial + incorrect), total));
        feedback.append(String.format("• Strong Answers (80%%+): %d (%.1f%%)\n", correct, correctRate));
        feedback.append(String.format("• Partial Answers (50-79%%): %d (%.1f%%)\n", partial, total > 0 ? (partial * 100.0) / total : 0));
        feedback.append(String.format("• Weak Answers (<50%%): %d (%.1f%%)\n\n", incorrect, total > 0 ? (incorrect * 100.0) / total : 0));
        
        // Personalized recommendations
        feedback.append("🎯 PERSONALIZED RECOMMENDATIONS\n");
        feedback.append("────────────────────────────────\n");
        
        if (correct < total / 2) {
            feedback.append("• Technical Depth: Review core concepts for your target role\n");
            feedback.append("• Practice: Use the STAR method (Situation, Task, Action, Result) for behavioral questions\n");
        }
        if (partial > correct) {
            feedback.append("• Completeness: Your answers often missed key details - practice expanding your responses\n");
            feedback.append("• Examples: Include more specific, quantifiable achievements\n");
        }
        if (incorrect > 3) {
            feedback.append("• Fundamentals: Focus on strengthening your core knowledge\n");
            feedback.append("• Confidence: Practice speaking about technical topics out loud\n");
        }
        if (score >= 70) {
            feedback.append("• Polish: Work on adding metrics and specific outcomes to your stories\n");
            feedback.append("• Leadership: Start incorporating examples of mentoring or leading initiatives\n");
        }
        
        feedback.append("\n💡 NEXT STEPS\n");
        feedback.append("──────────────\n");
        if (score >= 70) {
            feedback.append("• Apply to roles confidently - you're interview-ready!\n");
            feedback.append("• Consider targeting senior or lead positions\n");
        } else if (score >= 50) {
            feedback.append("• Continue practicing with mock interviews\n");
            feedback.append("• Review feedback on weaker questions and prepare better answers\n");
        } else {
            feedback.append("• Take structured courses on your target technology stack\n");
            feedback.append("• Practice daily with interview prep platforms\n");
            feedback.append("• Build projects to gain practical experience\n");
        }
        
        return feedback.toString();
    }
}
