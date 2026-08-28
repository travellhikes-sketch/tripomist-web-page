const https = require('https');

const postData = JSON.stringify({
  action: 'create_test_admin'
});

const options = {
  hostname: 'smumwkvkcfnrajamtscq.supabase.co',
  port: 443,
  path: '/functions/v1/razorpay-checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdW13a3ZrY2ZucmFqYW10c2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzI2NzksImV4cCI6MjA5OTE0ODY3OX0.3MQyTJFIVz1waf4FYjfwN8PY2A9W6ymBqI1JeKSptwk',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(postData);
req.end();
