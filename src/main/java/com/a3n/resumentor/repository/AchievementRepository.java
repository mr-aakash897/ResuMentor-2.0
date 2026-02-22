package com.a3n.resumentor.repository;

import com.a3n.resumentor.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    
    List<Achievement> findByUserIdOrderByEarnedAtDesc(Long userId);
    
    Optional<Achievement> findByUserIdAndAchievementCode(Long userId, String achievementCode);
    
    boolean existsByUserIdAndAchievementCode(Long userId, String achievementCode);
    
    @Query("SELECT COUNT(a) FROM Achievement a WHERE a.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT a FROM Achievement a WHERE a.user.id = :userId AND a.category = :category ORDER BY a.earnedAt DESC")
    List<Achievement> findByUserIdAndCategory(@Param("userId") Long userId, @Param("category") String category);
}
