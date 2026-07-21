const fs = require('fs');
const https = require('https');

const options = {
  hostname: 'smumwkvkcfnrajamtscq.supabase.co',
  path: '/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdW13a3ZrY2ZucmFqYW10c2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzI2NzksImV4cCI6MjA5OTE0ODY3OX0.3MQyTJFIVz1waf4FYjfwN8PY2A9W6ymBqI1JeKSptwk',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const bookings = parsed.definitions.bookings;
      const profiles = parsed.definitions.profiles;
      fs.writeFileSync('schema_info.json', JSON.stringify({ bookings, profiles }, null, 2));
      console.log('Successfully wrote schema_info.json');
    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
