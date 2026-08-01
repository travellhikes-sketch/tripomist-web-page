BEGIN;

-- CREATE OR REPLACE the existing 3-argument consume_guest_lead_rate_limit function
CREATE OR REPLACE FUNCTION public.consume_guest_lead_rate_limit(
    p_ip_hash TEXT,
    p_phone_hash TEXT,
    p_email_hash TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    IF length(p_ip_hash) <> 64 OR length(p_phone_hash) <> 64 OR length(p_email_hash) <> 64 THEN
        RAISE EXCEPTION 'Invalid hash length (must be 64 characters).';
    END IF;

    -- Insert or update the usage timestamp atomically for IP
    INSERT INTO public.guest_lead_rate_limit (rate_type, hashed_value, last_used)
    VALUES ('ip', p_ip_hash, v_now)
    ON CONFLICT (rate_type, hashed_value) DO UPDATE
        SET last_used = EXCLUDED.last_used;

    -- Insert or update the usage timestamp atomically for Phone
    INSERT INTO public.guest_lead_rate_limit (rate_type, hashed_value, last_used)
    VALUES ('phone', p_phone_hash, v_now)
    ON CONFLICT (rate_type, hashed_value) DO UPDATE
        SET last_used = EXCLUDED.last_used;

    -- Insert or update the usage timestamp atomically for Email
    INSERT INTO public.guest_lead_rate_limit (rate_type, hashed_value, last_used)
    VALUES ('email', p_email_hash, v_now)
    ON CONFLICT (rate_type, hashed_value) DO UPDATE
        SET last_used = EXCLUDED.last_used;

    -- Enforce limits:
    -- ('ip'::TEXT, p_ip_hash, INTERVAL '10 minutes', 10)
    IF (SELECT count(*) FROM public.guest_lead_rate_limit
        WHERE rate_type = 'ip' AND hashed_value = p_ip_hash AND last_used > v_now - INTERVAL '10 minutes') > 10 THEN
        RAISE EXCEPTION 'IP rate limit exceeded.';
    END IF;

    -- ('phone'::TEXT, p_phone_hash, INTERVAL '10 minutes', 3)
    IF (SELECT count(*) FROM public.guest_lead_rate_limit
        WHERE rate_type = 'phone' AND hashed_value = p_phone_hash AND last_used > v_now - INTERVAL '10 minutes') > 3 THEN
        RAISE EXCEPTION 'Phone rate limit exceeded.';
    END IF;

    -- ('email'::TEXT, p_email_hash, INTERVAL '10 minutes', 3)
    IF (SELECT count(*) FROM public.guest_lead_rate_limit
        WHERE rate_type = 'email' AND hashed_value = p_email_hash AND last_used > v_now - INTERVAL '10 minutes') > 3 THEN
        RAISE EXCEPTION 'Email rate limit exceeded.';
    END IF;
END;
$$;

-- Apply exact REVOKE/GRANT for (TEXT, TEXT, TEXT)
REVOKE EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(TEXT, TEXT, TEXT) TO service_role;

-- TRUNCATE ONLY public.guest_lead_rate_limit to clear temporary test counters
TRUNCATE ONLY public.guest_lead_rate_limit;

NOTIFY pgrst, 'reload schema';

COMMIT;
