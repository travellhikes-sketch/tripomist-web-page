-- Create a secure RPC to automatically link manual bookings to the authenticated user

CREATE OR REPLACE FUNCTION public.link_my_bookings()
RETURNS pg_catalog.int4
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id pg_catalog.uuid;
    v_auth_email pg_catalog.text;
    v_email_confirmed pg_catalog.bool;
    v_raw_profile_phone pg_catalog.text;
    v_norm_profile_phone pg_catalog.text;
    v_linked_count pg_catalog.int4 := 0;
BEGIN
    -- 1. Get current authenticated user securely
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- 2. Fetch email and confirmation status securely from auth.users
    SELECT 
        pg_catalog.lower(pg_catalog.btrim(email)),
        (email_confirmed_at IS NOT NULL)
    INTO 
        v_auth_email, 
        v_email_confirmed
    FROM auth.users
    WHERE id = v_user_id;

    -- 3. Safety Check: Verify email is confirmed, not null, not blank
    IF v_auth_email IS NULL OR v_auth_email = '' OR v_email_confirmed IS NULL OR v_email_confirmed = false THEN
        RETURN 0;
    END IF;

    -- 4. Fetch phone from public.profiles and safely normalize to 10 digits
    SELECT phone INTO v_raw_profile_phone
    FROM public.profiles
    WHERE id = v_user_id;

    v_raw_profile_phone := pg_catalog.regexp_replace(v_raw_profile_phone, '\D', '', 'g');

    IF pg_catalog.length(v_raw_profile_phone) = 10 THEN
        v_norm_profile_phone := v_raw_profile_phone;
    ELSIF pg_catalog.length(v_raw_profile_phone) = 11 AND pg_catalog.substr(v_raw_profile_phone, 1, 1) = '0' THEN
        v_norm_profile_phone := pg_catalog.substr(v_raw_profile_phone, 2);
    ELSIF pg_catalog.length(v_raw_profile_phone) = 12 AND pg_catalog.substr(v_raw_profile_phone, 1, 2) = '91' THEN
        v_norm_profile_phone := pg_catalog.substr(v_raw_profile_phone, 3);
    ELSE
        RETURN 0; -- Invalid profile phone
    END IF;

    IF v_norm_profile_phone IS NULL THEN 
        RETURN 0; 
    END IF;

    -- 5. Update unlinked bookings that match BOTH email and phone strictly
    WITH normalized_bookings AS (
        SELECT id,
               pg_catalog.lower(pg_catalog.btrim(customer_email)) AS norm_email,
               pg_catalog.regexp_replace(
                   COALESCE(NULLIF(pg_catalog.btrim(phone), ''), pg_catalog.btrim(customer_phone), ''), 
                   '\D', '', 'g'
               ) AS raw_digits
        FROM public.bookings
        WHERE user_id IS NULL AND checkout_lead_id IS NULL
    ),
    valid_bookings AS (
        SELECT id
        FROM normalized_bookings
        WHERE norm_email = v_auth_email
          AND (
              (pg_catalog.length(raw_digits) = 10 AND raw_digits = v_norm_profile_phone)
           OR (pg_catalog.length(raw_digits) = 11 AND pg_catalog.substr(raw_digits, 1, 1) = '0' AND pg_catalog.substr(raw_digits, 2) = v_norm_profile_phone)
           OR (pg_catalog.length(raw_digits) = 12 AND pg_catalog.substr(raw_digits, 1, 2) = '91' AND pg_catalog.substr(raw_digits, 3) = v_norm_profile_phone)
          )
    ),
    updated AS (
        UPDATE public.bookings
        SET user_id = v_user_id
        WHERE id IN (SELECT id FROM valid_bookings)
          AND user_id IS NULL
          AND checkout_lead_id IS NULL
        RETURNING id
    )
    SELECT pg_catalog.count(*) INTO v_linked_count FROM updated;

    RETURN v_linked_count;
END;
$$;

-- Grant execute to authenticated users only and explicitly revoke from others
REVOKE EXECUTE ON FUNCTION public.link_my_bookings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_my_bookings() FROM anon;
GRANT EXECUTE ON FUNCTION public.link_my_bookings() TO authenticated;
