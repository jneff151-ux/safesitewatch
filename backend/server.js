// server.js - SafeSiteWatch Backend Server
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const { performCompleteScan } = require('./monitoringService');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://app.safesitewatch.net',
    'https://safesitewatch.net',
    'https://www.safesitewatch.net'
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// In-memory database (for testing - replace with PostgreSQL later)
const users = [];
const websites = [];
const monitoringResults = [];

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// Helper function to create JWT token
const createToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ROUTES

// Health check
app.get('/api/health', (req, res) => {
  // Simple test endpoint - ADD THIS
res.json({ success: true, message: 'SafeSiteWatch API is running!' });
});
app.get('/api/test', (req, res) => {
  console.log('TEST ENDPOINT HIT!');
  res.json({ message: 'Backend is working!' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      companyName,
      createdAt: new Date()
    };

    users.push(user);

    // Create token
    const token = createToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Create token
    const token = createToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Dashboard Data
app.get('/api/dashboard', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's websites
    const userWebsites = websites.filter(w => w.userId === userId);
    
    // Calculate REAL security score from actual health scores
let securityScore = 100;
if (userWebsites.length > 0) {
  const totalHealth = userWebsites.reduce((sum, site) => {
    return sum + (site.healthScore || 0);
  }, 0);
  securityScore = Math.round(totalHealth / userWebsites.length);
}
    const activeAlerts = userWebsites.filter(w => w.hasIssues).length;

    res.json({
      success: true,
      websites: userWebsites,
      securityScore,
      activeAlerts,
      totalWebsites: userWebsites.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add Website
app.post('/api/websites', authenticateToken, async (req, res) => {
    console.log('=== ADD WEBSITE ENDPOINT HIT ===');
    try {
    const { url } = req.body;
    const userId = req.user.userId;
    console.log('Adding website:', url, 'for user:', userId);

    // Validate URL
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Invalid URL' });
    }

    // Check if website already exists for this user
    const existing = websites.find(w => w.userId === userId && w.url === url);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Website already being monitored' });
    }

    // Create website entry
    const website = {
      id: websites.length + 1,
      userId,
      url,
      status: 'checking',
      sslStatus: 'checking',
      responseTime: null,
      lastChecked: new Date(),
      hasIssues: false,
      createdAt: new Date()
    };

    websites.push(website);

    // Perform initial check (async)
    checkWebsite(website.id);

    res.json({
      success: true,
      website
    });
  } catch (error) {
    console.error('Add website error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Website
app.delete('/api/websites/:id', authenticateToken, (req, res) => {
  try {
    const websiteId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Find website index
    const index = websites.findIndex(w => w.id === websiteId && w.userId === userId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Remove website
    websites.splice(index, 1);

    res.json({ success: true, message: 'Website removed' });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check Website Function (runs async)
async function checkWebsite(websiteId) {
  const website = websites.find(w => w.id === websiteId);
  if (!website) return;

  try {
    console.log(`🔍 Performing enhanced scan for ${website.url}`);
    
    // Use our professional monitoring service
    const scanResults = await performCompleteScan(website.url);
    
    // Update website with detailed results
    website.status = scanResults.status.isUp ? 'online' : 'offline';
    website.responseTime = scanResults.status.responseTime;
    website.sslStatus = scanResults.ssl.valid ? 'secure' : 'insecure';
    website.sslDaysRemaining = scanResults.ssl.daysRemaining || null;
    website.securityScore = scanResults.security.score || 0;
    website.securityGrade = scanResults.security.grade || 'Unknown';
    website.healthScore = scanResults.healthScore;
    website.lastChecked = new Date();
    website.hasIssues = !scanResults.status.isUp || !scanResults.ssl.valid || scanResults.healthScore < 80;
    
    // Store detailed scan results
    website.lastScanResults = {
      ssl: scanResults.ssl,
      security: scanResults.security,
      performance: scanResults.status.performance,
      dns: scanResults.dns,
      issues: scanResults.status.issues
    };
    
    console.log(`✅ Enhanced scan complete for ${website.url}`);
    console.log(`   Health Score: ${scanResults.healthScore}/100`);
    console.log(`   SSL: ${website.sslStatus} (${website.sslDaysRemaining || 'N/A'} days remaining)`);
    console.log(`   Security Grade: ${website.securityGrade}`);
    console.log(`   Response Time: ${website.responseTime}ms`);

    // Store monitoring result
    monitoringResults.push({
      websiteId,
      timestamp: new Date(),
      status: website.status,
      responseTime: website.responseTime,
      sslStatus: website.sslStatus,
      healthScore: website.healthScore,
      securityGrade: website.securityGrade
    });

  } catch (error) {
    console.error(`❌ Error checking website ${website.url}:`, error.message);
    website.status = 'offline';
    website.sslStatus = 'unknown';
    website.hasIssues = true;
    website.lastChecked = new Date();
    website.healthScore = 0;
  }
}

  

// Monitoring Cron Job - Check all websites every 5 minutes
setInterval(() => {
  console.log('⏰ Running scheduled monitoring check...');
  console.log('Number of websites to check:', websites.length);
  websites.forEach(website => {
    console.log('Checking website:', website.url);
    checkWebsite(website.id);
  });
  console.log('✅ Monitoring check completed');
}, 5 * 60 * 1000); // 5 minutes

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 SafeSiteWatch Backend Server Running!
📍 Port: ${PORT}
🔗 API URL: http://localhost:${PORT}/api
✅ Health Check: http://localhost:${PORT}/api/health

Available endpoints:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/dashboard (requires auth)
- POST /api/websites (requires auth)
- DELETE /api/websites/:id (requires auth)
  `);
});