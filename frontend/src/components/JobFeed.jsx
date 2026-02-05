import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader } from 'lucide-react';
import api from '../services/api';
import JobCard from './JobCard';
import ApplicationPopup from './ApplicationPopup';
import '../css/JobFeed.css';

export default function JobFeed({ filters, setFilters }) {
  const [jobs, setJobs] = useState([]);
  const [bestMatches, setBestMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Filter states
  const [localFilters, setLocalFilters] = useState({
    role: '',
    skills: [],
    datePosted: 'any',
    jobType: '',
    workMode: '',
    location: '',
    matchScore: 'all'
  });

  const skillOptions = ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'Machine Learning', 'PyTorch', 'TensorFlow'];

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      setLocalFilters(prev => ({ ...prev, ...filters }));
      loadJobs(filters);
    }
  }, [filters]);

  const loadJobs = async (appliedFilters = localFilters) => {
    setLoading(true);
    try {
      const response = await api.getJobs(appliedFilters);
      setJobs(response.jobs || []);
      setBestMatches(response.bestMatches || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillToggle = (skill) => {
    setLocalFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    loadJobs(localFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      role: '',
      skills: [],
      datePosted: 'any',
      jobType: '',
      workMode: '',
      location: '',
      matchScore: 'all'
    };
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
    loadJobs(emptyFilters);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setTimeout(() => setShowPopup(true), 500);
  };

  const handlePopupClose = async (status) => {
    setShowPopup(false);
    if (status && selectedJob) {
      try {
        await api.trackApplication(selectedJob.id, status);
      } catch (error) {
        console.error('Failed to track application:', error);
      }
    }
    setSelectedJob(null);
  };

  const activeFilterCount = Object.values(localFilters).filter(v => 
    v && v !== 'any' && v !== 'all' && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="job-feed">
      <div className="feed-header">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={localFilters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel fade-in">
          <div className="filter-section">
            <label>Skills</label>
            <div className="skill-chips">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  className={`skill-chip ${localFilters.skills.includes(skill) ? 'active' : ''}`}
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-section">
              <label>Date Posted</label>
              <select
                value={localFilters.datePosted}
                onChange={(e) => handleFilterChange('datePosted', e.target.value)}
              >
                <option value="any">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
              </select>
            </div>

            <div className="filter-section">
              <label>Job Type</label>
              <select
                value={localFilters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
              >
                <option value="">All types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="filter-section">
              <label>Work Mode</label>
              <select
                value={localFilters.workMode}
                onChange={(e) => handleFilterChange('workMode', e.target.value)}
              >
                <option value="">All modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </div>

            <div className="filter-section">
              <label>Match Score</label>
              <select
                value={localFilters.matchScore}
                onChange={(e) => handleFilterChange('matchScore', e.target.value)}
              >
                <option value="all">All matches</option>
                <option value="high">High (70%)</option>
                <option value="medium">Medium (40-70%)</option>
              </select>
            </div>
          </div>

          <div className="filter-section">
            <label>Location</label>
            <input
              type="text"
              placeholder="City or region"
              value={localFilters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="btn-clear" onClick={clearFilters}>
              <X size={16} /> Clear All
            </button>
            <button className="btn-apply-filters" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={40} />
          <p>Loading jobs...</p>
        </div>
      ) : (
        <>
          {bestMatches.length > 0 && (
            <div className="best-matches">
              <h2>🎯 Best Matches for You</h2>
              <p>Top jobs matching your resume</p>
              <div className="job-grid">
                {bestMatches.map(job => (
                  <JobCard key={job.id} job={job} onApply={handleApply} />
                ))}
              </div>
            </div>
          )}

          <div className="all-jobs">
            <div className="section-header">
              <h2>All Jobs</h2>
              <span className="job-count">{jobs.length} jobs found</span>
            </div>
            
            {jobs.length === 0 ? (
              <div className="empty-state">
                <p>No jobs found matching your criteria.</p>
                <button className="btn-clear" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="job-list">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} onApply={handleApply} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showPopup && (
        <ApplicationPopup
          job={selectedJob}
          onClose={handlePopupClose}
        />
      )}
    </div>
  );
}
