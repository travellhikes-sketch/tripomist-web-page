-- Migration: Admin Features
-- Includes: deleted_booking_audit, business_contribution_rates, booking_contributions, secure_delete_booking_tx

-- 1. Deleted Booking Audit Table
CREATE TABLE IF NOT EXISTS public.deleted_booking_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    original_booking_id uuid NOT NULL,
    booking_snapshot jsonb NOT NULL,
    deleted_by uuid REFERENCES auth.users(id),
    deleted_at timestamptz DEFAULT now(),
    deletion_reason text
);

ALTER TABLE public.deleted_booking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deleted_booking_audit" ON public.deleted_booking_audit
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 2. Business Contribution Rates
CREATE TABLE IF NOT EXISTS public.business_contribution_rates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_channel text NOT NULL CHECK (sales_channel IN ('B2B', 'B2C')),
    amount numeric NOT NULL,
    effective_from timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_contribution_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage business_contribution_rates" ON public.business_contribution_rates
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 3. Booking Contributions Ledger
CREATE TABLE IF NOT EXISTS public.booking_contributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    sales_channel text NOT NULL,
    rate_id uuid REFERENCES public.business_contribution_rates(id),
    contribution_amount numeric NOT NULL,
    accrued_at timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    paid_at timestamptz,
    paid_by uuid REFERENCES auth.users(id),
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(booking_id) -- Only one contribution per booking natively
);

ALTER TABLE public.booking_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage booking_contributions" ON public.booking_contributions
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 4. Secure Delete RPC Function
CREATE OR REPLACE FUNCTION public.secure_delete_booking_tx(p_booking_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking record;
BEGIN
    -- Verify caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can execute this operation.';
    END IF;

    -- Fetch the booking record
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- 1. Snapshot the booking into the audit table
    INSERT INTO public.deleted_booking_audit (original_booking_id, booking_snapshot, deleted_by)
    VALUES (p_booking_id, row_to_json(v_booking)::jsonb, p_admin_id);

    -- 2. Explicitly delete child records (Do not blindly rely on CASCADE)
    DELETE FROM public.booking_travellers WHERE booking_id = p_booking_id;
    DELETE FROM public.service_recovery_cases WHERE booking_id = p_booking_id;
    DELETE FROM public.booking_contributions WHERE booking_id = p_booking_id;
    
    -- Note: If other tables (payments, vouchers) reference booking_id without CASCADE, 
    -- they must be explicitly deleted here too.
    -- e.g. DELETE FROM public.payments WHERE booking_id = p_booking_id;

    -- 3. Delete the booking itself
    DELETE FROM public.bookings WHERE id = p_booking_id;
    
END;
$$;
