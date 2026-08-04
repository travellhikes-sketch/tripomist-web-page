BEGIN;

CREATE OR REPLACE FUNCTION public.consume_guest_lead_rate_limit(
    p_ip_hash TEXT,
    p_phone_hash TEXT,
    p_email_hash TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_limit_item RECORD;
    v_request_count INTEGER;
BEGIN
    IF p_ip_hash IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid IP hash.';
    END IF;

    IF p_phone_hash IS NULL OR p_phone_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid phone hash.';
    END IF;

    IF p_email_hash IS NULL OR p_email_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid email hash.';
    END IF;

    FOR v_limit_item IN
        SELECT *
        FROM (
            VALUES
                ('ip'::TEXT, p_ip_hash, INTERVAL '10 minutes', 10),
                ('phone'::TEXT, p_phone_hash, INTERVAL '10 minutes', 3),
                ('email'::TEXT, p_email_hash, INTERVAL '10 minutes', 3)
        ) AS limits(scope, identifier_hash, window_size, request_limit)
    LOOP
        INSERT INTO public.guest_lead_rate_limit AS rate_limit (
            scope,
            identifier_hash,
            window_started_at,
            request_count
        ) VALUES (
            v_limit_item.scope,
            v_limit_item.identifier_hash,
            v_now,
            1
        )
        ON CONFLICT (scope, identifier_hash) DO UPDATE
        SET
            window_started_at = CASE
                WHEN rate_limit.window_started_at
                     <= v_now - v_limit_item.window_size
                    THEN v_now
                ELSE rate_limit.window_started_at
            END,
            request_count = CASE
                WHEN rate_limit.window_started_at
                     <= v_now - v_limit_item.window_size
                    THEN 1
                ELSE rate_limit.request_count + 1
            END
        RETURNING request_count INTO v_request_count;

        IF v_request_count > v_limit_item.request_limit THEN
            RAISE EXCEPTION 'Guest lead rate limit exceeded for %.',
                v_limit_item.scope;
        END IF;
    END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(
    TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_guest_lead_rate_limit(
    TEXT, TEXT, TEXT
) TO service_role;

TRUNCATE ONLY public.guest_lead_rate_limit;

NOTIFY pgrst, 'reload schema';

COMMIT;
