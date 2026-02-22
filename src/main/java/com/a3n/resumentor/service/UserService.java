package com.a3n.resumentor.service;

import com.a3n.resumentor.dto.UserDTO;
import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.exception.ResourceNotFoundException;
import com.a3n.resumentor.repository.InterviewSessionRepository;
import com.a3n.resumentor.repository.ResumeRepository;
import com.a3n.resumentor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private AchievementService achievementService;

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User createOrUpdateGoogleUser(String googleId, String email, String name, String profilePictureUrl) {
        User user = userRepository.findByGoogleId(googleId)
                .orElse(new User());

        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setName(name);
        user.setProfilePictureUrl(profilePictureUrl);
        user.setIsGuest(false);

        User savedUser = userRepository.save(user);
        log.info("Google user created/updated: {}", email);
        return savedUser;
    }

    public User createGuestUser() {
        User guestUser = new User();
        guestUser.setEmail("guest-" + System.currentTimeMillis() + "@resumentor.local");
        guestUser.setName("Guest User");
        guestUser.setIsGuest(true);

        User savedUser = userRepository.save(guestUser);
        log.info("Guest user created successfully");
        return savedUser;
    }

    public void updateUserProfile(Long userId, UserDTO userDTO) {
        User user = getUserById(userId);
        
        // Basic info
        if (userDTO.getName() != null) user.setName(userDTO.getName());
        if (userDTO.getAge() != null) user.setAge(userDTO.getAge());
        if (userDTO.getPhone() != null) user.setPhone(userDTO.getPhone());
        if (userDTO.getLocation() != null) user.setLocation(userDTO.getLocation());
        
        // Professional info
        if (userDTO.getTechRole() != null) user.setTechRole(userDTO.getTechRole());
        if (userDTO.getExperienceLevel() != null) user.setExperienceLevel(userDTO.getExperienceLevel());
        if (userDTO.getSkills() != null) user.setSkills(userDTO.getSkills());
        
        // Social links
        if (userDTO.getLinkedInUrl() != null) user.setLinkedInUrl(userDTO.getLinkedInUrl());
        if (userDTO.getGithubUrl() != null) user.setGithubUrl(userDTO.getGithubUrl());
        if (userDTO.getPortfolioUrl() != null) user.setPortfolioUrl(userDTO.getPortfolioUrl());
        
        // Bio
        if (userDTO.getBio() != null) user.setBio(userDTO.getBio());
        
        userRepository.save(user);
        log.info("User profile updated: {}", userId);

        // Check and award profile achievements
        try {
            achievementService.checkProfileAchievements(userId);
        } catch (Exception e) {
            log.warn("Error checking profile achievements: {}", e.getMessage());
        }
    }

    public UserDTO getUserDTOById(Long userId) {
        User user = getUserById(userId);
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setName(user.getName());
        userDTO.setAge(user.getAge());
        userDTO.setPhone(user.getPhone());
        userDTO.setLocation(user.getLocation());
        userDTO.setTechRole(user.getTechRole());
        userDTO.setExperienceLevel(user.getExperienceLevel());
        userDTO.setSkills(user.getSkills());
        userDTO.setLinkedInUrl(user.getLinkedInUrl());
        userDTO.setGithubUrl(user.getGithubUrl());
        userDTO.setPortfolioUrl(user.getPortfolioUrl());
        userDTO.setBio(user.getBio());
        userDTO.setProfilePictureUrl(user.getProfilePictureUrl());
        userDTO.setIsGuest(user.getIsGuest());
        userDTO.setIsGoogleUser(user.getGoogleId() != null && !user.getGoogleId().isEmpty());
        userDTO.setCreatedAt(user.getCreatedAt());
        userDTO.setTotalResumesAnalyzed(resumeRepository.findByUserId(userId).size());
        userDTO.setTotalInterviewsSessions(interviewSessionRepository.findByUserId(userId).size());

        return userDTO;
    }

    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
        log.info("User deleted: {}", userId);
    }
}
