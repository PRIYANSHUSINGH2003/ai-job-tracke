import { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, FileText, Loader } from 'lucide-react';
import api from '../services/api';
import '../css/Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      await api.uploadResume(file);
      setUploadSuccess(true);
      await loadProfile();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader className="spinner" size={40} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your resume and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-section">
            <h2>Account Information</h2>
            <div className="info-row">
              <label>Email</label>
              <span>{profile?.email}</span>
            </div>
          </div>

          <div className="card-section">
            <h2>Resume</h2>
            
            {profile?.hasResume ? (
              <div className="resume-info">
                <div className="resume-details">
                  <FileText size={24} />
                  <div>
                    <p className="resume-filename">{profile.resumeFilename}</p>
                    <p className="resume-date">
                      Uploaded {new Date(profile.resumeUploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button 
                  className="btn-upload-new"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader className="spinner-icon" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Update Resume
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="no-resume">
                <p>No resume uploaded yet</p>
                <button 
                  className="btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader className="spinner-icon" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Resume
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {uploadSuccess && (
              <div className="success-message">
                <CheckCircle size={16} />
                Resume uploaded successfully!
              </div>
            )}

            <div className="resume-note">
              <p>Supported formats: PDF, TXT (Max 5MB)</p>
              <p>Your resume is used to calculate job match scores.</p>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Why Upload a Resume?</h3>
          <ul>
            <li>Get AI-powered job match scores</li>
            <li>See which skills match each job</li>
            <li>Find your best job opportunities</li>
            <li>Track relevant experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

