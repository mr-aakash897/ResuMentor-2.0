-- Create Database
CREATE DATABASE IF NOT EXISTS resumentor_db;
USE resumentor_db;

-- User Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    age INT,
    tech_role VARCHAR(100),
    google_id VARCHAR(255) UNIQUE,
    profile_picture_url TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    location VARCHAR(255),
    skills TEXT,
    linked_in_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    bio TEXT,
    experience_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
);

-- Resume Analysis Table
CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    job_role VARCHAR(100),
    job_description LONGTEXT,
    ats_score INT,
    analysis_result LONGTEXT,
    resume_text LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_job_role (job_role)
);

-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resume_id BIGINT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INT,
    transcript LONGTEXT,
    feedback_report LONGTEXT,
    score INT,
    status ENUM('ONGOING', 'COMPLETED', 'ABANDONED') DEFAULT 'ONGOING',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    INDEX idx_user_id (user_id),
    INDEX idx_resume_id (resume_id),
    INDEX idx_status (status)
);

-- Interview Questions Table
CREATE TABLE IF NOT EXISTS interview_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    question_text LONGTEXT NOT NULL,
    difficulty_level ENUM('BASIC', 'INTERMEDIATE', 'ADVANCED'),
    user_answer LONGTEXT,
    ai_feedback LONGTEXT,
    answer_score INT,
    question_number INT,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_question_number (question_number)
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_code VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(100),
    category VARCHAR(50),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_code),
    INDEX idx_user_id (user_id),
    INDEX idx_category (category)
);

-- Create Indexes for better performance
CREATE INDEX idx_resume_created_at ON resumes(created_at DESC);
CREATE INDEX idx_session_created_at ON interview_sessions(start_time DESC);
