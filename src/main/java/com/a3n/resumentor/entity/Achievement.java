package com.a3n.resumentor.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "achievements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String achievementCode;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    private String icon;
    private String category; // RESUME, INTERVIEW, PROFILE, MILESTONE

    @CreationTimestamp
    private LocalDateTime earnedAt;
}
