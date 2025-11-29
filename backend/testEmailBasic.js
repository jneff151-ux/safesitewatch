require('dotenv').config();
const { testEmailConnection, sendWelcomeEmail } = require('./services/emailService');

const test = async () => {
  console.log('Testing email connection...');
  const connected = await testEmailConnection();
  
  if (connected) {
    console.log('✅ Connection successful!');
    console.log('Sending test welcome email...');
    await sendWelcomeEmail('jneff151@gmail.com', 'Test Company');
    console.log('Check your email!');
  } else {
    console.log('❌ Connection failed!');
  }
};

test();