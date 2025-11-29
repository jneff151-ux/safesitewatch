// App.js - Complete SafeSiteWatch Frontend
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = 'https://safesitewatch-api.onrender.com/api';

function App() {
  const [user, setUser] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState({ securityScore: 0, activeAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');


   // Inject animation styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .pulse-indicator {
        animation: pulse 2s infinite;
        display: inline-block;
      }
      
      .rotate-indicator {
        animation: rotate 2s linear infinite;
        display: inline-block;
      }
      
      .monitoring-active {
        background: linear-gradient(270deg, #667eea, #764ba2, #667eea);
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);
    

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setWebsites(response.data.websites || []);
        setStats({
          securityScore: response.data.securityScore || 0,
          activeAlerts: response.data.activeAlerts || 0
        });
        setUser(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/${authMode}`, {
        email,
        password,
        companyName: authMode === 'register' ? companyName : undefined
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        fetchDashboard();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Authentication failed');
    }
  };

  // Add website
  const handleAddWebsite = async () => {
    // CHECK WEBSITE LIMIT FIRST
    if (websites.length >= 3) {
      alert('You can monitor up to 3 websites on the current plan. Contact support@safesitewatch.net to upgrade.');
      return;
    }
    
    if (!newWebsiteUrl.startsWith('http://') && !newWebsiteUrl.startsWith('https://')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/websites`, 
        { url: newWebsiteUrl },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setNewWebsiteUrl('');
        setShowAddWebsite(false);
        fetchDashboard();
        alert('Website added! We\'ll start monitoring it right away.');
      }
    } catch (error) {
      alert('Error adding website: ' + (error.response?.data?.error || error.message));
    }
  };

  // Remove website
  const handleRemoveWebsite = async (id) => {
    if (!window.confirm('Remove this website from monitoring?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/websites/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchDashboard();
    } catch (error) {
      alert('Error removing website: ' + (error.response?.data?.error || error.message));
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWebsites([]);
    setEmail('');
    setPassword('');
    setCompanyName('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading SafeSiteWatch...</div>
      </div>
    );
  }

  
            
// Add the forgot password handler
const handleForgotPassword = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: resetEmail
    });
    
    if (response.data.success) {
      setResetMessage('Reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
        setResetEmail('');
      }, 3000);
    }
  } catch (error) {
    setResetMessage(error.response?.data?.message || 'Error sending reset email');
  }
};

// Login/Register screen
if (!user) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🛡️ SafeSiteWatch</h1>
          <p className="text-gray-600">Website Security Monitoring Made Simple</p>
        </div>
        
        <div className="flex mb-6">
          <button
            onClick={() => {
              setAuthMode('login');
              setError('');
            }}
            className={`flex-1 py-2 font-semibold transition-colors ${
              authMode === 'login' 
                ? 'border-b-2 border-indigo-500 text-indigo-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthMode('register');
              setError('');
            }}
            className={`flex-1 py-2 font-semibold transition-colors ${
              authMode === 'register' 
                ? 'border-b-2 border-indigo-500 text-indigo-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <input
              type="text"
              placeholder="Company Name"
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-indigo-500"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 border rounded-lg focus:outline-none focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {/* FORGOT PASSWORD LINK - NEW! */}
          {authMode === 'login' && (
            <div className="text-right">
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
          >
            {authMode === 'login' ? 'Login' : 'Start Free Trial'}
          </button>
        </form>
        
        {authMode === 'register' && (
          <p className="text-center text-sm text-gray-600 mt-4">
            7-day free trial • $17 first month • Then $29/month
          </p>
        )}
      </div>

      {/* FORGOT PASSWORD MODAL - NEW! */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h3>
            <p className="text-gray-600 mb-6">Enter your email and we'll send you reset instructions.</p>
            
            <input
              type="email"
              placeholder="Your email address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-indigo-500 mb-4"
              autoFocus
            />
            
            {resetMessage && (
              <div className={`p-3 rounded-lg mb-4 ${
                resetMessage.includes('sent') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {resetMessage}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={handleForgotPassword}
                className="flex-1 bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
              >
                Send Reset Email
              </button>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetMessage('');
                  setResetEmail('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">🛡️ SafeSiteWatch</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome back!</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Security Score</p>
                <p className="text-4xl font-bold mt-2 text-green-500">{stats.securityScore}</p>
                <p className="text-sm text-gray-600 mt-1">Overall health</p>
              </div>
              <div className="text-4xl">🛡️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Monitored Sites</p>
                <p className="text-4xl font-bold mt-2">{websites.length}</p>
                <p className="text-sm text-gray-600 mt-1">Active monitors</p>
              </div>
              <div className="text-4xl">🌐</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Alerts</p>
                <p className="text-4xl font-bold mt-2 text-red-500">{stats.activeAlerts}</p>
                <p className="text-sm text-gray-600 mt-1">Need attention</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>
        </div>

        {/* Add Website Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          {!showAddWebsite ? (
            <button
              onClick={() => setShowAddWebsite(true)}
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600"
            >
              + Add Website to Monitor
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full p-3 border rounded-lg focus:outline-none focus:border-indigo-500"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWebsite()}
              />
              <div className="flex gap-4">
                <button
                  onClick={handleAddWebsite}
                  className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600"
                >
                  Start Monitoring
                </button>
                <button
                  onClick={() => {
                    setShowAddWebsite(false);
                    setNewWebsiteUrl('');
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Websites List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Your Monitored Websites</h2>
            <p className="text-gray-600 text-sm mt-1">Checking every 5 minutes</p>
          </div>
          <div className="p-6">
            {websites.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 mb-4">No websites added yet</p>
                <p className="text-gray-400 text-sm">
                  Add a website above to start monitoring
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {websites.map((website) => (
                  <div key={website.id} className="border rounded-lg p-5 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {website.url}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
  <div>
    <span className="text-gray-600">Status: </span>
    <span className={website.status === 'online' ? 'text-green-600' : 'text-red-600'}>
      <span className="pulse-indicator" style={{display: 'inline-block'}}>●</span> {website.status || 'Checking...'}
    </span>
  </div>
  <div>
    <span className="text-gray-600">SSL: </span>
    <span className={website.sslStatus === 'secure' ? 'text-green-600' : 'text-yellow-600'}>
      <span className="pulse-indicator" style={{display: 'inline-block'}}>🔒</span> {website.sslStatus || 'Checking...'}
    </span>
  </div>
  <div>
    <span className="text-gray-600">Speed: </span>
    <span>
      <span className="rotate-indicator" style={{display: 'inline-block'}}>⚡</span> {website.responseTime ? `${website.responseTime}ms` : 'Checking...'}
    </span>
  </div>
</div>
                          </div>
                      <button
                        onClick={() => handleRemoveWebsite(website.id)}
                        className="text-red-500 hover:text-red-700 ml-4 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 System Analysis</h4>
            <p className="text-blue-700 text-sm">
              <p className="text-gray-500">Our monitoring system will work diligently on protecting your added websites.</p>
            
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;