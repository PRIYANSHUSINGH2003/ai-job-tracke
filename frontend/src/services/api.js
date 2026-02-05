const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.sessionId = localStorage.getItem('sessionId');
  }

  setSession(sessionId) {
    this.sessionId = sessionId;
    localStorage.setItem('sessionId', sessionId);
  }

  clearSession() {
    this.sessionId = null;
    localStorage.removeItem('sessionId');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearSession();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(data.sessionId);
    return data;
  }

  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    const response = await fetch(`${API_URL}/api/resume/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    return response.json();
  }

  async getProfile() {
    return this.request('/api/user/profile');
  }

  async getJobs(filters = {}) {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    });
  }

  async trackApplication(jobId, status) {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, status }),
    });
  }

  async getApplications() {
    return this.request('/api/applications');
  }

  async updateApplicationStatus(applicationId, status) {
    return this.request(`/api/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async chatWithAI(message) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export default new ApiService();