package com.a3n.resumentor.repository;

import com.a3n.resumentor.entity.InterviewSession;
import com.a3n.resumentor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserOrderByStartTimeDesc(User user);
    List<InterviewSession> findByUserId(Long userId);
    
    @Query("SELECT s FROM InterviewSession s JOIN FETCH s.user u WHERE s.id = :sessionId AND u.id = :userId")
    Optional<InterviewSession> findBySessionIdAndUserId(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}
