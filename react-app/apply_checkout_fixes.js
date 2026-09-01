import fs from 'fs';

// 1. Create SQL Migration for sync_booking_travellers
const sqlMigration = `BEGIN;

CREATE OR REPLACE FUNCTION public.sync_booking_travellers(
    p_booking_id UUID,
    p_travellers JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM id FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

    DELETE FROM public.booking_travellers
    WHERE booking_id = p_booking_id AND is_primary = false;

    IF jsonb_array_length(p_travellers) > 0 THEN
        INSERT INTO public.booking_travellers (booking_id, full_name, phone, email, is_primary)
        SELECT 
            p_booking_id,
            t->>'fullName',
            t->>'phone',
            t->>'email',
            false
        FROM jsonb_array_elements(p_travellers) as t;
    END IF;
END;
$$;

COMMIT;
`;
fs.writeFileSync('../supabase/migrations_review/20260830_sync_booking_travellers.sql', sqlMigration);

// 2. Fix Edge Function razorpay-checkout/index.ts
let edgeContent = fs.readFileSync('../supabase/functions/razorpay-checkout/index.ts', 'utf-8');

// Replace validation and insertion block
const validationStartString = `        // 1. Validation for capacities and totals`;
const replacementValidation = `        // Strict Validation
        if (travellers < 1 || travellers > 15) {
          return new Response(JSON.stringify({ error: 'Travellers must be between 1 and 15.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
        }
        
        let totalAllocated = 0;
        const allowedKeys = ['Quad Sharing', 'Triple Sharing', 'Double Sharing'];
        
        if (sharingAllocation) {
          for (const type of Object.keys(sharingAllocation)) {
            if (!allowedKeys.includes(type)) {
              return new Response(JSON.stringify({ error: \`Unknown sharing type: \${type}\` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
            }
            const count = sharingAllocation[type];
            if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
              return new Response(JSON.stringify({ error: \`Allocation for \${type} must be a positive integer.\` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
            }
            totalAllocated += count;
          }
          if (totalAllocated !== travellers) {
            return new Response(JSON.stringify({ error: 'Sharing allocation must exactly match the total number of travellers.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
          }
        }

        if (additionalTravellers) {
          if (additionalTravellers.length !== travellers - 1) {
            return new Response(JSON.stringify({ error: 'Invalid number of additional travellers provided.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
          }
        }

        // 2. Insert additional travellers atomically (idempotent)
        if (additionalTravellers && additionalTravellers.length > 0) {
          const { error: syncErr } = await adminClient.rpc('sync_booking_travellers', {
            p_booking_id: bookingId,
            p_travellers: additionalTravellers
          });
          if (syncErr) {
            console.error('Failed to sync additional travellers', syncErr);
            return new Response(JSON.stringify({ error: 'Failed to save additional traveller details' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
          }
        }`;

// Replace from `// 1. Validation for capacities and totals` up to `// 3. Mixed sharing price calculation`
const edgeParts = edgeContent.split(validationStartString);
if (edgeParts.length === 2) {
    const afterValidationParts = edgeParts[1].split(`// 3. Mixed sharing price calculation`);
    edgeContent = edgeParts[0] + replacementValidation + '\n\n        // 3. Mixed sharing price calculation' + afterValidationParts[1];
}

// Replace the update block to successfully include sharing_allocation
const updateOld = `              const { error: updateErr } = await adminClient.from('bookings').update({
                total_amount: mixedTotal,
                final_amount: mixedTotal,
                amount_before_voucher: mixedTotal,
                final_payable_amount: mixedTotal
              }).eq('id', bookingId);`;

const updateNew = `              const { error: updateErr } = await adminClient.from('bookings').update({
                total_amount: mixedTotal,
                final_amount: mixedTotal,
                amount_before_voucher: mixedTotal,
                final_payable_amount: mixedTotal,
                sharing_allocation: sharingAllocation
              }).eq('id', bookingId);`;

edgeContent = edgeContent.replace(updateOld, updateNew);

fs.writeFileSync('../supabase/functions/razorpay-checkout/index.ts', edgeContent);
console.log('Script completed.');
