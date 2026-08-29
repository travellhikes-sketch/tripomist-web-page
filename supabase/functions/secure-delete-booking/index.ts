import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { booking_id, current_password } = await req.json();

    if (!booking_id || !current_password) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('Authorization');
    
    // TEMPORARY SAFE DEBUGGING
    console.log("Authorization header present:", !!authHeader);
    
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: "Missing admin authentication." }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log("Token length:", token.length);

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    
    console.log("Authenticated user id exists:", !!user?.id);
    if (userError) {
      console.log("UserError:", userError.message);
    }

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Your admin session has expired. Please sign in again." }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: adminCheck, error: adminError } = await supabaseClient.rpc('is_admin');
    if (adminError || !adminCheck) {
      return new Response(JSON.stringify({ error: "Admin access required." }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isPasswordValid, error: verifyError } = await supabaseClient.rpc('verify_booking_delete_password', {
      p_password: current_password
    });

    if (verifyError) {
      if (verifyError.message.includes('not been configured')) {
        return new Response(
          JSON.stringify({ error: "Booking Delete Password has not been configured yet." }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Incorrect delete password." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: "Incorrect delete password." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: rpcError } = await supabaseClient.rpc('secure_delete_booking_tx', {
      p_booking_id: booking_id,
      p_admin_id: user.id
    });

    if (rpcError) {
      throw rpcError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking deleted securely." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
