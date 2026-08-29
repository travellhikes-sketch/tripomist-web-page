import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'; // or whatever the local URL is
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key'; 

// Wait, I need to read the actual env variables.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) envVars[key.trim()] = values.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.functions.invoke('razorpay-checkout', {
    body: {
      action: 'initialize',
      packageId: 29,
      travelDate: '2026-08-30',
      travellers: 2,
      selectedSharing: 'Twin Sharing', // Note: twin sharing is invalid, but I want to see the error. I'll use Quad Sharing to bypass that.
      idempotencyKey: 'test-key-12345',
      guestName: 'Test User',
      guestPhone: '9876543210',
      guestEmail: 'test@example.com'
    }
  });

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
