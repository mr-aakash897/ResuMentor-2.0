package com.a3n.resumentor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;

    @Column(columnDefinition = "LONGTEXT")
    private String userAnswer;

    @Column(columnDefinition = "LONGTEXT")
    private String aiFeedback;

    private Integer answerScore;
    private Integer questionNumber;

    public enum DifficultyLevel {
        BASIC, INTERMEDIATE, ADVANCED
    }
}
