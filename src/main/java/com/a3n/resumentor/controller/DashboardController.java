package com.a3n.resumentor.controller;

import com.a3n.resumentor.dto.UserDTO;
import com.a3n.resumentor.entity.InterviewSession;
import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.service.AchievementService;
import com.a3n.resumentor.service.DashboardService;
import com.a3n.resumentor.service.UserService;
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
@RequestMapping("/api/dashboard")
@CrossOrigin("*")
@Slf4j
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private UserService userService;
    
    @Autowired
    private AchievementService achievementService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @GetMapping("/user")
    public ResponseEntity<?> getUserDashboard(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching dashboard for user: {}", userId);

            UserDTO userDTO = userService.getUserDTOById(userId);
            Map<String, Object> stats = dashboardService.getDashboardStats(userId);

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("user", userDTO);
            dashboard.put("stats", stats);

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("Error fetching dashboard: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching dashboard");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/resume-history")
    public ResponseEntity<?> getResumeHistory(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching resume history for user: {}", userId);

            List<Resume> resumes = dashboardService.getResumeHistory(userId);
            return ResponseEntity.ok(resumes);
        } catch (Exception e) {
            log.error("Error fetching resume history: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching resume history");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/interview-history")
    public ResponseEntity<?> getInterviewHistory(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching interview history for user: {}", userId);

            List<InterviewSession> interviews = dashboardService.getInterviewHistory(userId);
            return ResponseEntity.ok(interviews);
        } catch (Exception e) {
            log.error("Error fetching interview history: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching interview history");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/progress")
    public ResponseEntity<?> getProgressData(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching progress data for user: {}", userId);

            Map<String, Object> progressData = dashboardService.getProgressData(userId);
            return ResponseEntity.ok(progressData);
        } catch (Exception e) {
            log.error("Error fetching progress data: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching progress data");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/achievements")
    public ResponseEntity<?> getAchievements(@RequestHeader("Authorization") String token) {
        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Fetching achievements for user: {}", userId);

            List<Map<String, Object>> achievements = achievementService.getUserAchievements(userId);
            Map<String, Object> stats = achievementService.getAchievementStats(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("achievements", achievements);
            response.put("stats", stats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching achievements: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error fetching achievements");
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UserDTO userDTO,
            @RequestHeader("Authorization") String token) {

        try {
            Long userId = extractUserIdFromToken(token);
            log.info("Updating profile for user: {}", userId);

            userService.updateUserProfile(userId, userDTO);

            UserDTO updatedUser = userService.getUserDTOById(userId);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            log.error("Error updating profile: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Error updating profile");
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
