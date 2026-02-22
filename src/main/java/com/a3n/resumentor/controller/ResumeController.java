package com.a3n.resumentor.controller;

import com.a3n.resumentor.dto.ResumeAnalysisResponse;
import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.service.ResumeAnalysisService;
import com.a3n.resumentor.util.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin("*")
@Slf4j
public class ResumeController {

    @Autowired
    private ResumeAnalysisService resumeAnalysisService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAndAnalyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("jobRole") String jobRole,
            @RequestParam(value = "jobDescription", required = false) String jobDescription,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Resume upload request for user: {}", userId);

            ResumeAnalysisResponse response = resumeAnalysisService.analyzeResume(
                    file, jobRole, jobDescription, userId
            );

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("File processing error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error processing file: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Resume analysis error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Analysis failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{resumeId}")
    public ResponseEntity<?> getResume(
            @PathVariable Long resumeId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching resume: {} for user: {}", resumeId, userId);

            Resume resume = resumeAnalysisService.getResumeById(resumeId);
            
            // Authorization check: verify user owns this resume
            if (!resume.getUser().getId().equals(userId)) {
                log.warn("User {} attempted to access resume {} owned by another user", userId, resumeId);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied");
                return ResponseEntity.status(403).body(error);
            }
            
            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            log.error("Error fetching resume: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Resume not found");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/analysis/{resumeId}")
    public ResponseEntity<?> getResumeAnalysis(
            @PathVariable Long resumeId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching analysis for resume: {} for user: {}", resumeId, userId);

            // Authorization check: verify user owns this resume
            Resume resume = resumeAnalysisService.getResumeById(resumeId);
            if (!resume.getUser().getId().equals(userId)) {
                log.warn("User {} attempted to access analysis for resume {} owned by another user", userId, resumeId);
                Map<String, String> error = new HashMap<>();
                error.put("message", "Access denied");
                return ResponseEntity.status(403).body(error);
            }

            ResumeAnalysisResponse analysis = resumeAnalysisService.getResumeAnalysis(resumeId);
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            log.error("Error fetching analysis: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Analysis not found");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserResumes(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching resumes for user: {}", userId);

            List<Resume> resumes = resumeAnalysisService.getUserResumes(userId);
            return ResponseEntity.ok(resumes);
        } catch (Exception e) {
            log.error("Error fetching user resumes: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching resumes");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{resumeId}")
    public ResponseEntity<?> deleteResume(
            @PathVariable Long resumeId,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Deleting resume: {} for user: {}", resumeId, userId);

            resumeAnalysisService.deleteResume(resumeId, userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Resume deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting resume: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error deleting resume");
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
