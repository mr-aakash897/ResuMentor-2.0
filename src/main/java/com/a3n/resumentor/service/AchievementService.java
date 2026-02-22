package com.a3n.resumentor.service;

import com.a3n.resumentor.entity.Achievement;
import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.repository.AchievementRepository;
import com.a3n.resumentor.repository.InterviewSessionRepository;
import com.a3n.resumentor.repository.ResumeRepository;
import com.a3n.resumentor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
@Transactional
public class AchievementService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    // Achievement Definitions
    private static final Map<String, AchievementDef> ACHIEVEMENTS = new LinkedHashMap<>();

    static {
        // Profile Achievements
        ACHIEVEMENTS.put("PROFILE_COMPLETED", new AchievementDef(
            "Profile Pro", "Complete your profile with all details", "👤", "PROFILE"
        ));
        ACHIEVEMENTS.put("GOOGLE_CONNECTED", new AchievementDef(
            "Connected", "Sign in with Google", "🔗", "PROFILE"
        ));

        // Resume Achievements
        ACHIEVEMENTS.put("FIRST_RESUME", new AchievementDef(
            "First Steps", "Analyze your first resume", "📄", "RESUME"
        ));
        ACHIEVEMENTS.put("RESUME_MASTER", new AchievementDef(
            "Resume Master", "Analyze 5 resumes", "📋", "RESUME"
        ));
        ACHIEVEMENTS.put("RESUME_EXPERT", new AchievementDef(
            "Resume Expert", "Analyze 10 resumes", "📊", "RESUME"
        ));
        ACHIEVEMENTS.put("HIGH_SCORER", new AchievementDef(
            "High Scorer", "Get an ATS score of 85 or above", "🎯", "RESUME"
        ));
        ACHIEVEMENTS.put("PERFECT_SCORE", new AchievementDef(
            "Perfectionist", "Get a perfect ATS score of 100", "💯", "RESUME"
        ));

        // Interview Achievements
        ACHIEVEMENTS.put("FIRST_INTERVIEW", new AchievementDef(
            "Interview Ready", "Complete your first mock interview", "🎤", "INTERVIEW"
        ));
        ACHIEVEMENTS.put("INTERVIEW_PRO", new AchievementDef(
            "Interview Pro", "Complete 5 mock interviews", "🎙️", "INTERVIEW"
        ));
        ACHIEVEMENTS.put("INTERVIEW_MASTER", new AchievementDef(
            "Interview Master", "Complete 10 mock interviews", "🏆", "INTERVIEW"
        ));
        ACHIEVEMENTS.put("OUTSTANDING_PERFORMANCE", new AchievementDef(
            "Outstanding!", "Score 90%+ in an interview", "🌟", "INTERVIEW"
        ));
        ACHIEVEMENTS.put("STRONG_PERFORMER", new AchievementDef(
            "Strong Performer", "Score 80%+ in an interview", "💪", "INTERVIEW"
        ));
        ACHIEVEMENTS.put("QUICK_THINKER", new AchievementDef(
            "Quick Thinker", "Complete an interview in under 10 minutes", "⚡", "INTERVIEW"
        ));

        // Milestone Achievements
        ACHIEVEMENTS.put("WEEK_STREAK", new AchievementDef(
            "Consistent", "Practice for 7 days in a row", "🔥", "MILESTONE"
        ));
        ACHIEVEMENTS.put("EARLY_BIRD", new AchievementDef(
            "Early Adopter", "Be among the first users", "🌅", "MILESTONE"
        ));
        ACHIEVEMENTS.put("ALL_ROUNDER", new AchievementDef(
            "All-Rounder", "Analyze a resume AND complete an interview", "🎖️", "MILESTONE"
        ));
    }

    public List<Map<String, Object>> getUserAchievements(Long userId) {
        List<Achievement> earned = achievementRepository.findByUserIdOrderByEarnedAtDesc(userId);
        Set<String> earnedCodes = new HashSet<>();
        earned.forEach(a -> earnedCodes.add(a.getAchievementCode()));

        List<Map<String, Object>> result = new ArrayList<>();

        // First add earned achievements
        for (Achievement achievement : earned) {
            Map<String, Object> achMap = new HashMap<>();
            achMap.put("code", achievement.getAchievementCode());
            achMap.put("title", achievement.getTitle());
            achMap.put("description", achievement.getDescription());
            achMap.put("icon", achievement.getIcon());
            achMap.put("category", achievement.getCategory());
            achMap.put("earned", true);
            achMap.put("earnedAt", achievement.getEarnedAt());
            result.add(achMap);
        }

        // Then add locked achievements
        for (Map.Entry<String, AchievementDef> entry : ACHIEVEMENTS.entrySet()) {
            if (!earnedCodes.contains(entry.getKey())) {
                Map<String, Object> achMap = new HashMap<>();
                achMap.put("code", entry.getKey());
                achMap.put("title", entry.getValue().title);
                achMap.put("description", entry.getValue().description);
                achMap.put("icon", "🔒");
                achMap.put("category", entry.getValue().category);
                achMap.put("earned", false);
                achMap.put("earnedAt", null);
                result.add(achMap);
            }
        }

        return result;
    }

    public Map<String, Object> getAchievementStats(Long userId) {
        long earnedCount = achievementRepository.countByUserId(userId);
        int totalCount = ACHIEVEMENTS.size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("earned", earnedCount);
        stats.put("total", totalCount);
        stats.put("percentage", totalCount > 0 ? (earnedCount * 100) / totalCount : 0);
        return stats;
    }

    public Achievement checkAndAward(Long userId, String achievementCode) {
        if (!ACHIEVEMENTS.containsKey(achievementCode)) {
            log.warn("Unknown achievement code: {}", achievementCode);
            return null;
        }

        if (achievementRepository.existsByUserIdAndAchievementCode(userId, achievementCode)) {
            return null; // Already earned
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        AchievementDef def = ACHIEVEMENTS.get(achievementCode);
        Achievement achievement = Achievement.builder()
            .user(user)
            .achievementCode(achievementCode)
            .title(def.title)
            .description(def.description)
            .icon(def.icon)
            .category(def.category)
            .build();

        Achievement saved = achievementRepository.save(achievement);
        log.info("Achievement earned: {} by user {}", achievementCode, userId);
        return saved;
    }

    // Check for resume-related achievements
    public List<Achievement> checkResumeAchievements(Long userId, int atsScore) {
        List<Achievement> newAchievements = new ArrayList<>();

        int resumeCount = resumeRepository.findByUserId(userId).size();

        // First Resume
        if (resumeCount >= 1) {
            Achievement a = checkAndAward(userId, "FIRST_RESUME");
            if (a != null) newAchievements.add(a);
        }

        // Resume Master (5)
        if (resumeCount >= 5) {
            Achievement a = checkAndAward(userId, "RESUME_MASTER");
            if (a != null) newAchievements.add(a);
        }

        // Resume Expert (10)
        if (resumeCount >= 10) {
            Achievement a = checkAndAward(userId, "RESUME_EXPERT");
            if (a != null) newAchievements.add(a);
        }

        // High Scorer (85+)
        if (atsScore >= 85) {
            Achievement a = checkAndAward(userId, "HIGH_SCORER");
            if (a != null) newAchievements.add(a);
        }

        // Perfect Score (100)
        if (atsScore >= 100) {
            Achievement a = checkAndAward(userId, "PERFECT_SCORE");
            if (a != null) newAchievements.add(a);
        }

        // Check All-Rounder
        checkAllRounder(userId, newAchievements);

        return newAchievements;
    }

    // Check for interview-related achievements
    public List<Achievement> checkInterviewAchievements(Long userId, int score, int durationMinutes) {
        List<Achievement> newAchievements = new ArrayList<>();

        int interviewCount = interviewSessionRepository.findByUserId(userId).size();

        // First Interview
        if (interviewCount >= 1) {
            Achievement a = checkAndAward(userId, "FIRST_INTERVIEW");
            if (a != null) newAchievements.add(a);
        }

        // Interview Pro (5)
        if (interviewCount >= 5) {
            Achievement a = checkAndAward(userId, "INTERVIEW_PRO");
            if (a != null) newAchievements.add(a);
        }

        // Interview Master (10)
        if (interviewCount >= 10) {
            Achievement a = checkAndAward(userId, "INTERVIEW_MASTER");
            if (a != null) newAchievements.add(a);
        }

        // Outstanding (90+)
        if (score >= 90) {
            Achievement a = checkAndAward(userId, "OUTSTANDING_PERFORMANCE");
            if (a != null) newAchievements.add(a);
        }

        // Strong Performer (80+)
        if (score >= 80) {
            Achievement a = checkAndAward(userId, "STRONG_PERFORMER");
            if (a != null) newAchievements.add(a);
        }

        // Quick Thinker (<10 min)
        if (durationMinutes > 0 && durationMinutes < 10) {
            Achievement a = checkAndAward(userId, "QUICK_THINKER");
            if (a != null) newAchievements.add(a);
        }

        // Check All-Rounder
        checkAllRounder(userId, newAchievements);

        return newAchievements;
    }

    private void checkAllRounder(Long userId, List<Achievement> newAchievements) {
        int resumeCount = resumeRepository.findByUserId(userId).size();
        int interviewCount = interviewSessionRepository.findByUserId(userId).size();

        if (resumeCount > 0 && interviewCount > 0) {
            Achievement a = checkAndAward(userId, "ALL_ROUNDER");
            if (a != null) newAchievements.add(a);
        }
    }

    // Check profile achievements
    public List<Achievement> checkProfileAchievements(Long userId) {
        List<Achievement> newAchievements = new ArrayList<>();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return newAchievements;

        // Google Connected
        if (user.getGoogleId() != null && !user.getGoogleId().isEmpty()) {
            Achievement a = checkAndAward(userId, "GOOGLE_CONNECTED");
            if (a != null) newAchievements.add(a);
        }

        // Profile Completed
        if (user.getName() != null && user.getTechRole() != null && 
            user.getExperienceLevel() != null && user.getSkills() != null) {
            Achievement a = checkAndAward(userId, "PROFILE_COMPLETED");
            if (a != null) newAchievements.add(a);
        }

        return newAchievements;
    }

    // Inner class for achievement definitions
    private static class AchievementDef {
        String title;
        String description;
        String icon;
        String category;

        AchievementDef(String title, String description, String icon, String category) {
            this.title = title;
            this.description = description;
            this.icon = icon;
            this.category = category;
        }
    }
}
