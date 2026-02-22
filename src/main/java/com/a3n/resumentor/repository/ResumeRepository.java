package com.a3n.resumentor.repository;

import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUserOrderByCreatedAtDesc(User user);
    List<Resume> findByUserId(Long userId);
}
