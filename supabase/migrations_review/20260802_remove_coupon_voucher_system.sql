-- Migration: Remove Coupon/Voucher System from TripoMist
-- File: supabase/migrations_review/20260802_remove_coupon_voucher_system.sql

BEGIN;

-- 1. Drop view if exists
DROP VIEW IF EXISTS public.customer_vouchers_view;

-- 2. Drop dependent tables
DROP TABLE IF EXISTS public.voucher_redemptions CASCADE;
DROP TABLE IF EXISTS public.voucher_reservations CASCADE;
DROP TABLE IF EXISTS public.voucher_internal_notes CASCADE;
DROP TABLE IF EXISTS public.coupon_attempt_limits CASCADE;

-- 3. Drop main vouchers table
DROP TABLE IF EXISTS public.vouchers CASCADE;

-- 4. Remove columns and constraints from bookings table
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS fk_bookings_voucher_id,
    DROP COLUMN IF EXISTS voucher_id;

-- 5. Drop old coupon/voucher related functions
DROP FUNCTION IF EXISTS public.is_coupon_attempt_blocked(TEXT);
DROP FUNCTION IF EXISTS public.record_failed_coupon_attempt(TEXT);
DROP FUNCTION IF EXISTS public.clear_coupon_attempts(TEXT);
DROP FUNCTION IF EXISTS public.reserve_coupon_for_checkout(UUID, TEXT);
DROP FUNCTION IF EXISTS public.finalize_full_coupon_checkout(UUID, UUID);
DROP FUNCTION IF EXISTS public.resolve_service_recovery_with_voucher(UUID, TEXT, NUMERIC, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS public.admin_cancel_booking_with_coupon(UUID, TEXT, TEXT, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS public.admin_create_service_recovery_with_coupon(UUID, TEXT, TEXT, TEXT, DATE, TEXT, BOOLEAN, NUMERIC, TIMESTAMPTZ, TEXT);

-- 6. Create simplified admin_cancel_booking function without coupon logic
CREATE OR REPLACE FUNCTION public.admin_cancel_booking(
    p_booking_id UUID,
    p_cancellation_reason TEXT,
    p_cancellation_notes TEXT DEFAULT NULL,
    p_refund_status TEXT DEFAULT 'Refund Pending'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_result JSONB;
BEGIN
    -- Authorization Check
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required.';
    END IF;

    -- Input validation
    IF p_cancellation_reason IS NULL OR length(trim(p_cancellation_reason)) = 0 THEN
        RAISE EXCEPTION 'Cancellation reason is required.';
    END IF;

    IF p_refund_status IS NULL THEN
        RAISE EXCEPTION 'Refund status is required.';
    END IF;

    IF p_refund_status NOT IN ('Not Applicable', 'No Refund', 'Refund Pending', 'Partially Refunded', 'Fully Refunded') THEN
        RAISE EXCEPTION 'Invalid refund status: %', p_refund_status;
    END IF;

    -- Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.booking_status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled.';
    END IF;

    -- Update booking status to cancelled
    UPDATE public.bookings
    SET booking_status = 'cancelled',
        payment_status = CASE WHEN p_refund_status = 'Fully Refunded' THEN 'refunded' ELSE payment_status END,
        cancellation_reason = trim(p_cancellation_reason),
        cancellation_notes = NULLIF(trim(p_cancellation_notes), ''),
        refund_status = p_refund_status,
        cancelled_at = NOW(),
        cancelled_by = v_admin_id
    WHERE id = p_booking_id;

    -- Insert into activity logs
    INSERT INTO public.booking_activity_logs (
        booking_id,
        action,
        field_name,
        old_value,
        new_value,
        changed_by,
        note
    ) VALUES (
        p_booking_id,
        'cancel',
        'booking_status',
        v_booking.booking_status || ' | ' || v_booking.payment_status,
        'cancelled' || ' | ' || CASE WHEN p_refund_status = 'Fully Refunded' THEN 'refunded' ELSE v_booking.payment_status END,
        v_admin_id,
        COALESCE(p_cancellation_reason, '') || ' (' || p_refund_status || ')'
    );

    v_result := jsonb_build_object(
        'booking_id', p_booking_id,
        'status', 'cancelled'
    );

    RETURN v_result;
END;
$$;

-- Grant execution to authenticated users for admin cancellation
REVOKE EXECUTE ON FUNCTION public.admin_cancel_booking(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_cancel_booking(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 7. Create simplified admin_create_service_recovery function without coupon logic
CREATE OR REPLACE FUNCTION public.admin_create_service_recovery(
    p_booking_id UUID,
    p_issue_title TEXT,
    p_issue_description TEXT,
    p_priority TEXT,
    p_incident_date DATE,
    p_internal_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin_id UUID;
    v_booking RECORD;
    v_case_id UUID;
    v_result JSONB;
BEGIN
    -- Authorization Check
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Must be logged in.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access required.';
    END IF;

    -- Validations
    IF p_issue_title IS NULL OR length(trim(p_issue_title)) = 0 THEN
        RAISE EXCEPTION 'Issue title is required.';
    END IF;

    IF p_issue_description IS NULL OR length(trim(p_issue_description)) = 0 THEN
        RAISE EXCEPTION 'Issue description is required.';
    END IF;

    IF p_priority IS NULL THEN
        RAISE EXCEPTION 'Priority is required.';
    END IF;

    IF p_priority NOT IN ('low', 'medium', 'high', 'critical') THEN
        RAISE EXCEPTION 'Invalid priority level: %', p_priority;
    END IF;

    IF p_incident_date IS NULL THEN
        RAISE EXCEPTION 'Incident date is required.';
    END IF;

    IF p_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Incident date cannot be in the future.';
    END IF;

    -- Lock and retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Create Service Recovery Case
    INSERT INTO public.service_recovery_cases (
        user_id,
        booking_id,
        issue_title,
        issue_description,
        priority,
        incident_date,
        internal_notes,
        created_by
    ) VALUES (
        v_booking.user_id,
        p_booking_id,
        trim(p_issue_title),
        trim(p_issue_description),
        p_priority,
        p_incident_date,
        trim(p_internal_notes),
        v_admin_id
    ) RETURNING id INTO v_case_id;

    v_result := jsonb_build_object(
        'success', true,
        'case_id', v_case_id
    );

    RETURN v_result;
END;
$$;

-- Grant execution to authenticated users
REVOKE EXECUTE ON FUNCTION public.admin_create_service_recovery(UUID, TEXT, TEXT, TEXT, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_service_recovery(UUID, TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;

COMMIT;
