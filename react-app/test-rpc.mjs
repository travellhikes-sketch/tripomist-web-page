import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key'; 

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

// We need the service role key to call the RPC if it's protected, or we can just try anon key.
// But wait, the RPC is protected by service_role only in the migration!
// "GRANT EXECUTE ON FUNCTION public.create_checkout_booking(...) TO service_role;"
// So anon key cannot call it directly!

const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log("No service role key found. Trying with anon key anyway.");
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, serviceRoleKey || envVars.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('create_checkout_booking', {
        p_user_id: null,
        p_package_id: 29,
        p_travel_date: '2026-08-30',
        p_travellers: 2,
        p_selected_sharing: 'Twin Sharing', // The frontend says Double Sharing, Quad Sharing, Triple Sharing.
        p_checkout_idempotency_key: 'b149b1a5-8621-4f38-aeb1-0c5a2c49e7b2', // valid uuid
        p_special_request: null,
        p_source: 'web',
        p_guest_name: 'Test User',
        p_guest_phone: '9876543210',
        p_guest_email: 'test@example.com',
        p_checkout_lead_id: null
  });

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
