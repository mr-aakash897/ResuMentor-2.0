# 🎯 ResuMentor 2.0

<div align="center">

![ResuMentor Logo](src/main/resources/static/assets/favicon.svg)

**AI-Powered Resume Analyzer & Mock Interview Platform**

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-green?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Configuration](#-configuration) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📖 About

**ResuMentor** is a comprehensive career development platform that helps job seekers optimize their resumes and practice for interviews. Using AI-powered analysis, it provides actionable feedback to improve your chances of landing your dream job.

### 🎯 Problem Statement
- Many job seekers struggle with ATS (Applicant Tracking System) optimization
- Lack of access to quality interview practice and feedback
- No personalized guidance for resume improvement

### 💡 Solution
ResuMentor provides:
- Real-time ATS score analysis
- AI-powered resume feedback
- Voice-enabled mock interviews
- Personalized improvement suggestions
- Progress tracking with achievements

---

## ✨ Features

### 📄 Resume Analysis
- **ATS Score Calculation** - Get a compatibility score (0-100) for your resume
- **Section-by-Section Analysis** - Detailed feedback on Contact, Summary, Experience, Skills, Education
- **Keyword Optimization** - Suggestions for industry-specific keywords
- **Format Recommendations** - Tips for ATS-friendly formatting
- **PDF Export** - Download detailed analysis reports

### 🎤 Mock Interviews
- **Voice-Enabled Interviews** - Practice with speech recognition
- **AI-Generated Questions** - Role-specific technical and behavioral questions
- **Real-time Feedback** - Instant evaluation of your answers
- **Difficulty Progression** - Basic → Intermediate → Advanced questions
- **Comprehensive Reports** - Detailed performance breakdown with scores

### 📊 Dashboard & Progress
- **Analytics Overview** - Track resume uploads, interviews completed, average scores
- **Achievement System** - Unlock badges for milestones (First Resume, Interview Pro, etc.)
- **Recent Activity** - Quick access to past analyses and interviews
- **Progress Visualization** - Charts showing improvement over time

### 🎨 User Experience
- **Dark/Light Theme** - Toggle between themes with system preference detection
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Google OAuth** - Quick and secure authentication
- **Guest Mode** - Try the platform without registration

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Java 21** | Core programming language |
| **Spring Boot 4.0.3** | Application framework |
| **Spring Security** | Authentication & authorization |
| **Spring Data JPA** | Database ORM |
| **Hibernate 7** | JPA implementation |
| **MySQL 8** | Relational database |
| **JWT** | Token-based authentication |
| **Apache PDFBox** | PDF text extraction |
| **Apache POI** | Word document processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5/CSS3** | Structure & styling |
| **Vanilla JavaScript** | Client-side logic |
| **Web Speech API** | Voice recognition & synthesis |
| **Particles.js** | Background animations |
| **Google OAuth** | Social authentication |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Maven** | Build automation |
| **Spring Actuator** | Health monitoring |
| **Git** | Version control |

---

## 🚀 Installation

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
```bash
# Copy the template
cp src/main/resources/application.properties.template src/main/resources/application.properties

# Edit with your credentials
nano src/main/resources/application.properties  # or use any editor
```

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

## ⚙️ Configuration

### Required Configuration
Edit `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.password=YOUR_MYSQL_PASSWORD

# JWT Secret (minimum 256 bits)
jwt.secret=YOUR_SECURE_SECRET_KEY

# Google OAuth (get from Google Cloud Console)
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET

# OpenAI API Key (optional - for AI features)
openai.api.Key=YOUR_OPENAI_KEY
```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google Identity**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized origins: `http://localhost:8080`
6. Add authorized redirect URIs: `http://localhost:8080/login/oauth2/code/google`
7. Copy Client ID and Client Secret to your config

### Environment Variables (Alternative)
You can also use environment variables:
```bash
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
export OPENAI_API_KEY=your_openai_key
```

---

## 📡 API Reference

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
| `GET` | `/api/resume/{id}` | Get specific resume |
| `GET` | `/api/resume/analysis/{id}` | Get analysis results |
| `DELETE` | `/api/resume/{id}` | Delete resume |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/interview/start` | Start new interview session |
| `POST` | `/api/interview/answer` | Submit answer |
| `POST` | `/api/interview/{id}/end` | End interview |
| `GET` | `/api/interview/{id}/report` | Get interview report |
| `GET` | `/api/interview/user/sessions` | Get user's sessions |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Get user statistics |
| `GET` | `/api/dashboard/achievements` | Get achievements |
| `GET` | `/api/dashboard/recent-activity` | Get recent activity |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get user profile |
| `PUT` | `/api/user/profile` | Update profile |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/actuator/health` | Application health status |
| `GET` | `/actuator/info` | Application info |

---

## 🗄️ Database Schema

```
┌─────────────────┐     ┌──────────────────────┐
│     users       │     │       resumes        │
├─────────────────┤     ├──────────────────────┤
│ id (PK)         │────<│ user_id (FK)         │
│ email           │     │ id (PK)              │
│ name            │     │ file_url             │
│ google_id       │     │ job_role             │
│ profile_picture │     │ ats_score            │
│ tech_role       │     │ analysis_result      │
│ skills          │     │ created_at           │
│ ...             │     └──────────────────────┘
└─────────────────┘              │
        │                        │
        │     ┌──────────────────┴───────┐
        │     │   interview_sessions     │
        │     ├──────────────────────────┤
        └────<│ user_id (FK)             │
              │ resume_id (FK)           │
              │ id (PK)                  │
              │ score                    │
              │ status                   │
              │ feedback_report          │
              └──────────────────────────┘
                         │
              ┌──────────┴───────────┐
              │ interview_questions  │
              ├──────────────────────┤
              │ session_id (FK)      │
              │ id (PK)              │
              │ question_text        │
              │ user_answer          │
              │ ai_feedback          │
              │ answer_score         │
              └──────────────────────┘

┌─────────────────────┐
│    achievements     │
├─────────────────────┤
│ user_id (FK)        │
│ id (PK)             │
│ achievement_code    │
│ title               │
│ category            │
│ earned_at           │
└─────────────────────┘
```

---

## 📁 Project Structure

```
resumentor/
├── src/
│   ├── main/
│   │   ├── java/com/a3n/resumentor/
│   │   │   ├── config/           # Security, JWT, WebSocket configs
│   │   │   ├── controller/       # REST API endpoints
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── entity/           # JPA entities
│   │   │   ├── exception/        # Custom exceptions & handlers
│   │   │   ├── repository/       # Data access layer
│   │   │   ├── service/          # Business logic
│   │   │   ├── util/             # Utilities (JWT, PDF, File)
│   │   │   └── ResumentorApplication.java
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/          # Stylesheets
│   │       │   ├── js/           # JavaScript files
│   │       │   ├── pages/        # HTML pages
│   │       │   ├── assets/       # Images, icons
│   │       │   └── error/        # Error pages (404, 500)
│   │       └── application.properties.template
│   └── test/                     # Unit & integration tests
├── database_schema.sql           # MySQL schema
├── pom.xml                       # Maven dependencies
├── mvnw / mvnw.cmd              # Maven wrapper
└── README.md
```

---

## 🎮 Usage Guide

### 1. Getting Started
1. Sign in with Google or continue as Guest
2. Navigate to Dashboard to see your overview

### 2. Analyze Your Resume
1. Go to **Resume Analyzer**
2. Upload your resume (PDF or DOCX)
3. Select your target job role
4. (Optional) Paste job description for tailored analysis
5. Click **Analyze Resume**
6. Review your ATS score and detailed feedback
7. Download PDF report for reference

### 3. Practice Interviews
1. Go to **Mock Interview**
2. Select a resume to base questions on
3. Click **Start Interview**
4. Answer questions using voice or text
5. Receive instant AI feedback
6. Complete all 18 questions or end early
7. Review your comprehensive report

### 4. Track Progress
- View statistics on Dashboard
- Unlock achievements by reaching milestones
- Monitor improvement over time

---

## 🏆 Achievement System

| Achievement | Requirement | Category |
|-------------|-------------|----------|
| 🎯 First Resume | Upload your first resume | Resume |
| 📊 Resume Master | Achieve 80+ ATS score | Resume |
| 📝 Resume Collector | Upload 5 resumes | Resume |
| 🎤 First Interview | Complete first mock interview | Interview |
| ⭐ Interview Pro | Score 80+ in an interview | Interview |
| 🏆 Interview Champion | Complete 10 interviews | Interview |
| 👤 Profile Complete | Fill in all profile fields | Profile |
| 🔥 Consistent Learner | Use app 7 days in a row | Milestone |

---

## 🔒 Security Features

- **JWT Authentication** - Stateless token-based auth
- **Password Encryption** - BCrypt hashing
- **CORS Protection** - Configured allowed origins
- **Input Validation** - Request validation on all endpoints
- **SQL Injection Prevention** - Parameterized queries via JPA
- **XSS Protection** - Content-Type headers enforced
- **Authorization Checks** - Resource ownership verification

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: Access denied for user 'root'@'localhost'
```
→ Check your MySQL password in `application.properties`

**Google OAuth Not Working**
→ Verify Client ID/Secret and authorized redirect URIs in Google Console

**File Upload Failed**
→ Ensure `uploads/` directory exists and has write permissions

**Port Already in Use**
```bash
# Change port in application.properties
server.port=8081
```

---

## 🤝 Contributing

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Aakash**
- GitHub: [@mr-aakash897](https://github.com/mr-aakash897)

---

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [Particles.js](https://vincentgarreau.com/particles.js/) - Background effects
- [Google Fonts](https://fonts.google.com/) - Typography
- [Font Awesome](https://fontawesome.com/) - Icons

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by Aakash

</div>
