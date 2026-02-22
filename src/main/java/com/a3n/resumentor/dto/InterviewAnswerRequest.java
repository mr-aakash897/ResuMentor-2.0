package com.a3n.resumentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewAnswerRequest {
    private Long sessionId;
    private Long questionId;
    private String answer;
}
