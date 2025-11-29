const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: 'safesitewatch.net',
  port: 465,
  secure: true, 
  auth: {
    user: 'alerts@safesitewatch.net',
    pass: process.env.EMAIL_PASSWORD 
  },
  tls: {
    rejectUnauthorized: false
  },
  pool: true,
  maxConnections: 1,
  rateDelta: 3000,
  rateLimit: 5
});

// Send down alert
const sendDownAlert = async (website, userEmail, error) => {
  try {
    await transporter.sendMail({
      from: '"SafeSiteWatch Alerts" <alerts@safesitewatch.net>',
      to: userEmail,
      replyTo: 'support@safesitewatch.net',  
      headers: { 
        'X-Priority': '3',
        'X-Mailer': 'SafeSiteWatch Mailer',
        'List-Unsubscribe': '<mailto:support@safesitewatch.net>'
      },
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
      from: '"SafeSiteWatch Alerts" <alerts@safesitewatch.net>',  // Added quotes around name
      to: userEmail,
      replyTo: 'support@safesitewatch.net',  // Added replyTo
      headers: {  // Added headers section
        'X-Priority': '1',  // 1 for critical alerts
        'X-Mailer': 'SafeSiteWatch Mailer',
        'List-Unsubscribe': '<mailto:support@safesitewatch.net>'
      },
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

// Send welcome email
const sendWelcomeEmail = async (userEmail, companyName) => {
  try {
    await transporter.sendMail({
      from: '"SafeSiteWatch" <alerts@safesitewatch.net>',  
      to: userEmail,
      replyTo: 'support@safesitewatch.net',  
      headers: {  
        'X-Priority': '3',  
        'X-Mailer': 'SafeSiteWatch Mailer',
        'List-Unsubscribe': '<mailto:support@safesitewatch.net>'
      },
      subject: '🎉 Welcome to SafeSiteWatch - Your Protection is Active!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 32px;">Welcome to SafeSiteWatch!</h1>
            <p style="margin-top: 10px; font-size: 18px;">Your 7-Day Free Trial is Active</p>
          </div>
          
          <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello${companyName ? ` ${companyName}` : ''}! 👋</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Thank you for choosing SafeSiteWatch to protect your online presence. Your account is now active and ready to monitor your websites 24/7.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #059669; margin-top: 0;">✅ Your Service Includes:</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>🔍 Monitoring checks every 5 minutes</li>
                <li>🚨 Instant breach detection & alerts</li>
                <li>🔒 SSL certificate monitoring</li>
                <li>📊 Security header analysis</li>
                <li>⚡ Performance tracking</li>
                <li>📧 Email alerts for any issues</li>
                <li>📈 Up to 3 websites (upgrade anytime)</li>
              </ul>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #fcd34d;">
              <h3 style="color: #92400e; margin-top: 0;">🚀 Get Started:</h3>
              <ol style="color: #78350f; line-height: 1.8;">
                <li>Login to your dashboard</li>
                <li>Add your first website to monitor</li>
                <li>We'll immediately scan for security issues</li>
                <li>Receive instant alerts if problems are detected</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://app.safesitewatch.net" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #312e81; margin-top: 0;">💡 Pro Tip:</h3>
              <p style="color: #4c1d95; margin: 0;">
                Add your most critical website first. We'll perform a comprehensive security scan immediately and alert you to any existing vulnerabilities.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <div style="text-align: center; color: #6b7280;">
              <p style="margin: 10px 0;"><strong>Your 7-day free trial includes ALL features!</strong></p>
              <p style="margin: 10px 0;">No credit check required to start • Just $29/month after trial</p>
              <p style="margin: 10px 0;">Add payment method anytime to continue after trial</p>
              <br>
              <p style="margin: 10px 0;">Need help? Reply to this email or contact:</p>
              <p style="margin: 5px 0;">📧 support@safesitewatch.net</p>
              <p style="margin: 5px 0;">🌐 www.safesitewatch.net</p>
            </div>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 12px;">
              © 2024 SafeSiteWatch. Protecting websites worldwide.
            </p>
          </div>
        </div>
      `
    });
    console.log('Welcome email sent to:', userEmail);
  } catch (error) {
    console.error('Welcome email failed:', error);
  }
};

module.exports = {
  sendDownAlert,
  sendBreachAlert,
  sendWelcomeEmail,  
  testEmailConnection
};
  