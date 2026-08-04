BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE package_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot change reviews.package_id type: existing linked reviews must be migrated first';
  END IF;
END
$$;

-- Note: No DROP CONSTRAINT is required here since `uuid` cannot reference a `bigint` column.
-- Thus, a foreign key constraint did not previously exist between reviews.package_id and Pakage.id.

ALTER TABLE public.reviews
  ALTER COLUMN package_id DROP DEFAULT,
  ALTER COLUMN package_id TYPE bigint USING NULL;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_package_id_fkey
FOREIGN KEY (package_id)
REFERENCES public."Pakage"(id)
ON DELETE SET NULL;

COMMIT;
