import { useState } from 'react';
import { ExternalLink, MapPin, Briefcase, Clock } from 'lucide-react';
import '../css/JobCard.css';

export default function JobCard({ job, onApply }) {
  const [showDetails, setShowDetails] = useState(false);

  const getMatchBadgeClass = (score) => {
    if (score >= 70) return 'match-badge-high';
    if (score >= 40) return 'match-badge-medium';
    return 'match-badge-low';
  };

  const getMatchLabel = (score) => {
    if (score >= 70) return '🟢 High Match';
    if (score >= 40) return '🟡 Good Match';
    return '⚪ Low Match';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="job-card fade-in">
      <div className="job-card-header">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>
        {job.matchScore > 0 && (
          <span className={`match-badge ${getMatchBadgeClass(job.matchScore)}`}>
            {job.matchScore}% {getMatchLabel(job.matchScore)}
          </span>
        )}
      </div>

      <div className="job-meta">
        <span><MapPin size={16} /> {job.location}</span>
        <span><Briefcase size={16} /> {job.jobType}</span>
        <span><Clock size={16} /> {formatDate(job.postedDate)}</span>
      </div>

      <div className="job-tags">
        <span className="tag">{job.workMode}</span>
        {job.skills?.slice(0, 4).map((skill, idx) => (
          <span key={idx} className="tag">{skill}</span>
        ))}
      </div>

      {showDetails && job.matchDetails && job.matchScore > 0 && (
        <div className="match-details">
          <h4>Why this matches:</h4>
          {job.matchDetails.matchingSkills?.length > 0 && (
            <div>
              <strong>Matching Skills:</strong>
              <p>{job.matchDetails.matchingSkills.join(', ')}</p>
            </div>
          )}
          {job.matchDetails.reasoning && (
            <p><strong>Analysis:</strong> {job.matchDetails.reasoning}</p>
          )}
        </div>
      )}

      <div className="job-actions">
        {job.matchScore > 0 && (
          <button 
            className="btn-secondary" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Match Details'}
          </button>
        )}
        <button 
          className="btn-apply"
          onClick={() => {
            window.open(job.applyUrl, '_blank');
            onApply(job);
          }}
        >
          Apply <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
}