// monitoringService.js - Enhanced Monitoring Service
const https = require('https');
const http = require('http');
const axios = require('axios');
const dns = require('dns').promises;
const { URL } = require('url');

// Real SSL Certificate Checker
async function checkSSLCertificate(urlString) {
  try {
    const url = new URL(urlString);
    
    // Only check SSL for HTTPS sites
    if (url.protocol !== 'https:') {
      return {
        hasSSL: false,
        valid: false,
        message: 'Site does not use HTTPS'
      };
    }

    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        method: 'HEAD',
        timeout: 10000,
        rejectUnauthorized: false // Check even invalid certs
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (!cert || !cert.valid_to) {
          resolve({
            hasSSL: false,
            valid: false,
            message: 'Could not retrieve certificate'
          });
          return;
        }

        const now = new Date();
        const expiry = new Date(cert.valid_to);
        const daysRemaining = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
        
        // Parse certificate details
        const issuer = cert.issuer ? 
          `${cert.issuer.O || 'Unknown'} (${cert.issuer.C || 'Unknown'})` : 
          'Unknown';
        
        // Check if certificate is valid for this domain
        const isValidForDomain = cert.subject && 
          (cert.subject.CN === url.hostname || 
           (cert.subjectaltname && cert.subjectaltname.includes(url.hostname)));

        resolve({
          hasSSL: true,
          valid: daysRemaining > 0 && isValidForDomain,
          daysRemaining,
          expiryDate: expiry.toISOString(),
          issuer,
          subject: cert.subject ? cert.subject.CN : 'Unknown',
          validForDomain: isValidForDomain,
          protocol: cert.serialNumber ? 'TLS 1.2+' : 'TLS',
          warning: daysRemaining <= 30 ? `Certificate expires in ${daysRemaining} days!` : null
        });
      });

      req.on('error', (error) => {
        resolve({
          hasSSL: false,
          valid: false,
          message: `SSL check failed: ${error.message}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          hasSSL: false,
          valid: false,
          message: 'SSL check timeout'
        });
      });

      req.end();
    });
  } catch (error) {
    return {
      hasSSL: false,
      valid: false,
      message: `Error checking SSL: ${error.message}`
    };
  }
}

// Enhanced Uptime & Performance Check
async function checkWebsiteStatus(urlString) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(urlString, {
      timeout: 30000,
      validateStatus: () => true, // Accept any status
      maxRedirects: 5,
      headers: {
        'User-Agent': 'SafeSiteWatch Monitor/1.0'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Check for various issues
    const issues = [];
    
    if (response.status >= 500) {
      issues.push(`Server error (${response.status})`);
    } else if (response.status >= 400) {
      issues.push(`Client error (${response.status})`);
    } else if (response.status >= 300 && response.status < 400) {
      issues.push('Multiple redirects detected');
    }

    if (responseTime > 5000) {
      issues.push('Slow response time (>5 seconds)');
    }

    // Get page size
    const contentLength = response.headers['content-length'] || 
      (response.data ? response.data.length : 0);
    const pageSizeKB = Math.round(contentLength / 1024);

    return {
      isUp: response.status < 400,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      issues,
      performance: {
        responseTime,
        pageSizeKB,
        rating: responseTime < 1000 ? 'Excellent' : 
                responseTime < 3000 ? 'Good' : 
                responseTime < 5000 ? 'Fair' : 'Poor'
      },
      headers: {
        server: response.headers['server'] || 'Unknown',
        poweredBy: response.headers['x-powered-by'] || null,
        contentType: response.headers['content-type'] || 'Unknown'
      }
    };
  } catch (error) {
    return {
      isUp: false,
      statusCode: 0,
      statusText: error.message,
      responseTime: Date.now() - startTime,
      issues: [`Site unreachable: ${error.message}`],
      performance: {
        responseTime: Date.now() - startTime,
        rating: 'Offline'
      }
    };
  }
}

// Security Headers Checker
async function checkSecurityHeaders(urlString) {
  try {
    const response = await axios.get(urlString, {
      timeout: 10000,
      validateStatus: () => true
    });

    const headers = response.headers;
    const securityScore = { total: 0, max: 0, grade: 'F' };
    const findings = [];

    // Check for important security headers
    const securityChecks = [
      {
        header: 'strict-transport-security',
        name: 'HSTS',
        importance: 'Critical',
        description: 'Forces HTTPS connections',
        points: 20
      },
      {
        header: 'x-frame-options',
        name: 'X-Frame-Options',
        importance: 'High',
        description: 'Prevents clickjacking attacks',
        points: 15
      },
      {
        header: 'x-content-type-options',
        name: 'X-Content-Type-Options',
        importance: 'High',
        description: 'Prevents MIME sniffing',
        points: 15
      },
      {
        header: 'x-xss-protection',
        name: 'X-XSS-Protection',
        importance: 'Medium',
        description: 'Basic XSS protection',
        points: 10
      },
      {
        header: 'content-security-policy',
        name: 'CSP',
        importance: 'Critical',
        description: 'Controls resource loading',
        points: 25
      },
      {
        header: 'referrer-policy',
        name: 'Referrer-Policy',
        importance: 'Medium',
        description: 'Controls referrer information',
        points: 10
      },
      {
        header: 'permissions-policy',
        name: 'Permissions-Policy',
        importance: 'Low',
        description: 'Controls browser features',
        points: 5
      }
    ];

    securityChecks.forEach(check => {
      securityScore.max += check.points;
      
      if (headers[check.header]) {
        securityScore.total += check.points;
        findings.push({
          name: check.name,
          status: 'Present',
          value: headers[check.header].substring(0, 100),
          importance: check.importance,
          description: check.description,
          passed: true
        });
      } else {
        findings.push({
          name: check.name,
          status: 'Missing',
          importance: check.importance,
          description: check.description,
          recommendation: `Add ${check.name} header for better security`,
          passed: false
        });
      }
    });

    // Calculate grade
    const percentage = (securityScore.total / securityScore.max) * 100;
    if (percentage >= 90) securityScore.grade = 'A';
    else if (percentage >= 80) securityScore.grade = 'B';
    else if (percentage >= 70) securityScore.grade = 'C';
    else if (percentage >= 60) securityScore.grade = 'D';
    else securityScore.grade = 'F';

    return {
      score: Math.round(percentage),
      grade: securityScore.grade,
      findings,
      summary: {
        total: findings.filter(f => f.passed).length,
        missing: findings.filter(f => !f.passed).length,
        critical: findings.filter(f => !f.passed && f.importance === 'Critical').length
      }
    };
  } catch (error) {
    return {
      score: 0,
      grade: 'Unknown',
      error: `Could not check security headers: ${error.message}`
    };
  }
}

// Domain Expiration Checker (using whois)
async function checkDomainExpiration(urlString) {
  try {
    const url = new URL(urlString);
    const domain = url.hostname.replace('www.', '');
    
    // For now, return mock data (real whois requires additional setup)
    // In production, you'd use a whois API service
    return {
      domain,
      status: 'Active',
      expiresIn: '365 days',
      registrar: 'Unknown',
      needsRenewal: false
    };
  } catch (error) {
    return {
      error: `Could not check domain: ${error.message}`
    };
  }
}

// DNS Health Check
async function checkDNSHealth(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;
    
    // Perform DNS lookups
    const [addresses, txtRecords] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolveTxt(hostname)
    ]);
    
    return {
      healthy: addresses.status === 'fulfilled',
      ipAddresses: addresses.status === 'fulfilled' ? addresses.value : [],
      hasTxtRecords: txtRecords.status === 'fulfilled',
      dnsProvider: 'Active',
      loadBalanced: addresses.status === 'fulfilled' && addresses.value.length > 1
    };
  } catch (error) {
    return {
      healthy: false,
      error: `DNS issues: ${error.message}`
    };
  }
}

// Complete Website Analysis
async function performCompleteScan(urlString) {
  console.log(`🔍 Starting complete scan for ${urlString}`);
  
  const [
    sslResult,
    statusResult,
    securityResult,
    dnsResult,
    domainResult
  ] = await Promise.allSettled([
    checkSSLCertificate(urlString),
    checkWebsiteStatus(urlString),
    checkSecurityHeaders(urlString),
    checkDNSHealth(urlString),
    checkDomainExpiration(urlString)
  ]);

  const results = {
    url: urlString,
    timestamp: new Date().toISOString(),
    ssl: sslResult.status === 'fulfilled' ? sslResult.value : { error: 'SSL check failed' },
    status: statusResult.status === 'fulfilled' ? statusResult.value : { error: 'Status check failed' },
    security: securityResult.status === 'fulfilled' ? securityResult.value : { error: 'Security check failed' },
    dns: dnsResult.status === 'fulfilled' ? dnsResult.value : { error: 'DNS check failed' },
    domain: domainResult.status === 'fulfilled' ? domainResult.value : { error: 'Domain check failed' },
    
    // Overall health score
    healthScore: calculateHealthScore(
      sslResult.value,
      statusResult.value,
      securityResult.value
    )
  };

  console.log(`✅ Scan complete for ${urlString}`);
  return results;
}

// Calculate overall health score
function calculateHealthScore(ssl, status, security) {
  let score = 100;
  
  // SSL (30 points)
  if (!ssl || !ssl.valid) score -= 30;
  else if (ssl.daysRemaining < 30) score -= 10;
  
  // Uptime (30 points)
  if (!status || !status.isUp) score -= 30;
  else if (status.responseTime > 3000) score -= 10;
  
  // Security Headers (20 points)
  if (!security) score -= 20;
  else score -= Math.round(20 * (1 - (security.score || 0) / 100));
  
  // Performance (20 points)
  if (status && status.responseTime > 5000) score -= 20;
  else if (status && status.responseTime > 3000) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  checkSSLCertificate,
  checkWebsiteStatus,
  checkSecurityHeaders,
  checkDNSHealth,
  checkDomainExpiration,
  performCompleteScan,
  calculateHealthScore
};