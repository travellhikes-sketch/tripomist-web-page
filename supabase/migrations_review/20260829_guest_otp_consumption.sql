-- Migration: Add consumed_at to guest_otp_verifications and create atomic wrapper RPC
-- DO NOT EXECUTE AUTOMATICALLY — FOR REVIEW ONLY

ALTER TABLE public.guest_otp_verifications ADD COLUMN IF NOT EXISTS consumed_at timestamptz DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.create_verified_checkout_lead(
    p_verification_id UUID,
    p_customer_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_package_id BIGINT,
    p_package_title TEXT,
    p_destination TEXT,
    p_travel_date DATE,
    p_travellers INTEGER,
    p_selected_sharing TEXT,
    p_estimated_amount NUMERIC,
    p_source TEXT,
    p_special_request TEXT,
    p_lead_token_hash TEXT
)
RETURNS TABLE (
    id UUID,
    lead_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_otp_record RECORD;
    v_created_lead RECORD;
BEGIN
    -- 1. Lock the OTP verification row to prevent concurrent replays
    SELECT * INTO v_otp_record
    FROM public.guest_otp_verifications
    WHERE id = p_verification_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Verification record not found.';
    END IF;

    -- 2. Validate securely with NULL-safe checks
    IF v_otp_record.purpose IS DISTINCT FROM 'booking' THEN
        RAISE EXCEPTION 'Invalid verification purpose.';
    END IF;

    IF v_otp_record.verified_at IS NULL THEN
        RAISE EXCEPTION 'Email is not verified.';
    END IF;

    IF v_otp_record.consumed_at IS NOT NULL THEN
        RAISE EXCEPTION 'Verification has already been used.';
    END IF;

    IF v_otp_record.expires_at IS NULL OR v_otp_record.expires_at <= now() THEN
        RAISE EXCEPTION 'Verification has expired.';
    END IF;

    IF lower(trim(v_otp_record.email)) IS DISTINCT FROM lower(trim(p_email)) THEN
        RAISE EXCEPTION 'Verified email does not match requested email.';
    END IF;

    -- 3. Delegate to the existing lead creation logic and capture result
    SELECT * INTO v_created_lead FROM public.create_checkout_lead(
        p_customer_name,
        p_phone,
        p_email,
        p_package_id,
        p_package_title,
        p_destination,
        p_travel_date,
        p_travellers,
        p_selected_sharing,
        p_estimated_amount,
        p_source,
        p_special_request,
        p_lead_token_hash
    );

    IF NOT FOUND OR v_created_lead.id IS NULL THEN
        RAISE EXCEPTION 'Checkout lead creation failed.';
    END IF;

    -- 4. Consume the verification record ONLY after successful lead creation
    UPDATE public.guest_otp_verifications
    SET consumed_at = now()
    WHERE id = p_verification_id;

    -- 5. Return the successfully created lead
    RETURN QUERY SELECT v_created_lead.id, v_created_lead.lead_number;
END;
$$;

-- Secure wrapper RPC permissions
REVOKE EXECUTE ON FUNCTION public.create_verified_checkout_lead(UUID, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_verified_checkout_lead(UUID, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO service_role;
