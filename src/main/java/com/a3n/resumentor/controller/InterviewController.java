package com.a3n.resumentor.controller;

import com.a3n.resumentor.dto.InterviewAnswerRequest;
import com.a3n.resumentor.dto.InterviewResponse;
import com.a3n.resumentor.dto.ReportDTO;
import com.a3n.resumentor.entity.InterviewSession;
import com.a3n.resumentor.service.InterviewService;
import com.a3n.resumentor.util.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin("*")
@Slf4j
public class InterviewController {

    @Autowired
    private InterviewService interviewService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/start")
    public ResponseEntity<?> startInterview(
            @RequestBody Map<String, Long> request,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            Long resumeId = request.get("resumeId");

            log.info("Starting interview for user: {}, resume: {}", userId, resumeId);

            InterviewSession session = interviewService.startInterview(userId, resumeId);

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getId());
            response.put("message", "Interview started successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error starting interview: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error starting interview: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{sessionId}/question")
    public ResponseEntity<?> getNextQuestion(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching next question for session: {} user: {}", sessionId, userId);

            InterviewResponse response = interviewService.getNextQuestion(sessionId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching question: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching question: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/submit-answer")
    public ResponseEntity<?> submitAnswer(
            @RequestBody InterviewAnswerRequest request,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Submitting answer for session: {} question: {}", request.getSessionId(), request.getQuestionId());

            InterviewResponse response = interviewService.submitAnswer(
                    request.getSessionId(),
                    request.getQuestionId(),
                    request.getAnswer(),
                    userId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error submitting answer: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error submitting answer: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endInterview(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Ending interview session: {} for user: {}", sessionId, userId);

            interviewService.endInterview(sessionId, userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Interview ended successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error ending interview: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error ending interview: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<?> getInterviewReport(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching interview report for session: {} user: {}", sessionId, userId);

            ReportDTO report = interviewService.getInterviewReport(sessionId, userId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error fetching report for session {}: {} - {}", sessionId, e.getClass().getSimpleName(), e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Error fetching report: " + e.getMessage());
            error.put("error", e.getClass().getSimpleName());
            error.put("sessionId", sessionId);
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/user/history")
    public ResponseEntity<?> getUserInterviewHistory(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching interview history for user: {}", userId);

            List<InterviewSession> interviews = interviewService.getUserInterviews(userId);
            return ResponseEntity.ok(interviews);
        } catch (Exception e) {
            log.error("Error fetching interview history: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching interview history");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> deleteInterview(
            @PathVariable Long sessionId,
            @RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Deleting interview session: {} for user: {}", sessionId, userId);

            interviewService.deleteInterview(sessionId, userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Interview deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting interview: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error deleting interview: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private Long extractUserIdFromToken(String token) {
        if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            return jwtTokenProvider.getUserIdFromToken(jwt);
        }
        throw new IllegalArgumentException("Invalid authorization token");
    }
}
