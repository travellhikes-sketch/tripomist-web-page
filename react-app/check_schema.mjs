import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smumwkvkcfnrajamtscq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdW13a3ZrY2ZucmFqYW10c2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzI2NzksImV4cCI6MjA5OTE0ODY3OX0.3MQyTJFIVz1waf4FYjfwN8PY2A9W6ymBqI1JeKSptwk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('Pakage').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Schema sample:', JSON.stringify(data, null, 2));
  }
}

checkSchema();
