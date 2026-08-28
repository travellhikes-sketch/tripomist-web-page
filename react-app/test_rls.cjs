const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDB() {
  const { data, error } = await supabase
    .from('package_placements')
    .insert([{
      package_id: 1, 
      placement_type: 'recommendation_search', // I need to use an allowed type
      placement_id: '00000000-0000-0000-0000-000000000001' // test if it accepts an arbitrary UUID
    }])
    .select();
    
  console.log('Placement Insert Error:', error);
}

checkDB();
