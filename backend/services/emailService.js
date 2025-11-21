const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: 'safesitewatch.net',
  port: 465,
  secure: true, 
  auth: {
    user: 'alerts@safesitewatch.net',
    pass: 'Z1G@get4zA1' 
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Send down alert
const sendDownAlert = async (website, userEmail, error) => {
  try {
    await transporter.sendMail({
      from: 'SafeSiteWatch Alerts <alerts@safesitewatch.net>',
      to: userEmail,
      subject: '🚨 URGENT: Your website is down!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ Website Down Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <h2 style="color: #ef4444;">${website.url} is not responding!</h2>
            <p><strong>Error detected at:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Error details:</strong> ${error}</p>
            <div style="margin: 30px 0;">
              <a href="https://app.safesitewatch.net" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">SafeSiteWatch is monitoring your website 24/7</p>
          </div>
        </div>
      `
    });
    console.log('Down alert sent to:', userEmail);
  } catch (error) {
    console.error('Email send failed:', error);
  }
};

// Send breach alert
const sendBreachAlert = async (website, userEmail, breach) => {
  try {
    await transporter.sendMail({
      from: 'SafeSiteWatch Alerts <alerts@safesitewatch.net>',
      to: userEmail,
      subject: '🚨🚨 CRITICAL: Security Breach Detected!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #991b1b; color: white; padding: 20px; text-align: center;">
            <h1>🚨 SECURITY BREACH DETECTED</h1>
          </div>
          <div style="padding: 20px; background: #fef2f2;">
            <h2 style="color: #991b1b;">IMMEDIATE ACTION REQUIRED</h2>
            <p><strong>Website:</strong> ${website.url}</p>
            <p><strong>Threat Type:</strong> ${breach.type}</p>
            <p><strong>Description:</strong> ${breach.description}</p>
            <div style="background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3>🔧 Required Actions:</h3>
              <p>${breach.fix}</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="https://app.safesitewatch.net" style="background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">ACCESS DASHBOARD NOW</a>
            </div>
            <p style="color: #991b1b; font-weight: bold;">Do not ignore this alert. Your website security has been compromised.</p>
          </div>
        </div>
      `
    });
    console.log('Breach alert sent to:', userEmail);
  } catch (error) {
    console.error('Breach email failed:', error);
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection successful');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};

module.exports = {
  sendDownAlert,
  sendBreachAlert,
  testEmailConnection
};