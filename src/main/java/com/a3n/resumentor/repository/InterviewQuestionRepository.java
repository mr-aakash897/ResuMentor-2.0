package com.a3n.resumentor.repository;

import com.a3n.resumentor.entity.InterviewQuestion;
import com.a3n.resumentor.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findBySessionOrderByQuestionNumberAsc(InterviewSession session);
    Long countBySession(InterviewSession session);
}
