-- Clean up duplicate user_credits rows
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY credits DESC, updated_at DESC
    ) as row_num
  FROM public.user_credits
)
DELETE FROM public.user_credits
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Ensure the unique constraint exists and is enforced
DO $$
BEGIN
    -- Drop the constraint if it exists (to ensure we can recreate it cleanly)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_credits_user_id_key') THEN
        ALTER TABLE public.user_credits DROP CONSTRAINT user_credits_user_id_key;
    END IF;

    -- Add the unique constraint
    ALTER TABLE public.user_credits
    ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);
END $$;