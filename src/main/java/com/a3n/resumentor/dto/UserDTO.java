package com.a3n.resumentor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private Integer age;
    private String techRole;
    private String experienceLevel;
    private String phone;
    private String location;
    private String skills;
    private String linkedInUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String bio;
    private String profilePictureUrl;
    private Boolean isGuest;
    private Boolean isGoogleUser;
    private LocalDateTime createdAt;
    private Integer totalResumesAnalyzed;
    private Integer totalInterviewsSessions;
}
