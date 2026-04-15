# ResuMentor 2.0

<div align="center">

**AI-Powered Resume Analyzer & Mock Interview Platform**

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-green?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

[Features](#-features) · [Installation](#-installation) · [Configuration](#-configuration) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## About

**ResuMentor** is a comprehensive career development platform that helps job seekers optimize resumes and practice interviews. It combines AI-powered analysis (OpenAI GPT-3.5 with intelligent rule-based fallback), deterministic scoring guardrails, and webcam-based presence metrics to provide reliable, actionable feedback.

### Problem Statement
- Many job seekers struggle with ATS (Applicant Tracking System) optimization
- Lack of access to quality interview practice and feedback
- No personalized guidance for resume improvement

### Solution
ResuMentor provides:
- Real-time ATS score analysis with detailed breakdown
- AI-powered resume feedback (OpenAI GPT-3.5 or rule-based fallback)
- Voice-enabled mock interviews with webcam body language tracking
- Hybrid interview scoring (AI-parsed signal clamped by deterministic guardrails)
- Dynamic AI follow-up questions based on your answers
- Complete interview reports and PDF downloads, including question-by-question detail and body-language metrics
- Progress tracking with achievements and trend visualization

---

## Features

### Resume Analysis
- **ATS Score Calculation** - Get a compatibility score (0-100) for your resume
- **Dual-Mode AI Analysis** - OpenAI GPT-3.5-turbo as primary analyzer with intelligent rule-based fallback
- **Score Breakdown** - Keyword match, structure, experience quality, and soft skills scores
- **ATS Compatibility Breakdown** - Formatting, parsability, contact info, section organization, and keyword density scores
- **Keyword Analysis** - Top matched skills, critical missing skills, matched vs missing keywords
- **Skill Gap Identification** - Detailed analysis of what skills you need to develop
- **Competitive Analysis** - How your resume compares against the market
- **ATS Issues & Tips** - Specific formatting/content issues and optimization tips
- **PDF Export** - Download comprehensive analysis reports with progress bars and color-coded sections
- **40+ Job Roles** - Categorized across Software Development, Data & AI/ML, Cloud & DevOps, Security, QA, Design, Management, and Specialized Roles

### Mock Interviews
- **12-Question Sessions** - 4 Basic, 4 Intermediate, 4 Advanced questions per session
- **Voice-Enabled Interviews** - Practice with Web Speech API speech recognition and synthesis
- **AI-Generated Questions** - Role-specific technical and behavioral questions based on your resume
- **Dynamic Follow-Up Questions** - OpenAI generates conversational follow-ups based on your answers
- **Hybrid Scoring Engine** - AI-evaluation signals blended with deterministic scoring guardrails for more stable, consistent results
- **Real-time Feedback** - Instant AI evaluation with per-answer score updates
- **30-Minute Time Limit** - Count-up timer with automatic session completion
- **Body Language Tracking** - Webcam-based eye contact and face centering analysis via face-api.js
- **Hugging Face Face Metrics** - Engagement and confidence metrics captured server-side and included in final analysis
- **Performance Tiers** - Outstanding / Strong / Satisfactory / Needs Improvement / Requires Preparation
- **Comprehensive Reports** - Breakdown by difficulty level, technical vs behavioral scores, communication rating, strength areas, improvement areas, skill gaps, and actionable recommendations
- **Question-by-Question Review** - Detailed feedback for every question with your answers and AI assessment
- **PDF Report Download** - Full interview performance report with all metrics and expanded question review details

### Dashboard & Progress
- **User Profile** - Editable profile with tech role, experience level, skills, social links, and bio
- **Progress Charts** - Chart.js line charts showing ATS score and interview performance trends over time
- **Trend Badges** - Visual indicators showing improving, stable, or declining performance
- **Feedback Themes** - Common themes across your interview sessions
- **Resume History** - View analysis, download PDF, or delete past resume analyses
- **Interview History** - View reports, download PDF, or delete past interviews
- **Inline Detail Views** - View full analysis/reports without leaving the dashboard
- **Achievement System** - Unlock 15 badges for milestones across Resume, Interview, Profile, and Milestone categories
- **PDF Downloads** - Direct PDF download from history tables without viewing first

### User Experience
- **Dark/Light Theme** - Toggle between themes with system preference detection
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Google OAuth** - Quick and secure authentication
- **Guest Mode** - Try the platform without registration
- **Skeleton Loaders** - Smooth loading states across the dashboard
- **Toast Notifications** - Non-intrusive success/error feedback

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 21** | Core programming language |
| **Spring Boot 4.0.3** | Application framework |
| **Spring Security** | Authentication & authorization (JWT + OAuth2) |
| **Spring Data JPA** | Database ORM |
| **Hibernate 7** | JPA implementation |
| **MySQL 8** | Relational database |
| **JWT (jjwt 0.11.5)** | Token-based authentication |
| **OpenAI GPT-3.5-turbo** | AI-powered analysis and follow-up questions |
| **Hugging Face Inference API** | Face engagement/confidence metrics for interview analysis |
| **Apache PDFBox 2.0.30** | PDF text extraction |
| **Apache POI 5.2.3** | Word document processing |
| **iTextPDF 5.5.13** | Server-side PDF generation |
| **Spring WebSocket** | Real-time communication |
| **Spring Actuator** | Health monitoring |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5/CSS3** | Structure & styling |
| **Vanilla JavaScript** | Client-side logic (no frameworks) |
| **Web Speech API** | Voice recognition & synthesis |
| **face-api.js** | Webcam face detection for body language |
| **Chart.js** | Progress visualization charts |
| **jsPDF** | Client-side PDF report generation |
| **Google OAuth** | Social authentication |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Maven** | Build automation |
| **HikariCP** | Connection pool optimization |
| **Spring Actuator** | Health monitoring |
| **Git** | Version control |

---

## Installation

### Prerequisites
- **Java 21** or higher
- **MySQL 8.0** or higher
- **Maven 3.8+** (or use included wrapper)
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/mr-aakash897/ResuMentor-2.0.git
cd ResuMentor-2.0
```

### Step 2: Setup Database
```sql
-- Connect to MySQL and run:
CREATE DATABASE resumentor_db;
```

Or run the complete schema:
```bash
mysql -u root -p < database_schema.sql
```

### Step 3: Configure Application

Create the configuration file at `src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/resumentor_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.open-in-view=false

# JWT Secret (minimum 256 bits)
jwt.secret=YOUR_SECURE_SECRET_KEY

# Google OAuth
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET

# OpenAI API Key (optional - enables AI-powered analysis and follow-up questions)
openai.api.Key=YOUR_OPENAI_API_KEY

# Hugging Face (optional - enables server-side interview face metrics)
huggingface.api.token=YOUR_HUGGINGFACE_API_TOKEN
huggingface.api.model-url=https://api-inference.huggingface.co/models/trpakov/vit-face-expression

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

> **Note:** If OpenAI API key is not configured, the application falls back to a rule-based analyzer automatically.

### Step 4: Run the Application
```bash
# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Or with Maven installed
mvn spring-boot:run
```

### Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost:8080
```

---

## Configuration

### Required Configuration
| Property | Description |
|----------|-------------|
| `spring.datasource.password` | Your MySQL root password |
| `jwt.secret` | A secure random string (min 256 bits) for JWT signing |

### Optional Configuration
| Property | Description |
|----------|-------------|
| `spring.security.oauth2.client.registration.google.client-id` | Google OAuth Client ID |
| `spring.security.oauth2.client.registration.google.client-secret` | Google OAuth Client Secret |
| `openai.api.Key` | OpenAI API key for GPT-3.5-turbo features |
| `huggingface.api.token` | Hugging Face API token for interview face metrics |
| `huggingface.api.model-url` | Hugging Face model endpoint URL |

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google Identity**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized origins: `http://localhost:8080`
6. Add authorized redirect URIs: `http://localhost:8080/login/oauth2/code/google`
7. Copy Client ID and Client Secret to your config

### Environment Variables (Alternative)
```bash
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
export OPENAI_API_KEY=your_openai_key
export HUGGINGFACE_API_TOKEN=your_huggingface_token
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login/google` | Google OAuth login |
| `POST` | `/api/auth/guest-login` | Guest login |
| `GET` | `/api/auth/validate` | Validate JWT token |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resume/upload` | Upload and analyze resume |
| `GET` | `/api/resume/user` | Get user's resumes |
| `GET` | `/api/resume/{resumeId}` | Get specific resume |
| `GET` | `/api/resume/analysis/{resumeId}` | Get analysis results |
| `DELETE` | `/api/resume/{resumeId}` | Delete resume |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interview/start` | Start new interview session |
| `GET` | `/api/interview/{sessionId}/question` | Get next question |
| `POST` | `/api/interview/submit-answer` | Submit answer with feedback |
| `POST` | `/api/interview/{sessionId}/end` | End interview (optional eye contact, centering, HF engagement/confidence metrics) |
| `GET` | `/api/interview/{sessionId}/report` | Get performance report |
| `GET` | `/api/interview/user/history` | Get user's interview history |
| `DELETE` | `/api/interview/{sessionId}` | Delete interview session |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/user` | Get user profile and stats |
| `GET` | `/api/dashboard/resume-history` | Get resume history list |
| `GET` | `/api/dashboard/interview-history` | Get interview history list |
| `GET` | `/api/dashboard/progress` | Get progress tracking data |
| `GET` | `/api/dashboard/achievements` | Get achievements and stats |
| `PUT` | `/api/dashboard/profile` | Update user profile |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actuator/health` | Application health status |

> All `/api/**` endpoints (except `/api/auth/**`) require a valid JWT token in the `Authorization: Bearer <token>` header.

Example body for `POST /api/interview/{sessionId}/end`:

```json
{
  "eyeContactPercentage": 82,
  "faceCenteringScore": 76,
  "hfFaceEngagementScore": 71,
  "hfFaceConfidenceScore": 68
}
```

---

## Database Schema

```
┌─────────────────────┐     ┌──────────────────────────┐
│       users          │     │         resumes           │
├─────────────────────┤     ├──────────────────────────┤
│ id (PK)              │────<│ user_id (FK)              │
│ email                │     │ id (PK)                   │
│ name                 │     │ file_url                  │
│ google_id            │     │ job_role                  │
│ profile_picture_url  │     │ job_description           │
│ tech_role            │     │ ats_score                 │
│ experience_level     │     │ resume_text (LONGTEXT)    │
│ skills               │     │ analysis_result (LONGTEXT)│
│ location             │     │ created_at                │
│ bio                  │     └──────────────────────────┘
│ linkedin_url         │                │
│ github_url           │                │
│ portfolio_url        │     ┌──────────┴──────────────┐
│ is_guest             │     │  interview_sessions      │
│ created_at           │     ├─────────────────────────┤
└─────────────────────┘     │ id (PK)                  │
        │                    │ user_id (FK)             │
        └───────────────────<│ resume_id (FK)           │
                             │ score                    │
                             │ status (ONGOING/         │
                             │   COMPLETED/ABANDONED)   │
                             │ start_time               │
                             │ end_time                 │
                             │ duration_minutes         │
                             │ eye_contact_percentage   │
                             │ face_centering_score     │
                              │ hf_face_engagement_score │
                              │ hf_face_confidence_score │
                             │ transcript (LONGTEXT)    │
                             │ feedback_report (LONGTEXT│
                             └─────────────────────────┘
                                        │
                             ┌──────────┴──────────────┐
                             │  interview_questions     │
                             ├─────────────────────────┤
                             │ id (PK)                  │
                             │ session_id (FK)          │
                             │ question_number          │
                             │ question_text (LONGTEXT) │
                             │ user_answer (LONGTEXT)   │
                             │ ai_feedback (LONGTEXT)   │
                             │ answer_score             │
                             │ difficulty_level (BASIC/ │
                             │   INTERMEDIATE/ADVANCED) │
                             │ is_follow_up             │
                             └─────────────────────────┘

┌─────────────────────────┐
│      achievements        │
├─────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │
│ achievement_code         │
│ title                    │
│ description              │
│ icon                     │
│ category (RESUME/        │
│   INTERVIEW/PROFILE/     │
│   MILESTONE)             │
│ earned_at                │
└─────────────────────────┘
```

---

## Project Structure

```
resumentor-2.0/
├── src/
│   ├── main/
│   │   ├── java/com/a3n/resumentor/
│   │   │   ├── config/           # SecurityConfig, JwtAuthFilter, WebSocketConfig
│   │   │   ├── controller/       # AuthController, ResumeController,
│   │   │   │                     # InterviewController, DashboardController
│   │   │   ├── dto/              # Request/Response DTOs (6 classes)
│   │   │   ├── entity/           # JPA entities (5 classes)
│   │   │   ├── exception/        # ResourceNotFoundException, GlobalExceptionHandler
│   │   │   ├── repository/       # JPA repositories (5 interfaces)
│   │   │   ├── service/          # Business logic (6 services)
│   │   │   ├── util/             # JwtTokenProvider, PDFExtractor, FileUploadUtil,
│   │   │   │                     # MockAIAnalyzer, OpenAIService
│   │   │   └── ResumentorApplication.java
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── index.html    # Landing page
│   │       │   ├── css/          # 6 stylesheets (style, theme, dashboard,
│   │       │   │                 #   resume-analyzer, interview, tips)
│   │       │   ├── js/           # 10 scripts (api-client, auth, dashboard,
│   │       │   │                 #   interview, resume-analyzer, main,
│   │       │   │                 #   theme, ui-utils, tips, particles)
│   │       │   ├── pages/        # dashboard, resume-analyzer, interview,
│   │       │   │                 #   report, tips
│   │       │   ├── assets/       # favicon.svg, logo-icon.svg
│   │       │   └── error/        # 404.html, 500.html
│   │       └── application.properties
│   └── test/
├── database_schema.sql
├── pom.xml
├── mvnw / mvnw.cmd
├── LICENSE
└── README.md
```

---

## Usage Guide

### 1. Getting Started
1. Sign in with Google or continue as Guest
2. Navigate to Dashboard to see your overview

### 2. Analyze Your Resume
1. Go to **Resume Analyzer**
2. Upload your resume (PDF or DOCX, max 10MB)
3. Select your target job role from 40+ options
4. (Optional) Paste a job description for tailored analysis
5. Click **Analyze Resume**
6. Review your ATS score, score breakdown, ATS compatibility, matched/missing keywords, skill gaps, and suggestions
7. Download the full PDF report

### 3. Practice Interviews
1. Go to **Mock Interview**
2. Select a previously analyzed resume to base questions on
3. Click **Start Interview**
4. (Optional) Enable webcam for body language tracking
5. Answer 12 questions using voice or text (4 Basic, 4 Intermediate, 4 Advanced)
6. Receive instant AI feedback and hybrid score updates after each answer
7. AI generates follow-up questions based on your responses
8. Complete all questions or let the 30-minute timer end the session
9. Review your comprehensive performance report (including Hugging Face engagement/confidence when available)
10. Download the PDF report

### 4. Track Progress
- View resume ATS score trends and interview performance charts on Dashboard
- Unlock 15 achievements by reaching milestones
- Monitor improvement trends (improving/stable/declining indicators)
- Download PDF reports directly from history tables

---

## Achievement System

| Achievement | Description | Category |
|-------------|-------------|----------|
| First Steps | Analyzed your first resume | Resume |
| Resume Master | Analyzed 5 resumes | Resume |
| Resume Expert | Achieved 80%+ ATS score | Resume |
| Interview Ready | Completed your first interview | Interview |
| Interview Pro | Completed 5 interviews | Interview |
| Interview Master | Completed 10 interviews | Interview |
| High Scorer | Scored 80%+ in an interview | Interview |
| Perfect Score | Achieved a perfect interview score | Interview |
| Outstanding | Scored 90%+ in an interview | Interview |
| Strong Performer | Scored 70%+ in an interview | Interview |
| Quick Thinker | Completed interview in under 20 min | Interview |
| Profile Complete | Filled out your profile | Profile |
| Google Connected | Linked your Google account | Profile |
| All-Rounder | Used both resume and interview features | Milestone |
| Early Bird | One of the first users | Milestone |

---

## Security Features

- **JWT Authentication** - Stateless token-based auth (24-hour expiration)
- **Google OAuth 2.0** - Secure social login
- **BCrypt Password Encryption** - Industry-standard hashing
- **CORS Protection** - Configured allowed origins
- **SQL Injection Prevention** - Parameterized queries via JPA
- **Resource Ownership Verification** - Users can only access their own data
- **Stateless Session Management** - No server-side session storage
- **Protected API Layer** - All `/api/**` endpoints require JWT (except auth routes)
- **Public Static Assets** - CSS, JS, pages, and assets served without authentication

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: Access denied for user 'root'@'localhost'
```
Check your MySQL password in `application.properties`.

**Google OAuth Not Working**
Verify Client ID/Secret and authorized redirect URIs in Google Console.

**File Upload Failed**
Ensure `uploads/` directory exists and has write permissions. The application creates it automatically on first upload.

**OpenAI Features Not Working**
If `openai.api.Key` is not set or invalid, the app automatically falls back to rule-based analysis. Check your API key and ensure you have credits available.

**Hugging Face Metrics Missing in Report**
If `huggingface.api.token` is missing/invalid, interview scoring still works but HF engagement/confidence fields may be unavailable in the final report.

**Port Already in Use**
```bash
# Change port in application.properties
server.port=8081
```

**Voice Recognition Not Working**
Web Speech API requires a modern browser (Chrome/Edge recommended) and microphone permissions.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow Java naming conventions
- Write meaningful commit messages
- Add comments for complex logic
- Update README for new features

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Aakash**
- GitHub: [@mr-aakash897](https://github.com/mr-aakash897)

---

## Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [OpenAI](https://openai.com/) - AI-powered analysis
- [Chart.js](https://www.chartjs.org/) - Progress visualization
- [jsPDF](https://github.com/parallax/jsPDF) - Client-side PDF generation
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection
- [Google Fonts](https://fonts.google.com/) - Typography

---

<div align="center">

**Star this repo if you find it helpful!**

Made with care by Aakash

</div>
