const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('business_contribution_rates')
    .select('*, created_by_user:profiles!created_by(full_name)')
    .order('effective_from', { ascending: false });
  console.log('RATES ERROR:', error);
  console.log('RATES DATA:', data);

  const { data: bData, error: bError } = await supabase
    .from('booking_contributions')
    .select(`
      *,
      booking:bookings(id, booking_id, customer_name, b2b_partner_company, destination)
    `)
    .order('accrued_at', { ascending: false });
  console.log('CONTRIBS ERROR:', bError);
}
run();
