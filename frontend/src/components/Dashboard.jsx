import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Briefcase, MessageSquare, X, Send, Loader } from 'lucide-react';
import api from '../services/api';
import JobFeed from './JobFeed';
import Applications from './Applications';
import Profile from './Profile';
import '../css/Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [filters, setFilters] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace('/', '');
    if (path) setActiveTab(path);
    else setActiveTab('jobs');
  }, [location]);

  const handleLogout = () => {
    api.clearSession();
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await api.chatWithAI(userMessage);
      
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.response }
      ]);

      // Apply filters from AI response
      if (response.filters && Object.keys(response.filters).length > 0) {
        setFilters(prev => ({ ...prev, ...response.filters }));
        if (activeTab !== 'jobs') {
          handleTabChange('jobs');
        }
      }

      // Handle clear filters
      if (response.intent === 'CLEAR') {
        setFilters({});
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">🎯 AI Job Tracker</h1>
          
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => handleTabChange('jobs')}
            >
              <Briefcase size={18} />
              Jobs
            </button>
            <button
              className={`nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => handleTabChange('applications')}
            >
              <Briefcase size={18} />
              Applications
            </button>
            <button
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              <User size={18} />
              Profile
            </button>
          </nav>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={<JobFeed filters={filters} setFilters={setFilters} />} />
          <Route path="/jobs" element={<JobFeed filters={filters} setFilters={setFilters} />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      {/* AI Chat Button */}
      <button
        className="chat-toggle-btn"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label="Toggle AI Assistant"
      >
        <MessageSquare size={24} />
      </button>

      {/* AI Chat Sidebar */}
      {chatOpen && (
        <div className="chat-sidebar slide-in">
          <div className="chat-header">
            <div>
              <h3>🤖 AI Assistant</h3>
              <p>Ask me to search or filter jobs!</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="close-btn">
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-welcome">
                <p>👋 Hi! I can help you:</p>
                <ul>
                  <li>Search for specific jobs</li>
                  <li>Apply filters automatically</li>
                  <li>Answer questions about the app</li>
                </ul>
                <p><strong>Try:</strong> "Show me React developer jobs"</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}

            {chatLoading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <Loader className="spinner-icon" size={16} /> Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={chatLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatLoading}
              className="send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}