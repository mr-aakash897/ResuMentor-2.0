package com.a3n.resumentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.a3n.resumentor.entity.InterviewQuestion;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {
    private Long sessionId;
    private Long questionId;
    private String currentQuestion;
    private String jobRole;
    private Integer questionNumber;
    private Integer totalQuestions;
    private Integer elapsedMinutes;
    private Boolean isCompleted;
    private String feedback;
    private Integer currentScore;
    private InterviewQuestion.DifficultyLevel difficultyLevel;
}
