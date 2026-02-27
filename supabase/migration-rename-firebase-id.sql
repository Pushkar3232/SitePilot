-- Migration Script: Rename firebase_id to supabase_auth_id
-- Run this if you have existing data in your users table

-- Step 1: Add the new column (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'supabase_auth_id') THEN
        ALTER TABLE users ADD COLUMN supabase_auth_id TEXT;
    END IF;
END $$;

-- Step 2: Copy data from firebase_id to supabase_auth_id
UPDATE users 
SET supabase_auth_id = firebase_id 
WHERE supabase_auth_id IS NULL AND firebase_id IS NOT NULL;

-- Step 3: Make supabase_auth_id NOT NULL (after data is copied)
ALTER TABLE users ALTER COLUMN supabase_auth_id SET NOT NULL;

-- Step 4: Add unique constraint to supabase_auth_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'users_supabase_auth_id_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_supabase_auth_id_key UNIQUE (supabase_auth_id);
    END IF;
END $$;

-- Step 5: Drop the old firebase_id column (uncomment after verifying data migration)
-- ALTER TABLE users DROP COLUMN IF EXISTS firebase_id;

SELECT 'Migration completed successfully. Please verify data and then uncomment the DROP COLUMN statement.' AS status;