import { useState, useEffect } from 'react';
import { Calendar, Building, MapPin, Loader } from 'lucide-react';
import api from '../services/api';
import '../css/Applications.css';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.getApplications();
      setApplications(response.applications || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, newStatus) => {
    try {
      await api.updateApplicationStatus(applicationId, newStatus);
      loadApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Applied': '#667eea',
      'Applied Earlier': '#667eea',
      'Interview': '#f6ad55',
      'Offer': '#48bb78',
      'Rejected': '#f56565'
    };
    return colors[status] || '#718096';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader className="spinner" size={40} />
        <p>Loading applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="empty-applications">
        <div className="empty-content">
          <h2>No Applications Yet</h2>
          <p>Start applying to jobs and track your progress here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page fade-in">
      <div className="page-header">
        <h1>My Applications</h1>
        <p>{applications.length} total applications</p>
      </div>

      <div className="applications-grid">
        {applications.map((app) => (
          <div key={app.id} className="application-card">
            <div className="app-header">
              <div>
                <h3>{app.job.title}</h3>
                <div className="app-meta">
                  <span><Building size={14} /> {app.job.company}</span>
                  <span><MapPin size={14} /> {app.job.location}</span>
                </div>
              </div>
              <div
                className="status-badge"
                style={{ background: getStatusColor(app.status) }}
              >
                {app.status}
              </div>
            </div>

            <div className="app-timeline">
              {app.timeline.map((event, idx) => (
                <div key={idx} className="timeline-item">
                  <div 
                    className="timeline-dot" 
                    style={{ background: getStatusColor(event.status) }}
                  />
                  <div className="timeline-content">
                    <span className="timeline-status">{event.status}</span>
                    <span className="timeline-date">
                      <Calendar size={12} /> {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="app-actions">
              <label>Update Status:</label>
              <select
                value={app.status}
                onChange={(e) => updateStatus(app.id, e.target.value)}
                className="status-select"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}