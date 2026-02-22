package com.a3n.resumentor.controller;

import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
@Slf4j
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> request) {
        log.info("Google login request received");

        String googleId = request.get("googleId");
        String email = request.get("email");
        String name = request.get("name");
        String profilePictureUrl = request.get("profilePictureUrl");

        // Validate required fields
        if (googleId == null || googleId.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Google ID is required");
            return ResponseEntity.badRequest().body(error);
        }
        if (email == null || email.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Email is required");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            String token = authService.loginWithGoogle(googleId, email, name, profilePictureUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Login successful");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Google login failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/guest-login")
    public ResponseEntity<?> guestLogin() {
        log.info("Guest login request received");

        try {
            String token = authService.loginAsGuest();

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Guest login successful");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Guest login failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Guest login failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String actualToken = token.replace("Bearer ", "");
            User user = authService.validateToken(actualToken);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("userId", user.getId());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", "Invalid token");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
