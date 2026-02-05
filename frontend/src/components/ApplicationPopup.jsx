import { X } from 'lucide-react';
import '../css/ApplicationPopup.css';

export default function ApplicationPopup({ job, onClose }) {
  if (!job) return null;

  return (
    <div className="popup-overlay" onClick={() => onClose(null)}>
      <div className="popup-content fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={() => onClose(null)}>
          <X size={20} />
        </button>

        <h2>Did you apply to this job?</h2>
        <div className="job-info">
          <h3>{job.title}</h3>
          <p>{job.company}</p>
        </div>

        <div className="popup-actions">
          <button 
            className="btn-option btn-applied"
            onClick={() => onClose('Applied')}
          >
            ✓ Yes, Applied
          </button>
          <button 
            className="btn-option btn-earlier"
            onClick={() => onClose('Applied Earlier')}
          >
            📅 Applied Earlier
          </button>
          <button 
            className="btn-option btn-browsing"
            onClick={() => onClose(null)}
          >
            👀 Just Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
