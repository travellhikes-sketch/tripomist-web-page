import fs from 'fs';

// Fix PackageCheckout.jsx
let content = fs.readFileSync('src/pages/PackageCheckout.jsx', 'utf-8');

const validation_old = `      const capacities = { 'Quad Sharing': 4, 'Triple Sharing': 3, 'Double Sharing': 2 };
      for (const [type, allocated] of Object.entries(sharingAllocation)) {
        if (allocated > 0 && allocated % capacities[type] !== 0) {
          throw new Error(\`Allocation for \${type} must be a multiple of \${capacities[type]}.\`);
        }
      }`;

content = content.replace(validation_old, "");
fs.writeFileSync('src/pages/PackageCheckout.jsx', content);

// Fix razorpay-checkout/index.ts
let edgeContent = fs.readFileSync('../supabase/functions/razorpay-checkout/index.ts', 'utf-8');

const edge_validation_old = `              if (count % capacities[type] !== 0) {
                return new Response(JSON.stringify({ error: \`Allocation for \${type} must be a multiple of \${capacities[type]}\` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
              }`;

edgeContent = edgeContent.replace(edge_validation_old, "");

const update_old = `              const { error: updateErr } = await adminClient.from('bookings').update({
                total_amount: mixedTotal,
                final_amount: mixedTotal,
                amount_before_voucher: mixedTotal,
                final_payable_amount: mixedTotal
              }).eq('id', bookingId);`;

const update_new = `              const { error: updateErr } = await adminClient.from('bookings').update({
                total_amount: mixedTotal,
                final_amount: mixedTotal,
                amount_before_voucher: mixedTotal,
                final_payable_amount: mixedTotal,
                sharing_allocation: sharingAllocation
              }).eq('id', bookingId);`;

edgeContent = edgeContent.replace(update_old, update_new);

fs.writeFileSync('../supabase/functions/razorpay-checkout/index.ts', edgeContent);
