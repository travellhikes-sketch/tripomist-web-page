BEGIN;

-- ============================================================================
-- TripoMist: Payment Security Cutover
-- File:    20260731_payment_security_cutover.sql
-- Phase:   CUTOVER — EXECUTE LAST, AFTER EDGE CHECKOUT AND FRONTEND ARE LIVE
-- Status:  REVIEW DRAFT — NOT YET APPROVED FOR EXECUTION
-- Author:  Schema Audit 2026-07-31
-- ============================================================================
--
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!                                                                        !!
-- !!   WARNING: DO NOT RUN THIS CUTOVER BEFORE SECURE CHECKOUT IS LIVE.     !!
-- !!                                                                        !!
-- !!   This file modifies the INSERT access on public.bookings and         !!
-- !!   public."Pakage". If run before the Edge Function is live,           !!
-- !!   normal customers will be unable to complete checkout.               !!
-- !!                                                                        !!
-- !!   REQUIRED BEFORE RUNNING:                                            !!
-- !!     1. Edge Function razorpay-checkout deployed and verified          !!
-- !!     2. Frontend checkout using Edge Function (not direct insert)      !!
-- !!     3. Separate future RPC migration deployed and verified             !!
-- !!        (reserve, release, finalize, cancel, service-recovery, etc.)   !!
-- !!     4. Admin manual booking flow tested and confirmed working         !!
-- !!     5. Staging smoke test: place a test booking end-to-end           !!
-- !!                                                                        !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
--
-- WHAT THIS FILE DOES:
--   1. Drops the development-era open INSERT policy on bookings
--      ("bookings_insert_test" or similar permissive insert policies)
--   2. Ensures anon and regular authenticated customers cannot INSERT
--      arbitrary booking rows directly through the Supabase client
--   3. Adds an explicit admin-only INSERT policy so manual bookings work
--   4. Drops all duplicate customer booking SELECT policies and recreates
--      exactly one authenticated own-bookings SELECT policy.
--   5. Drops the old public-all-read policy on "Pakage"
--   6. Recreates "Anyone can read active packages" for SELECT.
--   7. Preserves existing secure admin INSERT/UPDATE/DELETE policies on Pakage.
--   8. Creates a separate admin SELECT-all-packages policy for draft viewing.
--
-- WHAT THIS FILE DOES NOT DO:
--   - Does not modify update_checkout_lead or related RPCs
--   - Does not touch service_recovery_cases (already admin-only and secure)
--   - Does not touch the new voucher/payment tables (handled in schema file)
-- ============================================================================


-- ============================================================================
-- 1. BOOKINGS TABLE — REMOVE PERMISSIVE INSERT POLICIES
-- ============================================================================

-- Drop the test/development open-insert policy if it exists
DROP POLICY IF EXISTS "bookings_insert_test"                     ON public.bookings;

-- Drop any other known permissive policies that allow unauthenticated or
-- broadly-authenticated inserts (drop safely — will no-op if not present)
DROP POLICY IF EXISTS "Enable insert for authenticated users"     ON public.bookings;
DROP POLICY IF EXISTS "Public INSERT bookings"                    ON public.bookings;
DROP POLICY IF EXISTS "Authenticated INSERT bookings"             ON public.bookings;
DROP POLICY IF EXISTS "Customer INSERT bookings"                  ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings"                ON public.bookings;


-- ============================================================================
-- 2. BOOKINGS TABLE — ADMIN-ONLY INSERT (for manual bookings via admin panel)
-- ============================================================================

-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!  DO NOT RUN THIS CUTOVER BEFORE EDGE CHECKOUT AND FRONTEND ARE LIVE   !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

DROP POLICY IF EXISTS "Admin INSERT bookings"                     ON public.bookings;

CREATE POLICY "Admin INSERT bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- NOTE: After this cutover, the ONLY way for a normal customer to create a
-- booking is through the service_role Edge Function (razorpay-checkout),
-- which bypasses RLS. Customers have no direct INSERT path via the JS client.


-- ============================================================================
-- 3. BOOKINGS TABLE — DE-DUPLICATE AND TIGHTEN SELECT POLICIES
-- ============================================================================

-- Drop all duplicate customer booking SELECT policies
DROP POLICY IF EXISTS "Customer Read Own Bookings"                ON public.bookings;
DROP POLICY IF EXISTS "Customer SELECT own bookings"              ON public.bookings;
DROP POLICY IF EXISTS "customers_select_own_bookings"             ON public.bookings;

-- Create exactly one authenticated own-bookings SELECT policy
CREATE POLICY "Customer SELECT own bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (
        auth.role() = 'authenticated'
        AND user_id IS NOT NULL
        AND user_id = auth.uid()
    );


-- ============================================================================
-- 4. PAKAGE TABLE — REMOVE OLD PERMISSIVE READ POLICY
-- ============================================================================

-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!  DO NOT RUN THIS CUTOVER BEFORE EDGE CHECKOUT AND FRONTEND ARE LIVE   !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

-- Drop the old broadly-named policy that allows all users to read all packages
-- regardless of active status
DROP POLICY IF EXISTS "Enable read access for all users"          ON public."Pakage";


-- ============================================================================
-- 5. PAKAGE TABLE — RECREATE PUBLIC SELECT & ADMIN SELECT POLICIES
-- ============================================================================

-- Drop existing public read policy to recreate it cleanly
DROP POLICY IF EXISTS "Anyone can read active packages"           ON public."Pakage";

-- Public users (anon and authenticated) may only see packages where status = 'active'
CREATE POLICY "Anyone can read active packages"
    ON public."Pakage"
    FOR SELECT
    -- Applies to both anon and authenticated roles
    USING (status = 'active');

-- Drop existing admin SELECT policy to recreate it cleanly
DROP POLICY IF EXISTS "Admin SELECT packages"                     ON public."Pakage";
DROP POLICY IF EXISTS "Admin SELECT all packages"                 ON public."Pakage";

-- Admins can SELECT all packages (including draft/inactive packages)
CREATE POLICY "Admin SELECT all packages"
    ON public."Pakage"
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- NOTE: The following admin-only policies for mutations are preserved as-is:
--   "Admin full access Pakage" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())
--   (or individual INSERT/UPDATE/DELETE policies that exist already)
--
-- We do not create another FOR ALL admin policy.

-- Ensure RLS is enabled on Pakage (idempotent)
ALTER TABLE public."Pakage" ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- END OF CUTOVER FILE
-- ============================================================================
--
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !!                                                                        !!
-- !!   REMINDER: DO NOT RUN THIS CUTOVER BEFORE SECURE CHECKOUT IS LIVE.    !!
-- !!                                                                        !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- ============================================================================

COMMIT;
