package com.a3n.resumentor.service;

import com.a3n.resumentor.dto.ResumeAnalysisResponse;
import com.a3n.resumentor.entity.Resume;
import com.a3n.resumentor.entity.User;
import com.a3n.resumentor.exception.ResourceNotFoundException;
import com.a3n.resumentor.repository.ResumeRepository;
import com.a3n.resumentor.repository.UserRepository;
import com.a3n.resumentor.util.FileUploadUtil;
import com.a3n.resumentor.util.MockAIAnalyzer;
import com.a3n.resumentor.util.PDFExtractor;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Slf4j
@Transactional
public class ResumeAnalysisService {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileUploadUtil fileUploadUtil;

    @Autowired
    private PDFExtractor pdfExtractor;

    @Autowired
    private MockAIAnalyzer mockAIAnalyzer;

    @Autowired
    private AchievementService achievementService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeAnalysisResponse analyzeResume(MultipartFile file, String jobRole, String jobDescription, Long userId) throws IOException {
        log.info("Starting resume analysis for user: {}, job role: {}", userId, jobRole);

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Upload file
        String fileUrl = fileUploadUtil.uploadFile(file);
        String fileName = file.getOriginalFilename();

        // Extract text
        String resumeText = pdfExtractor.extractText(fileUrl);
        log.info("Resume text extracted successfully");

        // Analyze using mock AI
        ResumeAnalysisResponse analysisResponse = mockAIAnalyzer.analyzeResume(resumeText, jobRole, jobDescription);

        // Save to database
        Resume resume = new Resume();
        resume.setUser(user);
        resume.setFileUrl(fileUrl);
        resume.setFileName(fileName);
        resume.setJobRole(jobRole);
        resume.setJobDescription(jobDescription);
        resume.setAtsScore(analysisResponse.getAtsScore());
        resume.setResumeText(resumeText);
        resume.setAnalysisResult(objectMapper.writeValueAsString(analysisResponse));

        Resume savedResume = resumeRepository.save(resume);
        analysisResponse.setResumeId(savedResume.getId());

        // Check and award any achievements
        try {
            achievementService.checkResumeAchievements(userId, analysisResponse.getAtsScore());
        } catch (Exception e) {
            log.warn("Error checking achievements: {}", e.getMessage());
        }

        log.info("Resume analyzed and saved successfully. Resume ID: {}", savedResume.getId());
        return analysisResponse;
    }

    public Resume getResumeById(Long resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + resumeId));
    }

    public ResumeAnalysisResponse getResumeAnalysis(Long resumeId) {
        Resume resume = getResumeById(resumeId);
        try {
            return objectMapper.readValue(resume.getAnalysisResult(), ResumeAnalysisResponse.class);
        } catch (IOException e) {
            log.error("Error deserializing analysis result for resume: {}", resumeId, e);
            throw new RuntimeException("Error retrieving analysis result");
        }
    }

    public List<Resume> getUserResumes(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return resumeRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public void deleteResume(Long resumeId, Long userId) {
        Resume resume = getResumeById(resumeId);

        // Verify ownership
        if (!resume.getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized to delete this resume");
        }

        // Delete file
        fileUploadUtil.deleteFile(resume.getFileUrl());

        // Delete from database
        resumeRepository.delete(resume);
        log.info("Resume deleted: {}", resumeId);
    }
}
