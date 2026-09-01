BEGIN;

CREATE OR REPLACE FUNCTION public.update_checkout_lead(
    p_lead_id UUID,
    p_lead_token TEXT,
    p_current_step TEXT,
    p_selected_sharing TEXT,
    p_estimated_amount NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hash TEXT := encode(extensions.digest(p_lead_token, 'sha256'), 'hex');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.checkout_leads WHERE id = p_lead_id AND lead_token_hash = v_hash) THEN
        RAISE EXCEPTION 'Invalid lead token.';
    END IF;
    UPDATE public.checkout_leads
    SET current_step = p_current_step,
        selected_sharing = p_selected_sharing,
        estimated_amount = p_estimated_amount
    WHERE id = p_lead_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_checkout_lead(UUID, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_checkout_lead(UUID, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

COMMIT;

