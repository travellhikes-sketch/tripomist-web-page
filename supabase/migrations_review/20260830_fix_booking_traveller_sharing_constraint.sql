BEGIN;

ALTER TABLE public.booking_travellers
DROP CONSTRAINT IF EXISTS booking_travellers_sharing_type_check;

UPDATE public.booking_travellers
SET sharing_type = 'Double Sharing'
WHERE sharing_type = 'Double';

UPDATE public.booking_travellers
SET sharing_type = 'Triple Sharing'
WHERE sharing_type = 'Triple';

UPDATE public.booking_travellers
SET sharing_type = 'Quad Sharing'
WHERE sharing_type = 'Quad';

ALTER TABLE public.booking_travellers
ADD CONSTRAINT booking_travellers_sharing_type_check
CHECK (
  sharing_type IS NULL
  OR sharing_type IN (
    'Quad Sharing',
    'Triple Sharing',
    'Double Sharing'
  )
);

COMMIT;
