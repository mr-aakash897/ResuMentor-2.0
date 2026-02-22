// ==================== API Client ==================== 
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('jwtToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('jwtToken', token);
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw { status: response.status, ...result };
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            const result = await response.json();
            if (!response.ok) {
                throw { status: response.status, ...result };
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw { status: response.status, ...result };
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            const result = await response.json();
            if (!response.ok) {
                throw { status: response.status, ...result };
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async uploadFile(endpoint, file, formData = {}) {
        try {
            const form = new FormData();
            form.append('file', file);
            
            Object.keys(formData).forEach(key => {
                form.append(key, formData[key]);
            });

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: form
            });
            const result = await response.json();
            if (!response.ok) {
                throw { status: response.status, ...result };
            }
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async loginWithGoogle(googleData) {
        return this.post('/auth/login/google', googleData);
    }

    async guestLogin() {
        return this.post('/auth/guest-login');
    }

    async validateToken() {
        return this.get('/auth/validate');
    }

    // Resume endpoints
    async uploadResume(file, jobRole, jobDescription) {
        return this.uploadFile('/resume/upload', file, { jobRole, jobDescription });
    }

    async getResume(resumeId) {
        return this.get(`/resume/${resumeId}`);
    }

    async getResumeAnalysis(resumeId) {
        return this.get(`/resume/analysis/${resumeId}`);
    }

    async getUserResumes() {
        return this.get('/resume/user');
    }

    async deleteResume(resumeId) {
        return this.delete(`/resume/${resumeId}`);
    }

    // Interview endpoints
    async startInterview(resumeId) {
        return this.post('/interview/start', { resumeId });
    }

    async getNextQuestion(sessionId) {
        return this.get(`/interview/${sessionId}/question`);
    }

    async submitAnswer(sessionId, questionId, answer) {
        return this.post('/interview/submit-answer', { sessionId, questionId, answer });
    }

    async endInterview(sessionId) {
        return this.post(`/interview/${sessionId}/end`);
    }

    async getInterviewReport(sessionId) {
        return this.get(`/interview/${sessionId}/report`);
    }

    async deleteInterview(sessionId) {
        return this.delete(`/interview/${sessionId}`);
    }

    async getUserInterviewHistory() {
        return this.get('/interview/user/history');
    }

    // Dashboard endpoints
    async getDashboard() {
        return this.get('/dashboard/user');
    }

    async getResumeHistory() {
        return this.get('/dashboard/resume-history');
    }

    async getInterviewHistory() {
        return this.get('/dashboard/interview-history');
    }

    async getProgressData() {
        return this.get('/dashboard/progress');
    }

    async updateProfile(userData) {
        return this.put('/dashboard/profile', userData);
    }

    async getAchievements() {
        return this.get('/dashboard/achievements');
    }
}

const apiClient = new APIClient();
