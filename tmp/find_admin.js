const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './react-app/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAdminAndTest() {
  console.log('Fetching profiles...');
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, role');
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  console.log('Profiles list:', profiles);
}

findAdminAndTest();
