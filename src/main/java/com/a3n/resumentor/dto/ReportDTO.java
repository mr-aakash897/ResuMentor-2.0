package com.a3n.resumentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private Long sessionId;
    private String jobRole;
    private Integer totalScore;
    private Integer durationMinutes;
    private Integer totalQuestionsAsked;
    private Integer correctAnswers;
    private Integer partialAnswers;
    private Integer incorrectAnswers;
    private List<QuestionFeedback> questionFeedbacks;
    private String overallFeedback;
    private List<String> strengthAreas;
    private List<String> improvementAreas;
    
    // Deep Analysis Fields
    private String performanceTier;
    private Double averageScorePerQuestion;
    private Integer basicQuestionsScore;
    private Integer intermediateQuestionsScore;
    private Integer advancedQuestionsScore;
    private Integer technicalScore;
    private Integer behavioralScore;
    private Integer communicationRating;
    private List<String> topPerformingAreas;
    private List<String> skillGapsIdentified;
    private List<String> actionableRecommendations;
    private String interviewReadinessLevel;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionFeedback {
        private Integer questionNumber;
        private String question;
        private String userAnswer;
        private String aiFeedback;
        private Integer score;
        private String difficulty;
        private String category;
        private List<String> keyPointsCovered;
        private List<String> missedPoints;
    }
}
