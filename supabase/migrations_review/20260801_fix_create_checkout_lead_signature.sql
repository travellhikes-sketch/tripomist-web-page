BEGIN;

ALTER TABLE public.checkout_leads
    ADD COLUMN IF NOT EXISTS lead_token_hash TEXT;

ALTER TABLE public.checkout_leads
    ALTER COLUMN lead_token DROP DEFAULT;

ALTER TABLE public.checkout_leads
    ALTER COLUMN lead_token DROP NOT NULL;

UPDATE public.checkout_leads
SET lead_token_hash = encode(digest(lead_token, 'sha256'), 'hex')
WHERE lead_token_hash IS NULL
  AND lead_token IS NOT NULL;

UPDATE public.checkout_leads
SET lead_token = NULL
WHERE lead_token IS NOT NULL;

DROP FUNCTION IF EXISTS public.create_checkout_lead(TEXT);

DROP FUNCTION IF EXISTS public.create_checkout_lead(
    TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT,
    DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT
);

DROP FUNCTION IF EXISTS public.create_checkout_lead(
    TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT,
    DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT
);

CREATE FUNCTION public.create_checkout_lead(
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
BEGIN
    IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
        RAISE EXCEPTION 'Valid customer name is required.';
    END IF;

    IF p_phone IS NULL OR p_phone !~ '^[0-9]{8,15}$' THEN
        RAISE EXCEPTION 'Valid phone number is required.';
    END IF;

    IF p_lead_token_hash IS NULL
       OR p_lead_token_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'Invalid lead token hash.';
    END IF;

    RETURN QUERY
    INSERT INTO public.checkout_leads (
        customer_name,
        phone,
        email,
        package_id,
        package_title,
        destination,
        travel_date,
        travellers,
        selected_sharing,
        estimated_amount,
        source,
        special_request,
        lead_token_hash
    ) VALUES (
        trim(p_customer_name),
        p_phone,
        lower(trim(p_email)),
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
    )
    RETURNING
        checkout_leads.id,
        checkout_leads.lead_number;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_checkout_lead(
    TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT,
    DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_checkout_lead(
    TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT,
    DATE, INTEGER, TEXT, NUMERIC, TEXT, TEXT, TEXT
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
