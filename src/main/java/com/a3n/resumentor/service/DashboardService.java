package com.a3n.resumentor.service;

import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.entity.InterviewSession;
import com.a3n.resumentor.repository.ResumeRepository;
import com.a3n.resumentor.repository.InterviewSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    public Map<String, Object> getDashboardStats(Long userId) {
        log.info("Fetching dashboard stats for user: {}", userId);

        List<Resume> resumes = resumeRepository.findByUserId(userId);
        List<InterviewSession> interviews = interviewSessionRepository.findByUserId(userId);

        Map<String, Object> stats = new HashMap<>();

        // Resume statistics
        stats.put("totalResumesAnalyzed", resumes.size());
        stats.put("averageAtsScore", calculateAverageATSScore(resumes));
        stats.put("bestAtsScore", resumes.stream()
                .mapToInt(Resume::getAtsScore)
                .max()
                .orElse(0));

        // Interview statistics
        stats.put("totalInterviewSessions", interviews.size());
        stats.put("completedInterviews", interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .count());
        stats.put("averageInterviewScore", calculateAverageInterviewScore(interviews));

        return stats;
    }

    public Map<String, Object> getProgressData(Long userId) {
        log.info("Fetching progress data for user: {}", userId);
        
        List<Resume> resumes = resumeRepository.findByUserId(userId);
        List<InterviewSession> interviews = interviewSessionRepository.findByUserId(userId);
        
        Map<String, Object> progressData = new HashMap<>();
        
        // Get last 10 resume scores with dates
        List<Map<String, Object>> resumeProgress = resumes.stream()
                .sorted(Comparator.comparing(Resume::getCreatedAt))
                .limit(10)
                .map(r -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", r.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("MMM dd")));
                    point.put("score", r.getAtsScore());
                    point.put("jobRole", r.getJobRole());
                    return point;
                })
                .collect(Collectors.toList());
        
        // Get last 10 interview scores with dates
        List<Map<String, Object>> interviewProgress = interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED && i.getScore() != null)
                .sorted(Comparator.comparing(InterviewSession::getStartTime))
                .limit(10)
                .map(i -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", i.getStartTime().toLocalDate().format(DateTimeFormatter.ofPattern("MMM dd")));
                    point.put("score", i.getScore());
                    return point;
                })
                .collect(Collectors.toList());
        
        // Calculate improvement trends
        Map<String, Object> trends = calculateTrends(resumes, interviews);
        
        // Common feedback themes from interviews
        List<String> feedbackThemes = analyzeFeedbackThemes(interviews);
        
        progressData.put("resumeScores", resumeProgress);
        progressData.put("interviewScores", interviewProgress);
        progressData.put("trends", trends);
        progressData.put("feedbackThemes", feedbackThemes);
        
        return progressData;
    }
    
    private Map<String, Object> calculateTrends(List<Resume> resumes, List<InterviewSession> interviews) {
        Map<String, Object> trends = new HashMap<>();
        
        // Resume trend
        if (resumes.size() >= 2) {
            List<Resume> sorted = resumes.stream()
                    .sorted(Comparator.comparing(Resume::getCreatedAt))
                    .collect(Collectors.toList());
            int firstHalfAvg = (int) sorted.subList(0, sorted.size() / 2).stream()
                    .mapToInt(Resume::getAtsScore).average().orElse(0);
            int secondHalfAvg = (int) sorted.subList(sorted.size() / 2, sorted.size()).stream()
                    .mapToInt(Resume::getAtsScore).average().orElse(0);
            trends.put("resumeTrend", secondHalfAvg - firstHalfAvg);
            trends.put("resumeTrendDirection", secondHalfAvg > firstHalfAvg ? "improving" : secondHalfAvg < firstHalfAvg ? "declining" : "stable");
        } else {
            trends.put("resumeTrend", 0);
            trends.put("resumeTrendDirection", "insufficient_data");
        }
        
        // Interview trend
        List<InterviewSession> completed = interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED && i.getScore() != null)
                .sorted(Comparator.comparing(InterviewSession::getStartTime))
                .collect(Collectors.toList());
        
        if (completed.size() >= 2) {
            int firstHalfAvg = (int) completed.subList(0, completed.size() / 2).stream()
                    .mapToInt(InterviewSession::getScore).average().orElse(0);
            int secondHalfAvg = (int) completed.subList(completed.size() / 2, completed.size()).stream()
                    .mapToInt(InterviewSession::getScore).average().orElse(0);
            trends.put("interviewTrend", secondHalfAvg - firstHalfAvg);
            trends.put("interviewTrendDirection", secondHalfAvg > firstHalfAvg ? "improving" : secondHalfAvg < firstHalfAvg ? "declining" : "stable");
        } else {
            trends.put("interviewTrend", 0);
            trends.put("interviewTrendDirection", "insufficient_data");
        }
        
        return trends;
    }
    
    private List<String> analyzeFeedbackThemes(List<InterviewSession> interviews) {
        // Common interview feedback patterns
        List<String> themes = new ArrayList<>();
        
        long completedCount = interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .count();
        
        if (completedCount == 0) {
            themes.add("Complete more interviews to see feedback themes");
            return themes;
        }
        
        // Analyze based on scores
        double avgScore = interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED && i.getScore() != null)
                .mapToInt(InterviewSession::getScore)
                .average()
                .orElse(0);
        
        if (avgScore >= 75) {
            themes.add("✅ Strong technical knowledge demonstrated");
            themes.add("✅ Good communication skills");
        } else if (avgScore >= 50) {
            themes.add("📈 Technical concepts need more practice");
            themes.add("📈 Consider more detailed explanations");
        } else {
            themes.add("⚠️ Focus on fundamental concepts");
            themes.add("⚠️ Practice structuring your answers");
        }
        
        return themes;
    }

    public List<Resume> getResumeHistory(Long userId) {
        return resumeRepository.findByUserId(userId);
    }

    public List<InterviewSession> getInterviewHistory(Long userId) {
        return interviewSessionRepository.findByUserId(userId);
    }

    private double calculateAverageATSScore(List<Resume> resumes) {
        if (resumes.isEmpty()) return 0;
        return resumes.stream()
                .mapToInt(Resume::getAtsScore)
                .average()
                .orElse(0);
    }

    private double calculateAverageInterviewScore(List<InterviewSession> interviews) {
        List<InterviewSession> completed = interviews.stream()
                .filter(i -> i.getStatus() == InterviewSession.SessionStatus.COMPLETED && i.getScore() != null)
                .toList();

        if (completed.isEmpty()) return 0;
        return completed.stream()
                .mapToInt(InterviewSession::getScore)
                .average()
                .orElse(0);
    }
}
