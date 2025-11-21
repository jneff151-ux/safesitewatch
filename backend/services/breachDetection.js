const axios = require('axios');
const crypto = require('crypto');

// Detailed fix instructions for each breach type
const breachFixInstructions = {
  MALWARE_DETECTED: {
    immediate: "⚠️ TAKE SITE OFFLINE IMMEDIATELY",
    steps: [
      "1. Put site in maintenance mode NOW",
      "2. Contact your hosting provider",
      "3. Change ALL passwords (hosting, FTP, database, admin)",
      "4. Restore from a clean backup from before the infection",
      "5. Scan all files with security software",
      "6. Update all plugins, themes, and CMS",
      "7. Install a Web Application Firewall"
    ]
  },
  SPAM_INJECTION: {
    immediate: "🚨 SPAM CONTENT DETECTED",
    steps: [
      "1. Check if you've been hacked",
      "2. Remove all spam content",
      "3. Check for unauthorized admin users",
      "4. Review recent file changes",
      "5. Update and secure your CMS"
    ]
  },
  DEFACEMENT: {
    immediate: "🚨 WEBSITE DEFACED",
    steps: [
      "1. Take screenshot for evidence",
      "2. Restore from backup immediately",
      "3. Check server logs for breach time",
      "4. Change all credentials",
      "5. File a report if needed"
    ]
  }
};

const checkForBreaches = async (website) => {
  const breaches = [];
  
  try {
    // Fetch website content
    const response = await axios.get(website.url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'SafeSiteWatch-Security-Monitor/1.0' }
    });
    const htmlContent = response.data.toLowerCase();
    
    // 1. Check for malware indicators
    const malwarePatterns = [
      { pattern: /eval\s*\(\s*atob\s*\(/, name: 'Base64 encoded eval' },
      { pattern: /document\.write\s*\(\s*unescape/, name: 'Obfuscated code' },
      { pattern: /<iframe[^>]*display\s*:\s*none/, name: 'Hidden iframe' },
      { pattern: /\.src\s*=\s*['"][^'"]*\.(ru|cn|tk|ml|ga|cf)['"]/i, name: 'Suspicious domain' }
    ];
    
    for (const check of malwarePatterns) {
      if (check.pattern.test(htmlContent)) {
        breaches.push({
          type: 'MALWARE_DETECTED',
          severity: 'CRITICAL',
          description: `Malware pattern found: ${check.name}`,
          detected: new Date(),
          fix: breachFixInstructions.MALWARE_DETECTED
        });
        break; // One malware detection is enough
      }
    }
    
    // 2. Check for spam injection
    const spamKeywords = [
      'viagra', 'cialis', 'casino', 'poker', 'payday loan',
      'essay writing', 'diet pills', 'work from home'
    ];
    
    let spamCount = 0;
    spamKeywords.forEach(keyword => {
      if (htmlContent.includes(keyword)) spamCount++;
    });
    
    if (spamCount >= 2) {
      breaches.push({
        type: 'SPAM_INJECTION', 
        severity: 'HIGH',
        description: `Multiple spam keywords detected (${spamCount} found)`,
        detected: new Date(),
        fix: breachFixInstructions.SPAM_INJECTION
      });
    }
    
    // 3. Check for defacement (dramatic changes)
    if (htmlContent.includes('hacked by') || 
        htmlContent.includes('pwned by') || 
        htmlContent.includes('owned by')) {
      breaches.push({
        type: 'DEFACEMENT',
        severity: 'CRITICAL', 
        description: 'Website has been defaced by attackers',
        detected: new Date(),
        fix: breachFixInstructions.DEFACEMENT
      });
    }
    
  } catch (error) {
    console.error(`Breach check failed for ${website.url}:`, error.message);
  }
  
  return breaches;
};

module.exports = { checkForBreaches, breachFixInstructions };