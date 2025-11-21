const { testEmailConnection, sendDownAlert } = require('./services/emailService');

const test = async () => {
  console.log('Testing email connection...');
  const connected = await testEmailConnection();
  
  if (connected) {
    console.log('Connection successful! Sending test email...');
    await sendDownAlert(
      { url: 'https://testsite.com' },
      'alerts@safesitewatch.net ',  
      'This is a test alert'
    );
    console.log('Check your email!');
  } else {
    console.log('Connection failed - check settings');
  }
};

test();