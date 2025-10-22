// App.js - Complete SafeSiteWatch Frontend
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = 'http://localhost:5000/api';

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
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
            >
              {authMode === 'login' ? 'Login' : 'Start Free Trial'}
            </button>
          </form>
          
          {authMode === 'register' && (
            <p className="text-center text-sm text-gray-600 mt-4">
              7-day free trial • No credit card required
            </p>
          )}
        </div>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Security Score</p>
                <p className={`text-4xl font-bold mt-2 ${
                  stats.securityScore >= 80 ? 'text-green-500' :
                  stats.securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {stats.securityScore}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.securityScore >= 80 ? 'Excellent' :
                   stats.securityScore >= 60 ? 'Good' : 'Needs Attention'}
                </p>
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
                <p className={`text-4xl font-bold mt-2 ${
                  stats.activeAlerts > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {stats.activeAlerts}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.activeAlerts > 0 ? 'Action needed' : 'All clear'}
                </p>
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
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
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
                  className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
                >
                  Start Monitoring
                </button>
                <button
                  onClick={() => {
                    setShowAddWebsite(false);
                    setNewWebsiteUrl('');
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
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
            <p className="text-gray-600 text-sm mt-1">We check each site every 30 minutes</p>
          </div>
          <div className="p-6">
            {websites.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 mb-4">No websites added yet</p>
                <p className="text-gray-400 text-sm">
                  Click "Add Website to Monitor" to start protecting your sites
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {websites.map((website) => (
                  <div key={website.id} className="border rounded-lg p-5 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {website.name || website.url}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            website.current_status === 'up' 
                              ? 'bg-green-100 text-green-800'
                              : website.current_status === 'down'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {website.current_status === 'up' ? '● ONLINE' : 
                             website.current_status === 'down' ? '● OFFLINE' : '● CHECKING'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <a href={website.url} target="_blank" rel="noopener noreferrer" 
                             className="hover:text-indigo-500 underline">
                            {website.url}
                          </a>
                        </div>
                        <div className="flex gap-6 mt-3 text-sm">
                          <span className="text-gray-600">
                            <strong>Response:</strong> {website.last_response_time || 'Checking...'}
                            {website.last_response_time && 'ms'}
                          </span>
                          <span className="text-gray-600">
                            <strong>SSL:</strong> {
                              website.ssl_days_remaining 
                                ? `Valid (${website.ssl_days_remaining} days remaining)`
                                : 'Checking...'
                            }
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveWebsite(website.id)}
                        className="text-red-500 hover:text-red-700 ml-4 p-2"
                        title="Remove from monitoring"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
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
            <div className="flex items-start">
              <span className="text-3xl mr-4">💡</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
                <p className="text-blue-700 text-sm">
                  We check your websites every 30 minutes for uptime, SSL certificate status, 
                  and security issues. If anything goes wrong, you'll get an instant email alert 
                  so you can fix issues before customers notice.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <span className="text-3xl mr-4">🎯</span>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Free Trial Active</h4>
                <p className="text-green-700 text-sm">
                  You're on the 7-day free trial with full access to all features. 
                  No credit card required. Monitor up to 10 websites and get unlimited alerts.
                  Upgrade anytime for just $29/month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;