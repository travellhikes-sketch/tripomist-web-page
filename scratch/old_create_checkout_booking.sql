CREATE OR REPLACE FUNCTION public.create_checkout_booking(
    p_user_id UUID,
    p_package_id INTEGER,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_checkout_idempotency_key UUID,
    p_special_request TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_guest_name TEXT DEFAULT NULL,
    p_guest_phone TEXT DEFAULT NULL,
    p_guest_email TEXT DEFAULT NULL,
    p_checkout_lead_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer_name TEXT;
