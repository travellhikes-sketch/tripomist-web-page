-- Migration: Enable INSERT and UPDATE for authenticated admin users on homepage_sections
-- This fixes the issue where creating a dynamic page via WebsiteLinkPicker fails due to RLS blocking INSERT.

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."homepage_sections";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."homepage_sections";

CREATE POLICY "Enable insert for authenticated users" ON "public"."homepage_sections"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for authenticated users" ON "public"."homepage_sections"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
